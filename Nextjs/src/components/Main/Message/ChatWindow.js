import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow({ 
  conversation, 
  currentUser, 
  socket, 
  sendMessage, 
  onNewMessage,
  showMobileHeader = true
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(null);
  const [pendingMessages, setPendingMessages] = useState(new Map());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversation && currentUser && socket) {
      loadMessages();
      setPendingMessages(new Map());
      
      socket.emit('join_conversation', {
        conversation_id: conversation.conversation_id,
        user_id: currentUser.id
      });
      
      socket.emit('join_user', {
        user_id: currentUser.id
      });
    }
  }, [conversation, currentUser, socket]);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        setConnectionStatus('connected');
        console.log('🔌 WebSocket connected');
      });
      
      socket.on('disconnect', () => {
        setConnectionStatus('disconnected');
        console.log('❌ WebSocket disconnected');
      });
      
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleTyping);
      socket.on('message_sent', handleMessageSent);
      
      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleTyping);
        socket.off('message_sent', handleMessageSent);
      };
    } else {
      setConnectionStatus('disconnected');
    }
  }, [socket, conversation]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/conversations/${conversation.conversation_id}/chats`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.chats) {
        setMessages(data.chats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (messageData) => {
    console.log('Received new_message:', messageData);
    
    if (messageData.conversation_id === conversation.conversation_id) {
      if (messageData.sender_id !== currentUser.id) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === messageData.id);
          if (!exists) {
            return [...prev, messageData];
          }
          return prev;
        });
        onNewMessage(messageData);
      }
    }
  };

  const handleMessageSent = (data) => {
    console.log('Received message_sent confirmation:', data);
    
    if (data.success && data.message_data && data.tempId) {
      const tempId = data.tempId;
      
      if (pendingMessages.has(tempId)) {
        console.log('✅ Confirming WebSocket message:', tempId);
        
        setMessages(prev => prev.map(msg => 
          msg.tempId === tempId 
            ? { 
                ...data.message_data, 
                id: data.message_data.id,
                isPending: false,
                failed: false
              }
            : msg
        ));
        
        setPendingMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
        
        onNewMessage(data.message_data);
      } else {
        console.log('⚠️ Received confirmation for unknown tempId:', tempId);
      }
    }
  };

  const handleTyping = (data) => {
    if (data.conversation_id === conversation.conversation_id && 
        data.user_id !== currentUser.id) {
      if (data.is_typing) {
        setTyping(data.user_id);
        setTimeout(() => setTyping(null), 3000);
      } else {
        setTyping(null);
      }
    }
  };

  const handleSendMessage = async (content) => {
    const tempId = `temp_${currentUser.id}_${Date.now()}_${Math.random()}`;
    
    const tempMessage = {
      tempId: tempId,
      id: tempId,
      sender_id: currentUser.id,
      content: content,
      send_at: new Date().toISOString(),
      conversation_id: conversation.conversation_id,
      isPending: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setPendingMessages(prev => new Map([...prev, [tempId, tempMessage]]));

    const messageData = {
      sender_id: currentUser.id,
      recipient_id: conversation.other_user.id,
      content: content,
      conversation_id: conversation.conversation_id,
      tempId: tempId
    };

    console.log('📤 Sending message:', messageData);
    
    let messageHandled = false;
    
    const markMessageAsSent = (messageData, source) => {
      if (messageHandled) {
        console.log(`⚠️ Message already handled, ignoring ${source} response`);
        return;
      }
      
      messageHandled = true;
      console.log(`✅ Message sent via ${source}:`, messageData);
      
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { 
              ...messageData, 
              id: messageData.id,
              isPending: false,
              failed: false
            }
          : msg
      ));
      
      setPendingMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      
      onNewMessage(messageData);
    };
    
    const markMessageAsFailed = () => {
      if (messageHandled) return;
      
      messageHandled = true;
      console.log('❌ Message failed');
      
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, failed: true, isPending: false }
          : msg
      ));
      
      setPendingMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
    };
    
    if (socket && socket.connected) {
      console.log('🔌 Trying WebSocket...');
      
      const handleWebSocketConfirmation = (data) => {
        if (data.tempId === tempId && data.success && data.message_data) {
          markMessageAsSent(data.message_data, 'WebSocket');
        }
      };
      
      socket.on('message_sent', handleWebSocketConfirmation);
      
      sendMessage(messageData);
      
      setTimeout(() => {
        socket.off('message_sent', handleWebSocketConfirmation);
        
        if (!messageHandled) {
          console.log('⏰ WebSocket timeout, trying HTTP fallback...');
        }
      }, 2000);
      
    } else {
      console.log('❌ WebSocket not connected, using HTTP directly');
      
      try {
        const response = await fetch('http://localhost:5000/api/chats/private', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender_id: currentUser.id,
            recipient_id: conversation.other_user.id,
            content: content
          })
        });

        const data = await response.json();
        
        if (response.ok && data.success && data.chat) {
          markMessageAsSent(data.chat, 'HTTP');
        } else {
          markMessageAsFailed();
        }
        
      } catch (error) {
        console.error('❌ HTTP direct failed:', error);
        markMessageAsFailed();
      }
    }
  };

  const handleTypingStart = () => {
    if (socket) {
      socket.emit('typing', {
        conversation_id: conversation.conversation_id,
        user_id: currentUser.id,
        is_typing: true
      });
    }
  };

  const handleTypingStop = () => {
    if (socket) {
      socket.emit('typing', {
        conversation_id: conversation.conversation_id,
        user_id: currentUser.id,
        is_typing: false
      });
    }
  };

  const renderSubscriptionBadge = (user) => {
    const subscription = user?.subscription || 'free';
    
    if (subscription === 'plus') {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4">
          <Image
            src="/plusbadge.png"
            alt="Badge Plus"
            width={16}
            height={16}
            className="w-full h-full object-contain"
          />
        </div>
      );
    } else if (subscription === 'premium') {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4">
          <Image
            src="/premiumbadge.png"
            alt="Badge Premium"
            width={16}
            height={16}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    
    return null;
  };

  const renderProfilePicture = (user) => {
    const profilePicture = user?.profile_picture || user?.profilePicture;
    
    if (!profilePicture) {
      return (
        <div className="relative">
          <Image
            src="/defaultuserpfp.png"
            alt={`Photo de profil de ${user?.first_name || user?.username || user?.email || 'Utilisateur'}`}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#333]"
          />
          {renderSubscriptionBadge(user)}
        </div>
      );
    }

    return (
      <div className="relative">
        <Image
          src={profilePicture}
          alt={`Photo de profil de ${user?.first_name || user?.username || user?.email || 'Utilisateur'}`}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border-2 border-[#333]"
          onError={(e) => {
            e.target.src = '/defaultuserpfp.png';
          }}
        />
        {renderSubscriptionBadge(user)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1b1b1b]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90EE90]"></div>
          <p className="text-gray-400 text-sm">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1b1b1b]">
      {/* En-tête desktop toujours visible */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:flex items-center p-4 border-b border-[#333] bg-[#1b1b1b] shadow-sm"
      >
        {renderProfilePicture(conversation.other_user)}
        <div className="ml-3 flex-1">
          <h2 className="text-lg font-semibold text-white">
            {conversation.other_user?.first_name && conversation.other_user?.last_name
              ? `${conversation.other_user.first_name} ${conversation.other_user.last_name}`
              : conversation.other_user?.username || conversation.other_user?.email || 'Utilisateur inconnu'}
          </h2>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-400">
              @{conversation.other_user?.username || conversation.other_user?.email?.split('@')[0]}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#141414]">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center h-full text-gray-400"
          >
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 overflow-hidden rounded-full border-2 border-[#333]">
                {renderProfilePicture(conversation.other_user)}
              </div>
              <p className="text-sm font-medium text-gray-300 mb-2">Commencez votre conversation</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Envoyez votre premier message à {conversation.other_user?.first_name || conversation.other_user?.username || 'cet utilisateur'}
              </p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.tempId || message.id}
                message={message}
                isOwn={message.sender_id === currentUser.id}
                showAvatar={
                  index === 0 || 
                  messages[index - 1].sender_id !== message.sender_id
                }
                otherUser={conversation.other_user}
                currentUser={currentUser}
                index={messages.length - 1 - index} // Inversion de l'index pour l'effet du bas vers le haut
                isPending={message.isPending}
                failed={message.failed}
              />
            ))}
          </AnimatePresence>
        )}
        
        {/* Indicateur de frappe */}
        <AnimatePresence>
          {typing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-3 text-gray-400"
            >
              <div className="w-8 h-8 overflow-hidden rounded-full border border-[#333]">
                <Image
                  src={conversation.other_user?.profile_picture || '/defaultuserpfp.png'}
                  alt="Photo de profil"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-[#2a2a2a] rounded-2xl px-4 py-2 flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 ml-2">écrit...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        currentUser={currentUser}
      />
    </div>
  );
}
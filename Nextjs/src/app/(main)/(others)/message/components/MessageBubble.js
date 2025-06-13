import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow({ 
  conversation, 
  currentUser, 
  socket, 
  sendMessage, 
  onNewMessage 
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(null);
  const [pendingMessages, setPendingMessages] = useState(new Map()); // Utiliser Map au lieu de Set
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
      // Nettoyer les messages en attente quand on change de conversation
      setPendingMessages(new Map());
      
      // IMPORTANT: Rejoindre la conversation pour recevoir les messages
      socket.emit('join_conversation', {
        conversation_id: conversation.conversation_id,
        user_id: currentUser.id
      });
      
      // Rejoindre aussi la room utilisateur pour les notifications
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
      // Vérifier si c'est un message de quelqu'un d'autre
      if (messageData.sender_id !== currentUser.id) {
        setMessages(prev => {
          // Vérifier si le message n'existe pas déjà
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
        
        // Remplacer le message temporaire par le message réel
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
        
        // Supprimer de la liste des messages en attente
        setPendingMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
        
        // Informer le parent
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
    
    // Ajouter le message temporaire
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
    
    // Variable pour suivre l'état de l'envoi
    let messageHandled = false;
    
    // Fonction pour marquer le message comme envoyé (évite les doublons)
    const markMessageAsSent = (messageData, source) => {
      if (messageHandled) {
        console.log(`⚠️ Message already handled, ignoring ${source} response`);
        return;
      }
      
      messageHandled = true;
      console.log(`✅ Message sent via ${source}:`, messageData);
      
      // Remplacer le message temporaire par le message réel
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
      
      // Supprimer de la liste des messages en attente
      setPendingMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      
      // Informer le parent
      onNewMessage(messageData);
    };
    
    // Fonction pour marquer le message comme échoué
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
    
    // Essayer WebSocket en premier si connecté
    if (socket && socket.connected) {
      console.log('🔌 Trying WebSocket...');
      
      // Écouter la confirmation WebSocket
      const handleWebSocketConfirmation = (data) => {
        if (data.tempId === tempId && data.success && data.message_data) {
          markMessageAsSent(data.message_data, 'WebSocket');
        }
      };
      
      // Ajouter l'écouteur temporaire
      socket.on('message_sent', handleWebSocketConfirmation);
      
      // Envoyer via WebSocket
      sendMessage(messageData);
      
      // Timeout pour WebSocket (plus court)
      setTimeout(() => {
        // Nettoyer l'écouteur
        socket.off('message_sent', handleWebSocketConfirmation);
        
        // Si pas encore traité, essayer HTTP
        if (!messageHandled) {
          console.log('⏰ WebSocket timeout, trying HTTP fallback...');
          
          fetch('http://localhost:5000/api/chats/private', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender_id: currentUser.id,
              recipient_id: conversation.other_user.id,
              content: content
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success && data.chat) {
              markMessageAsSent(data.chat, 'HTTP fallback');
            } else {
              markMessageAsFailed();
            }
          })
          .catch(error => {
            console.error('❌ HTTP fallback failed:', error);
            markMessageAsFailed();
          });
        }
      }, 2000); // Réduire à 2 secondes
      
    } else {
      // WebSocket pas connecté, utiliser HTTP directement
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
          markMessageAsSent(data.chat, 'HTTP direct');
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

  const getInitials = (user) => {
    if (!user) return '?';
    
    if (user.first_name) {
      return user.first_name[0].toUpperCase() + (user.last_name?.[0] || '').toUpperCase();
    }
    
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return '?';
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
      {/* En-tête de la conversation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center p-4 border-b border-[#333] bg-[#1b1b1b] shadow-sm"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-[#90EE90] to-[#7CD37C] rounded-full flex items-center justify-center text-black font-semibold shadow-lg">
          {getInitials(conversation.other_user)}
        </div>
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
            <div className="flex items-center text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
              En ligne
            </div>
          </div>
        </div>
        
        {/* Actions de conversation */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
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
              <div className="w-16 h-16 mx-auto mb-4 bg-[#333] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#90EE90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
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
                index={index}
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
              <div className="w-8 h-8 bg-[#333] rounded-full flex items-center justify-center text-xs font-semibold">
                {getInitials(conversation.other_user)}
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
      />
    </div>
  );
}
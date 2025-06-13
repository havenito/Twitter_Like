import { useRef, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Éviter les connexions multiples
    if (socketRef.current?.connected) {
      return;
    }

    // Obtenir l'URL WebSocket depuis les variables d'environnement
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:5000';

    // Créer la connexion socket
    socketRef.current = io(websocketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true, // Forcer une nouvelle connexion
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('💥 Socket connection error:', error);
      setIsConnected(false);
    });

    // Listener pour les erreurs de message
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Listener pour les confirmations de statut
    socket.on('status', (data) => {
      console.log('📋 Socket status:', data);
    });

    return () => {
      if (socket && socket.connected) {
        console.log('🔌 Disconnecting socket');
        socket.disconnect();
      }
    };
  }, []);

  const sendMessage = (messageData) => {
    if (socketRef.current && isConnected) {
      console.log('📤 Sending message via socket:', messageData);
      socketRef.current.emit('send_message', messageData);
      return true;
    } else {
      console.error('❌ Socket not connected, cannot send message. Connected:', isConnected);
      return false;
    }
  };

  const joinConversation = (conversationId, userId) => {
    if (socketRef.current && isConnected) {
      console.log('🚪 Joining conversation:', conversationId);
      socketRef.current.emit('join_conversation', {
        conversation_id: conversationId,
        user_id: userId
      });
      return true;
    }
    return false;
  };

  const leaveConversation = (conversationId, userId) => {
    if (socketRef.current && isConnected) {
      console.log('🚪 Leaving conversation:', conversationId);
      socketRef.current.emit('leave_conversation', {
        conversation_id: conversationId,
        user_id: userId
      });
      return true;
    }
    return false;
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation
  };
}
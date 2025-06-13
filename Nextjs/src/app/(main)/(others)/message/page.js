'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import ConversationList from '../../../../components/Main/Message/ConversationList';
import ChatWindow from '../../../../components/Main/Message/ChatWindow';
import NewConversationModal from '../../../../components/Main/Message/NewConversationModal';
import { useSocket } from '../../../../hooks/useSocket';

export default function MessagePage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Utiliser NextAuth session comme fallback
  const { data: session, status } = useSession();

  const { socket, sendMessage, joinConversation, leaveConversation } = useSocket();

  useEffect(() => {
    // n'agir qu'une fois NextAuth a fini de charger
    if (status === 'loading') return;

    if (session?.user) {
      // Reconstruire l'utilisateur à partir de la session
      const sessionUser = {
        id: session.user.id || session.user.sub,
        email: session.user.email,
        first_name: session.user.first_name || session.user.name?.split(' ')[0],
        last_name: session.user.last_name  || session.user.name?.split(' ')[1],
        pseudo: session.user.pseudo       || session.user.username,
        profile_picture: session.user.image || session.user.profile_picture,
        subscription: session.user.subscription || 'free' // S'assurer que subscription est inclus
      };

      console.log('Current user session:', sessionUser); // Debug
      setCurrentUser(sessionUser);
      loadConversations(sessionUser.id);

      // Optionnel : remettre à jour le localStorage
      localStorage.setItem('user', JSON.stringify(sessionUser));
    } else {
      // pas de session => plus de chargement
      setLoading(false);
    }
  }, [session, status]);

  const loadConversations = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chats/conversations/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    if (selectedConversation?.conversation_id) {
      leaveConversation(selectedConversation.conversation_id, currentUser.id);
    }
    
    setSelectedConversation(conversation);
    joinConversation(conversation.conversation_id, currentUser.id);
  };

  const handleBackToConversations = () => {
    if (selectedConversation?.conversation_id) {
      leaveConversation(selectedConversation.conversation_id, currentUser.id);
    }
    setSelectedConversation(null);
  };

  const handleNewMessage = (messageData) => {
    setConversations(prev => prev.map(conv => 
      conv.conversation_id === messageData.conversation_id 
        ? { ...conv, last_message: messageData }
        : conv
    ));
  };

  const handleCreateConversation = (newConversation) => {
    console.log('Handling new conversation:', newConversation);
    
    const existingConversation = conversations.find(
      conv => conv.conversation_id === newConversation.conversation_id
    );

    if (existingConversation) {
      handleConversationSelect(existingConversation);
    } else {
      setConversations(prev => [newConversation, ...prev]);
      handleConversationSelect(newConversation);
    }
  };

  // Écran de chargement
  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1b1b1b]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90EE90]"></div>
          <p className="text-gray-400 text-sm">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  // Écran de connexion requis
  if (!currentUser && status !== 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1b1b1b]">
        <div className="text-center text-gray-400 max-w-md mx-auto px-6">
          <svg className="w-20 h-20 mx-auto mb-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-medium text-white mb-3">Connexion requise</h3>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Vous devez être connecté pour accéder à vos messages privés.
          </p>
          
          <div className="space-y-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full px-6 py-3 bg-[#90EE90] text-black rounded-xl font-semibold hover:bg-[#7CD37C] transition-colors shadow-lg"
            >
              Se connecter
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-[#333] text-white rounded-xl font-semibold hover:bg-[#444] transition-colors"
            >
              Retour à l'accueil
            </motion.button>
          </div>

          {/* Debug info en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-[#2a2a2a] rounded-xl text-left">
              <h4 className="text-xs font-semibold text-[#90EE90] mb-2">Debug Info:</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Session status: {status}</div>
                <div>Session user: {session?.user ? 'Present' : 'Absent'}</div>
                <div>LocalStorage user: {localStorage.getItem('user') ? 'Present' : 'Absent'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-76px)] bg-[#1b1b1b] relative">
      {/* Liste des conversations - Masquée sur mobile quand une conversation est sélectionnée */}
      <div className={`w-full md:w-1/3 border-r border-[#333] bg-[#1b1b1b] flex flex-col ${
        selectedConversation ? 'hidden md:flex' : 'flex'
      }`}>
        {/* En-tête avec bouton nouvelle conversation */}
        <div className="p-4 border-b border-[#333] bg-[#1b1b1b] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-white">Messages</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewConversationModal(true)}
              className="p-2 bg-[#90EE90] text-black rounded-full hover:bg-[#7CD37C] transition-colors shadow-lg"
              title="Nouvelle conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </motion.button>
          </div>
          <p className="text-sm text-gray-400">
            Connecté en tant que <span className="text-[#90EE90]">
              {currentUser?.first_name && currentUser?.last_name 
                ? `${currentUser.first_name} ${currentUser.last_name}`
                : currentUser?.pseudo || currentUser?.email}
            </span>
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
            currentUser={currentUser}
            onNewConversation={() => setShowNewConversationModal(true)}
          />
        </div>
      </div>

      {/* Fenêtre de chat - Affichée sur toute la largeur sur mobile quand une conversation est sélectionnée */}
      <div className={`flex-1 flex flex-col ${
        selectedConversation ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedConversation ? (
          <>
            {/* En-tête mobile avec bouton retour */}
            <div className="md:hidden flex items-center p-4 border-b border-[#333] bg-[#1b1b1b] flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToConversations}
                className="flex items-center justify-center w-10 h-10 bg-[#333] text-white rounded-full hover:bg-[#444] transition-colors mr-3"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              </motion.button>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white truncate">
                  {selectedConversation.other_user?.first_name && selectedConversation.other_user?.last_name
                    ? `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`
                    : selectedConversation.other_user?.username || selectedConversation.other_user?.email || 'Utilisateur inconnu'}
                </h2>
                <p className="text-sm text-gray-400 truncate">
                  @{selectedConversation.other_user?.username || selectedConversation.other_user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
            
            {/* Fenêtre de chat avec hauteur contrainte */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                conversation={selectedConversation}
                currentUser={currentUser}
                socket={socket}
                sendMessage={sendMessage}
                onNewMessage={handleNewMessage}
                showMobileHeader={false} // Désactiver l'en-tête dans ChatWindow sur mobile
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 bg-[#1b1b1b]">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-20 h-20 mx-auto mb-6 bg-[#333] rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-[#90EE90]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-3">Sélectionnez une conversation</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Choisissez une conversation dans la liste pour commencer à discuter avec vos contacts.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewConversationModal(true)}
                className="px-6 py-3 bg-[#90EE90] text-black rounded-xl font-semibold hover:bg-[#7CD37C] transition-colors shadow-lg"
              >
                Nouvelle conversation
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Modal nouvelle conversation */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleCreateConversation}
        currentUser={currentUser}
      />
    </div>
  );
}
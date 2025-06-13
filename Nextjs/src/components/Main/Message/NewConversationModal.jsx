import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function NewConversationModal({ isOpen, onClose, onCreateConversation, currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Filtrer l'utilisateur actuel (vérification plus robuste)
      const filteredUsers = data.filter(user => {
        if (!currentUser) return true; // Si pas d'utilisateur actuel, montrer tous
        return user.id !== currentUser.id;
      });
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.pseudo?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

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
    
    // Pas de badge pour 'free'
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

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleCreateConversation = async () => {
    // Vérifications de sécurité
    if (!selectedUser) {
      console.error('Aucun utilisateur sélectionné');
      return;
    }

    if (!currentUser || !currentUser.id) {
      console.error('Utilisateur actuel non défini');
      alert('Erreur: Utilisateur non connecté. Veuillez vous reconnecter.');
      return;
    }

    try {
      // Créer un ID de conversation unique basé sur les IDs des utilisateurs
      const sorted_ids = [currentUser.id, selectedUser.id].sort((a, b) => a - b);
      const conversation_id = parseInt(`${sorted_ids[0]}${sorted_ids[1].toString().padStart(3, '0')}`);

      // Créer une nouvelle conversation
      const newConversation = {
        conversation_id: conversation_id,
        other_user: {
          id: selectedUser.id,
          username: selectedUser.pseudo || selectedUser.username,
          email: selectedUser.email,
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          profile_picture: selectedUser.profile_picture,
          subscription: selectedUser.subscription
        },
        last_message: null,
        unread_count: 0,
        total_messages: 0
      };

      console.log('Création de conversation:', newConversation);
      onCreateConversation(newConversation);
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      alert('Erreur lors de la création de la conversation. Veuillez réessayer.');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedUser(null);
    setSearchTerm('');
  };

  // Ne pas afficher le modal si pas d'utilisateur connecté
  if (!isOpen || !currentUser) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1b1b1b] rounded-2xl shadow-2xl w-full max-w-md border border-[#333]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-[#333]">
            <h2 className="text-xl font-semibold text-white">Nouvelle conversation</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="p-6 border-b border-[#333]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher des utilisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 pl-10 pr-4 py-3 rounded-xl border border-[#333] focus:outline-none focus:border-[#90EE90] focus:ring-2 focus:ring-[#90EE90] focus:ring-opacity-20 transition-all"
              />
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90EE90]"></div>
                  <p className="text-gray-400 text-sm">Chargement des utilisateurs...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-300 mb-1">
                    {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {searchTerm ? 'Essayez un autre terme de recherche' : 'Il n\'y a aucun autre utilisateur à contacter'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleUserSelect(user)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedUser?.id === user.id
                        ? 'bg-[#90EE90] bg-opacity-20 border border-[#90EE90]'
                        : 'hover:bg-[#2a2a2a] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar avec badge */}
                      <div className="flex-shrink-0">
                        {renderProfilePicture(user)}
                      </div>

                      {/* Informations utilisateur */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-white truncate">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.pseudo || user.username || user.email}
                          </h3>
                          {user.private && (
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          @{user.pseudo || user.username || user.email?.split('@')[0]}
                        </p>
                        {user.biography && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {user.biography}
                          </p>
                        )}
                      </div>

                      {/* Indicateur de sélection */}
                      {selectedUser?.id === user.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-[#90EE90] rounded-full flex items-center justify-center flex-shrink-0"
                        >
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t border-[#333]">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-xl transition-colors"
            >
              Annuler
            </button>
            <motion.button
              onClick={handleCreateConversation}
              disabled={!selectedUser}
              whileHover={selectedUser ? { scale: 1.05 } : {}}
              whileTap={selectedUser ? { scale: 0.95 } : {}}
              className={`px-6 py-2 rounded-xl font-semibold transition-all duration-200 ${
                selectedUser
                  ? 'bg-[#90EE90] text-black hover:bg-[#7CD37C] shadow-lg'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Créer conversation
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
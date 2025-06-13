import { motion } from 'framer-motion';
import Image from 'next/image';

export default function ConversationList({ 
  conversations, 
  selectedConversation, 
  onConversationSelect,
  currentUser,
  onNewConversation 
}) {
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'maintenant';
      if (diffMins < 60) return `${diffMins}min`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}j`;
      
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short'
      }).format(date);
    } catch (error) {
      return '';
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength 
      ? message.substring(0, maxLength) + '...' 
      : message;
  };

  const formatMessageCount = (count) => {
    if (!count || count === 0) return '0';
    return count > 99 ? '99+' : count.toString();
  };

  const renderSubscriptionBadge = (user) => {
    const subscription = user?.subscription || 'free';
    
    // Debug pour voir la valeur
    console.log('Debug subscription badge:', user?.email, 'subscription:', subscription);
    
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
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
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
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
          onError={(e) => {
            e.target.src = '/defaultuserpfp.png';
          }}
        />
        {renderSubscriptionBadge(user)}
      </div>
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#333] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#90EE90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-300 mb-2">Aucune conversation</p>
          <p className="text-xs text-gray-500 mb-4">Commencez une nouvelle conversation pour voir vos messages</p>
          {onNewConversation && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewConversation}
              className="px-4 py-2 bg-[#90EE90] text-black rounded-xl text-sm font-semibold hover:bg-[#7CD37C] transition-colors shadow-lg"
            >
              Nouvelle conversation
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation, index) => (
        <motion.div
          key={conversation.conversation_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onConversationSelect(conversation)}
          className={`p-4 border-b border-[#333] cursor-pointer transition-all duration-200 hover:bg-[#262626] ${
            selectedConversation?.conversation_id === conversation.conversation_id
              ? 'bg-[#2a2a2a] border-l-4 border-l-[#90EE90]'
              : ''
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Avatar avec photo de profil et badge */}
            <div className="flex-shrink-0 relative">
              {renderProfilePicture(conversation.other_user)}
            </div>

            {/* Contenu de la conversation */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-white truncate">
                  {conversation.other_user?.first_name && conversation.other_user?.last_name
                    ? `${conversation.other_user.first_name} ${conversation.other_user.last_name}`
                    : conversation.other_user?.username || conversation.other_user?.email || 'Utilisateur inconnu'}
                </h3>
                {conversation.last_message && (
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatLastMessageTime(conversation.last_message.send_at)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {conversation.last_message ? (
                    <p className="text-sm text-gray-400 truncate">
                      {conversation.last_message.sender_id === currentUser?.id && (
                        <span className="text-[#90EE90]">Vous: </span>
                      )}
                      {truncateMessage(conversation.last_message.content)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Nouvelle conversation
                    </p>
                  )}
                </div>

                {/* Indicateurs */}
                <div className="flex items-center space-x-2 ml-2">
                  {conversation.unread_count > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-black bg-[#90EE90] rounded-full min-w-[20px]"
                    >
                      {formatMessageCount(conversation.unread_count)}
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Statistiques de la conversation */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-600">
                  {formatMessageCount(conversation.total_messages)} message{(conversation.total_messages || 0) > 1 ? 's' : ''}
                </span>
                
                {selectedConversation?.conversation_id === conversation.conversation_id && (
                  <div className="flex items-center text-xs text-[#90EE90]">
                    <div className="w-2 h-2 bg-[#90EE90] rounded-full mr-1 animate-pulse"></div>
                    Ouverte
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
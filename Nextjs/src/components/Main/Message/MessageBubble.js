import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar, 
  otherUser, 
  currentUser,
  index, 
  isPending = false, 
  failed = false 
}) {
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Gérer différents formats de date
      let date;
      if (timestamp.endsWith('Z')) {
        // Format UTC avec Z
        date = new Date(timestamp);
      } else if (timestamp.includes('+')) {
        // Format avec timezone
        date = new Date(timestamp);
      } else {
        // Format ISO sans timezone, ajouter Z pour UTC
        date = new Date(timestamp + (timestamp.includes('T') ? 'Z' : ''));
      }
      
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
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error, 'timestamp:', timestamp);
      return '';
    }
  };

  const renderSubscriptionBadge = (user) => {
    const subscription = user?.subscription || 'free';
    
    if (subscription === 'plus') {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
          <Image
            src="/plusbadge.png"
            alt="Badge Plus"
            width={12}
            height={12}
            className="w-full h-full object-contain"
          />
        </div>
      );
    } else if (subscription === 'premium') {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
          <Image
            src="/premiumbadge.png"
            alt="Badge Premium"
            width={12}
            height={12}
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
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover border border-[#333]"
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
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover border border-[#333]"
          onError={(e) => {
            e.target.src = '/defaultuserpfp.png';
          }}
        />
        {renderSubscriptionBadge(user)}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end space-x-2 group`}
    >
      {/* Avatar pour les autres utilisateurs */}
      {!isOwn && showAvatar && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-shrink-0"
        >
          {renderProfilePicture(otherUser)}
        </motion.div>
      )}
      
      {/* Espace pour maintenir l'alignement */}
      {!isOwn && !showAvatar && <div className="w-8" />}

      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`px-4 py-3 rounded-2xl shadow-lg relative ${
            failed 
              ? 'bg-red-500 bg-opacity-20 border border-red-500 text-red-200'
              : isOwn
                ? isPending 
                  ? 'bg-gradient-to-r from-[#90EE90] to-[#7CD37C] opacity-70 text-black ml-2'
                  : 'bg-gradient-to-r from-[#90EE90] to-[#7CD37C] text-black ml-2'
                : 'bg-[#2a2a2a] text-white border border-[#333] mr-2'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
          
          {/* Triangle de bulle */}
          <div className={`absolute bottom-0 ${
            isOwn 
              ? 'right-0 translate-x-1 translate-y-1' 
              : 'left-0 -translate-x-1 translate-y-1'
          }`}>
            <div className={`w-0 h-0 ${
              failed
                ? isOwn
                  ? 'border-l-[8px] border-l-transparent border-t-[8px] border-t-red-500'
                  : 'border-r-[8px] border-r-transparent border-t-[8px] border-t-red-500'
                : isOwn
                  ? 'border-l-[8px] border-l-transparent border-t-[8px] border-t-[#7CD37C]'
                  : 'border-r-[8px] border-r-transparent border-t-[8px] border-t-[#2a2a2a]'
            }`}></div>
          </div>

          {/* Indicateur d'état pour les messages de l'utilisateur */}
          {isOwn && (
            <div className="absolute -bottom-1 -right-1">
              {isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                />
              ) : failed ? (
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </motion.div>
        
        {/* Timestamp avec animation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`mt-1 text-xs px-2 ${isOwn ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            failed ? 'text-red-400' : 'text-gray-500'
          }`}
        >
          {failed ? 'Échec de l\'envoi' : isPending ? 'Envoi...' : formatMessageTime(message.send_at)}
        </motion.div>
      </div>
    </motion.div>
  );
}
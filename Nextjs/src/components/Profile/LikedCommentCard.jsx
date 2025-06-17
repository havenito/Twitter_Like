import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faPlay } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CommentLikeButton from '../Main/Post/CommentLikeButton';
import MediaModal from '../MediaModal';

const LikedCommentCard = ({ comment }) => {
  const router = useRouter();
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getDisplayName = (user) => {
    if (!user) return 'Utilisateur introuvable';
    
    const firstName = user.first_name || user.firstName;
    const lastName = user.last_name || user.lastName;
    const pseudo = user.pseudo;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    return pseudo || 'Utilisateur introuvable';
  };

  const handleCommentClick = (e) => {
    if (
      e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('[data-interactive]')
    ) {
      return;
    }
    
    if (comment.user?.pseudo && comment.id) {
      sessionStorage.setItem('previousPageType', 'profile');
      router.push(`/${comment.user.pseudo}/comment/${comment.id}`);
    }
  };

  const handleMediaClick = (media, index, e) => {
    e.stopPropagation();
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const renderMedia = () => {
    const allMedia = Array.isArray(comment.media) ? comment.media : [];
    
    if (allMedia.length === 0) return null;

    const gridCols = allMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

    return (
      <div className={`mt-3 grid ${gridCols} gap-2`}>
        {allMedia.slice(0, 4).map((mediaItem, index) => {
          const src = mediaItem.url.startsWith('http') ? mediaItem.url : `/${mediaItem.url}`;
          const isVideo = mediaItem.type === 'video';
          
          return (
            <div 
              key={index} 
              className="relative rounded-lg overflow-hidden group cursor-pointer"
              onClick={(e) => handleMediaClick(allMedia, index, e)}
              data-interactive="true"
            >
              {isVideo ? (
                <div className="relative">
                  <video 
                    src={src} 
                    className="w-full h-16 sm:h-20 md:h-24 object-cover" 
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-sm sm:text-base md:text-lg" />
                  </div>
                </div>
              ) : (
                <img
                  src={src}
                  alt={`Média ${index + 1}`}
                  className="w-full h-16 sm:h-20 md:h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => e.currentTarget.style.display = 'none'}
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors rounded-lg" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderProfilePicture = () => {
    const profilePicture = comment.user?.profile_picture || comment.user?.profilePicture;
    
    if (!profilePicture) {
      return (
        <Image
          src="/defaultuserpfp.png"
          alt={`Photo de profil par défaut de ${comment.user?.pseudo || 'Utilisateur'}`}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover border border-[#555]"
        />
      );
    }

    return (
      <Image
        src={profilePicture}
        alt={`Photo de profil de ${comment.user?.pseudo || 'Utilisateur'}`}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover border border-[#555]"
        onError={(e) => {
          e.target.src = '/defaultuserpfp.png';
        }}
      />
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e1e1e] p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-[#333] cursor-pointer hover:bg-[#252525]"
        onClick={handleCommentClick}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {renderProfilePicture()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium text-sm sm:text-base">
                  {getDisplayName(comment.user)}
                </span>
                {comment.user?.pseudo && (
                  <span className="text-gray-500 text-xs sm:text-sm">
                    @{comment.user.pseudo}
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-30">
                  <FontAwesomeIcon icon={faComment} className="mr-1 text-xs" />
                  Commentaire
                </span>
              </div>
              
              <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">
                {formatDate(comment.created_at)}
              </span>
            </div>
            
            <p className="text-white text-sm sm:text-base whitespace-pre-wrap leading-relaxed mb-2">
              {comment.content}
            </p>
            
            {renderMedia()}

            {comment.originalPost && (
              <div className="mt-3 p-2 bg-[#333] bg-opacity-30 rounded-lg border-l-4 border-[#90EE90]">
                <div className="flex items-start space-x-2">
                  <div className="text-xs text-gray-400">
                    Commentaire sur:
                  </div>
                </div>
                <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                  {comment.originalPost.title || comment.originalPost.content?.substring(0, 100) + '...'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-3" data-interactive="true">
              <CommentLikeButton 
                commentId={comment.id}
                initialLikes={comment.likes_count || 0}
                className="text-xs sm:text-sm"
              />
              
              {comment.originalPost && comment.originalPost.user && (
                <Link 
                  href={`/${comment.originalPost.user.pseudo}/post/${comment.originalPost.id}`}
                  className="text-xs text-[#90EE90] hover:text-[#7CD37C] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    sessionStorage.setItem('previousPageType', 'profile');
                  }}
                >
                  Voir le post original →
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={comment.media || []}
        currentIndex={selectedMediaIndex}
        onNavigate={setSelectedMediaIndex}
      />
    </>
  );
};

export default LikedCommentCard;
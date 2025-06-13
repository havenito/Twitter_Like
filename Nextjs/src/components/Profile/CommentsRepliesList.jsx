import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faReply, faPlay, faTimes, faFilter } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import CommentLikeButton from '../Main/Post/CommentLikeButton';
import ReplyLikeButton from '../Main/Post/ReplyLikeButton';

const CommentsRepliesList = ({ commentsAndReplies, userPseudo, isOwnProfile }) => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredItems = useMemo(() => {
    if (!commentsAndReplies) return [];
    
    switch (activeFilter) {
      case 'comments':
        return commentsAndReplies.filter(item => item.type === 'comment');
      case 'replies':
        return commentsAndReplies.filter(item => item.type === 'reply');
      default:
        return commentsAndReplies;
    }
  }, [commentsAndReplies, activeFilter]);

  const filterOptions = [
    { id: 'all', label: 'Tout', shortLabel: 'Tout', icon: faFilter, count: commentsAndReplies?.length || 0 },
    { id: 'comments', label: 'Commentaires', shortLabel: 'Comm.', icon: faComment, count: commentsAndReplies?.filter(item => item.type === 'comment').length || 0 },
    { id: 'replies', label: 'Réponses', shortLabel: 'Rép.', icon: faReply, count: commentsAndReplies?.filter(item => item.type === 'reply').length || 0 }
  ];

  if (!commentsAndReplies || commentsAndReplies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-10 text-center text-gray-400"
      >
        <FontAwesomeIcon icon={faComment} className="text-3xl sm:text-4xl mb-3 text-gray-500" />
        <p className="text-base sm:text-lg px-4">
          {isOwnProfile 
            ? "Vous n'avez encore écrit aucun commentaire ou réponse." 
            : `@${userPseudo} n'a encore écrit aucun commentaire ou réponse.`}
        </p>
      </motion.div>
    );
  }

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

  const handleItemClick = (item) => {
    sessionStorage.setItem('previousPageType', 'profile');
    
    if (item.type === 'comment') {
      router.push(`/${userPseudo}/comment/${item.id}`);
    } else if (item.type === 'reply') {
      router.push(`/${userPseudo}/reply/${item.id}`);
    }
  };

  const handleCommentButtonClick = (e) => {
    e.stopPropagation();
  };

  const handleLikeButtonClick = (e) => {
    e.stopPropagation();
  };

  const renderMedia = (media) => {
    if (!media || media.length === 0) return null;

    const gridCols = media.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

    return (
      <div className={`mt-3 grid ${gridCols} gap-2`}>
        {media.slice(0, 4).map((mediaItem, index) => {
          const src = mediaItem.url.startsWith('http') ? mediaItem.url : `/${mediaItem.url}`;
          const isVideo = mediaItem.type === 'video';
          
          return (
            <div key={index} className="relative rounded-lg overflow-hidden group">
              {isVideo ? (
                <div className="relative">
                  <video 
                    src={src} 
                    className="w-full h-16 sm:h-20 md:h-24 object-cover" 
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-sm sm:text-base md:text-lg" />
                  </div>
                </div>
              ) : (
                <img
                  src={src}
                  alt={`Média ${index + 1}`}
                  className="w-full h-16 sm:h-20 md:h-24 object-cover"
                  onError={e => e.currentTarget.style.display = 'none'}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-[#1e1e1e] p-3 sm:p-4 rounded-lg border border-[#333]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium text-sm sm:text-base flex items-center">
            <FontAwesomeIcon icon={faFilter} className="mr-2 text-[#90EE90] text-xs sm:text-sm" />
            Filtrer par type
          </h3>
          <span className="text-xs text-gray-500">
            {filteredItems.length} élément{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveFilter(option.id)}
              className={`relative whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2.5 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0
                ${activeFilter === option.id 
                  ? 'bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-50' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] border border-transparent'
                }`}
            >
              <FontAwesomeIcon icon={option.icon} className="text-xs" />
              <span className="block sm:hidden">{option.shortLabel}</span>
              <span className="hidden sm:block">{option.label}</span>
              <span className="bg-gray-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8 sm:py-10 text-center text-gray-400 bg-[#1e1e1e] rounded-lg border border-[#333]"
        >
          <FontAwesomeIcon 
            icon={activeFilter === 'comments' ? faComment : activeFilter === 'replies' ? faReply : faFilter} 
            className="text-2xl sm:text-3xl mb-3 text-gray-500" 
          />
          <p className="text-sm sm:text-base px-4">
            {activeFilter === 'comments' && (
              isOwnProfile 
                ? "Vous n'avez encore écrit aucun commentaire." 
                : `@${userPseudo} n'a encore écrit aucun commentaire.`
            )}
            {activeFilter === 'replies' && (
              isOwnProfile 
                ? "Vous n'avez encore écrit aucune réponse." 
                : `@${userPseudo} n'a encore écrit aucune réponse.`
            )}
            {activeFilter === 'all' && (
              isOwnProfile 
                ? "Vous n'avez encore écrit aucun commentaire ou réponse." 
                : `@${userPseudo} n'a encore écrit aucun commentaire ou réponse.`
            )}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="space-y-3 sm:space-y-4 md:space-y-6"
        >
          {filteredItems.map((item) => (
            <motion.div
              key={`${item.type}-${item.id}`}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#1e1e1e] p-3 sm:p-4 md:p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-[#333] cursor-pointer hover:bg-[#252525]"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    item.type === 'comment' ? 'bg-blue-500 bg-opacity-20' : 'bg-green-500 bg-opacity-20'
                  }`}>
                    <FontAwesomeIcon 
                      icon={item.type === 'comment' ? faComment : faReply} 
                      className={`${item.type === 'comment' ? 'text-blue-400' : 'text-green-400'} text-xs sm:text-sm`}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1 sm:gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block w-fit ${
                        item.type === 'comment' 
                          ? 'bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-30'
                          : 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30'
                      }`}>
                        {item.type === 'comment' ? 'Commentaire' : 'Réponse'}
                      </span>
                      
                      {item.originalPost && (
                        <span className="text-xs text-gray-500 mt-1 sm:mt-0 block sm:inline">
                          sur le post: "{item.originalPost.title || item.originalPost.content?.substring(0, 30) + '...'}"
                        </span>
                      )}
                    </div>
                    
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <p className="text-white text-sm sm:text-base leading-relaxed mb-3 line-clamp-3 break-words">
                    {item.content}
                  </p>

                  {renderMedia(item.media)}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 pt-3 border-t border-[#333] gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3 sm:space-x-4" data-interactive="true">
                      <button
                        onClick={handleCommentButtonClick}
                        className="flex items-center space-x-1 text-gray-400 hover:text-[#90EE90] transition-colors text-xs sm:text-sm"
                      >
                        <FontAwesomeIcon icon={faComment} className="text-xs sm:text-sm" />
                        <span>{item.replies_count || 0}</span>
                      </button>
                      
                      <div onClick={handleLikeButtonClick}>
                        {item.type === 'comment' ? (
                          <CommentLikeButton 
                            commentId={item.id}
                            initialLikes={item.likes_count || 0}
                            className="text-xs sm:text-sm"
                          />
                        ) : (
                          <ReplyLikeButton 
                            replyId={item.id}
                            initialLikes={item.likes_count || 0}
                            className="text-xs sm:text-sm"
                          />
                        )}
                      </div>
                    </div>

                    {item.originalPost && (
                      <Link 
                        href={`/${item.originalPost.user?.pseudo}/post/${item.originalPost.id}`}
                        className="text-xs text-[#90EE90] hover:text-[#7CD37C] transition-colors text-center sm:text-right"
                        onClick={(e) => {
                          e.stopPropagation();
                          sessionStorage.setItem('previousPageType', 'profile');
                        }}
                      >
                        <span className="hidden sm:inline">Voir le post original →</span>
                        <span className="sm:hidden">Post original →</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default CommentsRepliesList;
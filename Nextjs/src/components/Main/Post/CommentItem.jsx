import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import MediaModal from '../../MediaModal';
import CommentLikeButton from './CommentLikeButton';
import ReplyButton from './ReplyButton';
import ReplyModal from './ReplyModal';
import ReplyLikeButton from './ReplyLikeButton';
import { useRouter } from 'next/navigation';

const CommentItem = ({ comment, postId }) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [currentMediaSource, setCurrentMediaSource] = useState('comment');
  const [currentReplyId, setCurrentReplyId] = useState(null);

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
    if (!user) {
      return 'Utilisateur introuvable';
    }
    
    const firstName = user.first_name || user.firstName;
    const lastName = user.last_name || user.lastName;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    return user.pseudo || 'Utilisateur introuvable';
  };

  const renderProfilePicture = () => {
    const profilePicture = comment.user?.profile_picture || comment.user?.profilePicture;
    
    if (!profilePicture || imageError) {
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
        onError={() => setImageError(true)}
      />
    );
  };

  const handleCommentMediaClick = (index, e) => {
    e.stopPropagation();
    setCurrentMediaSource('comment');
    setCurrentReplyId(null);
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleReplyMediaClick = (replyId, index, e) => {
    e.stopPropagation();
    setCurrentMediaSource('reply');
    setCurrentReplyId(replyId);
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleReplyAdded = (newReply) => {
    setReplies(prev => [...prev, newReply]);
  };

  const getCurrentMedia = () => {
    if (currentMediaSource === 'comment') {
      return comment.media || [];
    } else if (currentMediaSource === 'reply' && currentReplyId) {
      const reply = replies.find(r => r.id === currentReplyId);
      return reply?.media || [];
    }
    return [];
  };

  const renderMedia = () => {
    if (!comment.media || comment.media.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {comment.media.map((media, index) => {
          const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
          const isVideo = media.type === 'video';

          return (
            <div 
              key={media.id || index} 
              className="relative rounded-lg overflow-hidden cursor-pointer group"
              onClick={(e) => handleCommentMediaClick(index, e)}
            >
              {isVideo ? (
                <div className="relative">
                  <video
                    src={src}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-lg" />
                  </div>
                </div>
              ) : (
                <img
                  src={src}
                  alt={`Media du commentaire ${index + 1}`}
                  className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => e.currentTarget.style.display = 'none'}
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors" />
            </div>
          );
        })}
      </div>
    );
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
      router.push(`/${comment.user.pseudo}/comment/${comment.id}`);
    }
  };

  // Trier les réponses par nombre de likes décroissant, puis par date décroissante
  const sortReplies = (repliesArray) => {
    return [...repliesArray].sort((a, b) => {
      const aLikes = a.likes_count || 0;
      const bLikes = b.likes_count || 0;

      if (aLikes !== bLikes) {
        return bLikes - aLikes;
      }

      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return bDate - aDate;
    });
  };

  const sortedReplies = sortReplies(replies);
  const visibleReplies = sortedReplies.slice(0, 3);
  const hasMoreReplies = replies.length > 3;

  const handleViewMoreClick = (e) => {
    e.stopPropagation();
    if (comment.user?.pseudo && comment.id) {
      router.push(`/${comment.user.pseudo}/comment/${comment.id}`);
    }
  };

  return (
    <>
      <motion.div
        variants={{ 
          hidden: { opacity: 0, y: 20 }, 
          visible: { opacity: 1, y: 0 } 
        }}
        className="bg-[#1e1e1e] rounded-lg p-4 border border-[#333] cursor-pointer hover:bg-[#252525] transition-colors"
        onClick={handleCommentClick}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {comment.user?.pseudo ? (
              <Link href={`/${comment.user.pseudo}`} className="block">
                {renderProfilePicture()}
              </Link>
            ) : (
              renderProfilePicture()
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                {comment.user?.pseudo ? (
                  <Link 
                    href={`/${comment.user.pseudo}`} 
                    className="text-white font-medium hover:text-[#90EE90] transition-colors"
                  >
                    {getDisplayName(comment.user)}
                  </Link>
                ) : (
                  <span className="text-gray-400 font-medium">Utilisateur introuvable</span>
                )}
                
                {comment.user?.pseudo && (
                  <Link 
                    href={`/${comment.user.pseudo}`}
                    className="text-gray-500 text-sm hover:text-[#90EE90] transition-colors"
                  >
                    @{comment.user.pseudo}
                  </Link>
                )}
              </div>
              
              <span className="text-gray-500 text-sm flex-shrink-0">
                {formatDate(comment.created_at)}
              </span>
            </div>
            
            <p className="text-white whitespace-pre-wrap leading-relaxed mb-3">
              {comment.content}
            </p>
            
            {renderMedia()}

            <div className="flex items-center justify-end space-x-2" data-interactive="true">
              <ReplyButton 
                repliesCount={replies.length}
                onClick={() => setShowReplyModal(true)}
              />
              <CommentLikeButton 
                commentId={comment.id}
                initialLikes={comment.likes_count || 0}
              />
            </div>
            
            {replies && replies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#333]">
                <div className="pl-4 border-l-2 border-[#333] space-y-3">
                  {visibleReplies.map((reply, index) => (
                    <div key={reply.id}>
                      <div className="flex items-start space-x-2">
                        <Image
                          src={reply.user?.profile_picture || '/defaultuserpfp.png'}
                          alt={`Photo de profil de ${reply.user?.pseudo || 'Utilisateur'}`}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium text-sm">
                                {getDisplayName(reply.user)}
                              </span>
                              {reply.user?.pseudo && (
                                <span className="text-gray-500 text-xs">
                                  @{reply.user.pseudo}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500 text-xs flex-shrink-0">
                              {formatDate(reply.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">
                            {reply.content}
                          </p>
                          
                          {reply.media && reply.media.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              {reply.media.map((media, index) => {
                                const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
                                const isVideo = media.type === 'video';

                                return (
                                  <div 
                                    key={media.id || index} 
                                    className="relative rounded overflow-hidden cursor-pointer group"
                                    onClick={(e) => handleReplyMediaClick(reply.id, index, e)}
                                  >
                                    {isVideo ? (
                                      <div className="relative">
                                        <video
                                          src={src}
                                          className="w-full h-16 object-cover group-hover:scale-105 transition-transform duration-300"
                                          muted
                                          preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                                          <FontAwesomeIcon icon={faPlay} className="text-white text-xs" />
                                        </div>
                                      </div>
                                    ) : (
                                      <img
                                        src={src}
                                        alt={`Média de la réponse ${index + 1}`}
                                        className="w-full h-16 object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={e => e.currentTarget.style.display = 'none'}
                                      />
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors" />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex items-center justify-end mt-2" data-interactive="true">
                            <ReplyLikeButton 
                              replyId={reply.id}
                              initialLikes={reply.likes_count || 0}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {index < visibleReplies.length - 1 && (
                        <div className="my-3 border-b border-[#444] opacity-50"></div>
                      )}
                    </div>
                  ))}
                  
                  {hasMoreReplies && (
                    <div className="pt-2" data-interactive="true">
                      <button
                        onClick={handleViewMoreClick}
                        className="w-full text-center py-2 text-[#90EE90] hover:text-[#7CD37C] transition-colors text-sm font-medium border-t border-dashed border-[#555] pt-3"
                      >
                        --------- Voir plus ({replies.length - 3} réponse{replies.length - 3 > 1 ? 's' : ''} de plus) ---------
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={getCurrentMedia()}
        currentIndex={selectedMediaIndex}
        onNavigate={setSelectedMediaIndex}
      />

      <ReplyModal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        comment={comment}
        onReplyAdded={handleReplyAdded}
      />
    </>
  );
};

export default CommentItem;
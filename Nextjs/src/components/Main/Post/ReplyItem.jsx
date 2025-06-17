import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MediaModal from '../../MediaModal';
import ReplyLikeButton from './ReplyLikeButton';
import ReplyButton from './ReplyButton';
import SubReplyModal from './SubReplyModal';

const ReplyItem = ({ reply, commentId }) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showSubReplyModal, setShowSubReplyModal] = useState(false);

  const [subReplies, setSubReplies] = useState(reply.sub_replies || []); 
  const [currentMediaSource, setCurrentMediaSource] = useState('reply');
  const [currentSubReplyId, setCurrentSubReplyId] = useState(null);

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
    const profilePicture = reply.user?.profile_picture || reply.user?.profilePicture;
    
    if (!profilePicture || imageError) {
      return (
        <Image
          src="/defaultuserpfp.png"
          alt={`Photo de profil par défaut de ${reply.user?.pseudo || 'Utilisateur'}`}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover border border-[#555]"
        />
      );
    }

    return (
      <Image
        src={profilePicture}
        alt={`Photo de profil de ${reply.user?.pseudo || 'Utilisateur'}`}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover border border-[#555]"
        onError={() => setImageError(true)}
      />
    );
  };

  const handleReplyMediaClick = (index, e) => {
    e.stopPropagation();
    setCurrentMediaSource('reply');
    setCurrentSubReplyId(null);
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleSubReplyMediaClick = (subReplyId, index, e) => {
    e.stopPropagation();
    setCurrentMediaSource('subreply');
    setCurrentSubReplyId(subReplyId);
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleReplyClick = () => {
    setShowSubReplyModal(true);
  };

  const handleSubReplyAdded = (newSubReply) => {
    setSubReplies(prev => [...prev, newSubReply]);
  };

  const getCurrentMedia = () => {
    if (currentMediaSource === 'reply') {
      return reply.media || [];
    } else if (currentMediaSource === 'subreply' && currentSubReplyId) {
      const subReply = subReplies.find(sr => sr.id === currentSubReplyId);
      return subReply?.media || [];
    }
    return [];
  };

  const renderMedia = () => {
    if (!reply.media || reply.media.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {reply.media.map((media, index) => {
          const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
          const isVideo = media.type === 'video';

          return (
            <div 
              key={media.id || index} 
              className="relative rounded-lg overflow-hidden cursor-pointer group"
              onClick={(e) => handleReplyMediaClick(index, e)}
              data-interactive="true"
            >
              {isVideo ? (
                <div className="relative">
                  <video
                    src={src}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-xl" />
                  </div>
                </div>
              ) : (
                <img
                  src={src}
                  alt={`Média de la réponse ${index + 1}`}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
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

  const handleReplyClick2 = (e) => {
    if (
      e.target.closest('button') || 
      e.target.closest('[data-interactive]') ||
      e.target.closest('a')
    ) {
      return;
    }
    
    if (reply.user?.pseudo) {
      router.push(`/${reply.user.pseudo}/reply/${reply.id}`);
    }
  };

  const handleViewMoreSubRepliesClick = (e) => {
    e.stopPropagation();
    if (reply.user?.pseudo) {
      router.push(`/${reply.user.pseudo}/reply/${reply.id}`);
    }
  };

  const sortSubReplies = (subRepliesArray) => {
    return [...subRepliesArray].sort((a, b) => {
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

  const sortedSubReplies = sortSubReplies(subReplies);
  const visibleSubReplies = sortedSubReplies.slice(0, 3);
  const hasMoreSubReplies = subReplies.length > 3;

  return (
    <>
      <motion.div
        variants={{ 
          hidden: { opacity: 0, y: 20 }, 
          visible: { opacity: 1, y: 0 } 
        }}
        className="bg-[#1e1e1e] rounded-lg p-4 border border-[#333] cursor-pointer hover:bg-[#252525] transition-colors"
        onClick={handleReplyClick2}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {reply.user?.pseudo ? (
              <Link href={`/${reply.user.pseudo}`} className="block">
                {renderProfilePicture()}
              </Link>
            ) : (
              renderProfilePicture()
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                {reply.user?.pseudo ? (
                  <Link 
                    href={`/${reply.user.pseudo}`} 
                    className="text-white font-medium hover:text-[#90EE90] transition-colors"
                  >
                    {getDisplayName(reply.user)}
                  </Link>
                ) : (
                  <span className="text-gray-400 font-medium">Utilisateur introuvable</span>
                )}
                
                {reply.user?.pseudo && (
                  <Link 
                    href={`/${reply.user.pseudo}`}
                    className="text-gray-500 text-sm hover:text-[#90EE90] transition-colors"
                  >
                    @{reply.user.pseudo}
                  </Link>
                )}
              </div>
              
              <span className="text-gray-500 text-sm flex-shrink-0">
                {formatDate(reply.created_at)}
              </span>
            </div>
            
            <p className="text-white whitespace-pre-wrap leading-relaxed mb-3">
              {reply.content}
            </p>
            
            {renderMedia()}

            <div className="flex items-center justify-end space-x-2" data-interactive="true">
              <ReplyButton 
                repliesCount={subReplies.length}
                onClick={handleReplyClick}
                className="text-xs"
              />
              <ReplyLikeButton 
                replyId={reply.id}
                initialLikes={reply.likes_count || 0}
              />
            </div>

            {subReplies && subReplies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#333]">
                <div className="pl-3 border-l-2 border-[#444] space-y-3">
                  {visibleSubReplies.map((subReply, index) => (
                    <div key={subReply.id}>
                      <div className="flex items-start space-x-2">
                        <Image
                          src={subReply.user?.profile_picture || '/defaultuserpfp.png'}
                          alt={`Photo de profil de ${subReply.user?.pseudo || 'Utilisateur'}`}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium text-xs">
                                {getDisplayName(subReply.user)}
                              </span>
                              {subReply.user?.pseudo && (
                                <span className="text-gray-500 text-xs">
                                  @{subReply.user.pseudo}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500 text-xs flex-shrink-0">
                              {formatDate(subReply.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-xs mb-2">
                            {subReply.content}
                          </p>
                          
                          {subReply.media && subReply.media.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              {subReply.media.map((media, mediaIndex) => {
                                const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
                                const isVideo = media.type === 'video';

                                return (
                                  <div 
                                    key={media.id || mediaIndex} 
                                    className="relative rounded overflow-hidden cursor-pointer group"
                                    onClick={(e) => handleSubReplyMediaClick(subReply.id, mediaIndex, e)}
                                  >
                                    {isVideo ? (
                                      <div className="relative">
                                        <video
                                          src={src}
                                          className="w-full h-12 object-cover group-hover:scale-105 transition-transform duration-300"
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
                                        alt={`Média de la réponse ${mediaIndex + 1}`}
                                        className="w-full h-12 object-cover group-hover:scale-105 transition-transform duration-300"
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
                              replyId={subReply.id}
                              initialLikes={subReply.likes_count || 0}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {index < visibleSubReplies.length - 1 && (
                        <div className="my-3 border-b border-[#555] opacity-30"></div>
                      )}
                    </div>
                  ))}
                  
                  {hasMoreSubReplies && (
                    <div className="pt-2" data-interactive="true">
                      <button
                        onClick={handleViewMoreSubRepliesClick}
                        className="w-full text-center py-2 text-[#90EE90] hover:text-[#7CD37C] transition-colors text-xs font-medium border-t border-dashed border-[#666] pt-3"
                      >
                        --- Voir plus ({subReplies.length - 3} réponse{subReplies.length - 3 > 1 ? 's' : ''} de plus) ---
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

      <SubReplyModal
        isOpen={showSubReplyModal}
        onClose={() => setShowSubReplyModal(false)}
        parentReply={reply}
        onSubReplyAdded={handleSubReplyAdded}
      />
    </>
  );
};

export default ReplyItem;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import MediaModal from '../../MediaModal';
import ReplyLikeButton from './ReplyLikeButton';
import ReplyButton from './ReplyButton';
import SubReplyModal from './SubReplyModal';

const SubReplyItem = ({ subReply, parentReplyId }) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showSubReplyModal, setShowSubReplyModal] = useState(false);

  // État pour les sous-réponses (réponses aux sous-réponses)
  const [subSubReplies, setSubSubReplies] = useState(subReply.sub_replies || []);
  const [currentMediaSource, setCurrentMediaSource] = useState('subreply');
  const [currentSubSubReplyId, setCurrentSubSubReplyId] = useState(null);

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
    const profilePicture = subReply.user?.profile_picture || subReply.user?.profilePicture;
    
    if (!profilePicture || imageError) {
      return (
        <Image
          src="/defaultuserpfp.png"
          alt={`Photo de profil par défaut de ${subReply.user?.pseudo || 'Utilisateur'}`}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover border border-[#555]"
        />
      );
    }

    return (
      <Image
        src={profilePicture}
        alt={`Photo de profil de ${subReply.user?.pseudo || 'Utilisateur'}`}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover border border-[#555]"
        onError={() => setImageError(true)}
      />
    );
  };

  const handleSubReplyMediaClick = (index, e) => {
    e.stopPropagation();
    setCurrentMediaSource('subreply');
    setCurrentSubSubReplyId(null);
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleSubSubReplyMediaClick = (subSubReplyId, index, e) => {
    e.stopPropagation();
    setCurrentMediaSource('subsubreply');
    setCurrentSubSubReplyId(subSubReplyId);
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleSubReplyClick = (e) => {
    // Ne pas naviguer si on clique sur un élément interactif
    if (
      e.target.closest('button') || 
      e.target.closest('[data-interactive]') ||
      e.target.closest('a')
    ) {
      return;
    }
    
    // Navigation vers la page de détail de la sous-réponse
    if (subReply.user?.pseudo) {
      router.push(`/${subReply.user.pseudo}/reply/${subReply.id}`);
    }
  };

  const handleReplyClick = () => {
    setShowSubReplyModal(true);
  };

  const handleSubSubReplyAdded = (newSubSubReply) => {
    setSubSubReplies(prev => [...prev, newSubSubReply]);
  };

  const handleViewMoreSubSubRepliesClick = (e) => {
    e.stopPropagation();
    if (subReply.user?.pseudo) {
      router.push(`/${subReply.user.pseudo}/reply/${subReply.id}`);
    }
  };

  const getCurrentMedia = () => {
    if (currentMediaSource === 'subreply') {
      return subReply.media || [];
    } else if (currentMediaSource === 'subsubreply' && currentSubSubReplyId) {
      const subSubReply = subSubReplies.find(r => r.id === currentSubSubReplyId);
      return subSubReply?.media || [];
    }
    return [];
  };

  const renderMedia = () => {
    const allMedia = Array.isArray(subReply.media) ? subReply.media : [];
    
    if (allMedia.length === 0) return null;

    if (allMedia.length === 1) {
      const media = allMedia[0];
      const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
      const isVideo = media.type === 'video';
      
      return (
        <div 
          className="mt-3 relative cursor-pointer group rounded-lg overflow-hidden"
          onClick={(e) => handleSubReplyMediaClick(0, e)}
          data-interactive="true"
        >
          {isVideo ? (
            <div className="relative">
              <video 
                src={src} 
                className="w-full rounded-lg max-h-80 object-cover" 
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                <FontAwesomeIcon icon={faPlay} className="text-white text-3xl" />
              </div>
            </div>
          ) : (
            <img 
              src={src} 
              alt="Média de la sous-réponse" 
              className="w-full rounded-lg max-h-80 object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors rounded-lg" />
        </div>
      );
    }

    const cols = allMedia.length === 2 ? 'grid-cols-2' : allMedia.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
    
    return (
      <div className={`mt-3 grid ${cols} gap-2`} data-interactive="true">
        {allMedia.slice(0, 4).map((media, i) => {
          const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
          const isVideo = media.type === 'video';
          
          return (
            <div 
              key={media.id || i} 
              className="relative rounded-lg overflow-hidden cursor-pointer group"
              onClick={(e) => handleSubReplyMediaClick(i, e)}
            >
              {isVideo ? (
                <div className="relative">
                  <video 
                    src={src} 
                    className="w-full h-24 object-cover" 
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
                  alt={`Média de la sous-réponse ${i + 1}`}
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

  // Trier les sous-sous-réponses par likes puis par date
  const sortSubSubReplies = (subSubRepliesArray) => {
    return [...subSubRepliesArray].sort((a, b) => {
      const aLikes = a.likes_count || 0;
      const bLikes = b.likes_count || 0;

      // D'abord par nombre de likes (décroissant : du plus liké au moins liké)
      if (aLikes !== bLikes) {
        return bLikes - aLikes;
      }

      // En cas d'égalité de likes, par date (décroissant : du plus récent au plus ancien)
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return bDate - aDate;
    });
  };

  const sortedSubSubReplies = sortSubSubReplies(subSubReplies);
  const visibleSubSubReplies = sortedSubSubReplies.slice(0, 3);
  const hasMoreSubSubReplies = subSubReplies.length > 3;

  return (
    <>
      <motion.div
        variants={{ 
          hidden: { opacity: 0, y: 20 }, 
          visible: { opacity: 1, y: 0 } 
        }}
        className="bg-[#1e1e1e] rounded-lg p-4 border border-[#333] cursor-pointer hover:bg-[#252525] transition-colors"
        onClick={handleSubReplyClick}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {subReply.user?.pseudo ? (
              <Link href={`/${subReply.user.pseudo}`} className="block">
                {renderProfilePicture()}
              </Link>
            ) : (
              renderProfilePicture()
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                {subReply.user?.pseudo ? (
                  <Link 
                    href={`/${subReply.user.pseudo}`} 
                    className="text-white font-medium hover:text-[#90EE90] transition-colors"
                  >
                    {getDisplayName(subReply.user)}
                  </Link>
                ) : (
                  <span className="text-gray-400 font-medium">Utilisateur introuvable</span>
                )}
                
                {subReply.user?.pseudo && (
                  <Link 
                    href={`/${subReply.user.pseudo}`}
                    className="text-gray-500 text-sm hover:text-[#90EE90] transition-colors"
                  >
                    @{subReply.user.pseudo}
                  </Link>
                )}
              </div>
              
              <span className="text-gray-500 text-sm flex-shrink-0">
                {formatDate(subReply.created_at)}
              </span>
            </div>
            
            <p className="text-white whitespace-pre-wrap leading-relaxed mb-3">
              {subReply.content}
            </p>
            
            {renderMedia()}

            <div className="flex items-center justify-end space-x-2" data-interactive="true">
              <ReplyButton 
                repliesCount={subSubReplies.length}
                onClick={handleReplyClick}
                className="text-xs"
              />
              <ReplyLikeButton 
                replyId={subReply.id}
                initialLikes={subReply.likes_count || 0}
              />
            </div>

            {subSubReplies && subSubReplies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#333]">
                <div className="pl-3 border-l-2 border-[#444] space-y-3">
                  {visibleSubSubReplies.map((subSubReply, index) => (
                    <div key={subSubReply.id}>
                      <div className="flex items-start space-x-2">
                        <Image
                          src={subSubReply.user?.profile_picture || '/defaultuserpfp.png'}
                          alt={`Photo de profil de ${subSubReply.user?.pseudo || 'Utilisateur'}`}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium text-xs">
                                {getDisplayName(subSubReply.user)}
                              </span>
                              {subSubReply.user?.pseudo && (
                                <span className="text-gray-500 text-xs">
                                  @{subSubReply.user.pseudo}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500 text-xs flex-shrink-0">
                              {formatDate(subSubReply.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-xs mb-2">
                            {subSubReply.content}
                          </p>
                          
                          {subSubReply.media && subSubReply.media.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              {subSubReply.media.map((media, mediaIndex) => {
                                const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
                                const isVideo = media.type === 'video';

                                return (
                                  <div 
                                    key={media.id || mediaIndex} 
                                    className="relative rounded overflow-hidden cursor-pointer group"
                                    onClick={(e) => handleSubSubReplyMediaClick(subSubReply.id, mediaIndex, e)}
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
                                        alt={`Média ${mediaIndex + 1}`}
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
                              replyId={subSubReply.id}
                              initialLikes={subSubReply.likes_count || 0}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {index < visibleSubSubReplies.length - 1 && (
                        <div className="my-3 border-b border-[#555] opacity-30"></div>
                      )}
                    </div>
                  ))}
                  
                  {hasMoreSubSubReplies && (
                    <div className="pt-2" data-interactive="true">
                      <button
                        onClick={handleViewMoreSubSubRepliesClick}
                        className="w-full text-center py-2 text-[#90EE90] hover:text-[#7CD37C] transition-colors text-xs font-medium border-t border-dashed border-[#666] pt-3"
                      >
                        --- Voir plus ({subSubReplies.length - 3} réponse{subSubReplies.length - 3 > 1 ? 's' : ''} de plus) ---
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
        parentReply={subReply}
        onSubReplyAdded={handleSubSubReplyAdded}
      />
    </>
  );
};

export default SubReplyItem;
"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faComment, faReply, faHeart, faPlay, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import CommentLikeButton from '../Main/Post/CommentLikeButton';
import ReplyLikeButton from '../Main/Post/ReplyLikeButton';

const CommentsRepliesList = ({ commentsAndReplies, userPseudo, isOwnProfile }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredItems = useMemo(() => {
    if (!commentsAndReplies) {
      return [];
    }
    
    if (activeFilter === 'comments') {
      return commentsAndReplies.filter(item => item.type === 'comment');
    } else if (activeFilter === 'replies') {
      return commentsAndReplies.filter(item => item.type === 'reply');
    } else {
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
    if (item.type === 'comment') {
      sessionStorage.setItem('previousPageType', 'profile');
      router.push(`/${userPseudo}/comment/${item.id}`);
    } else if (item.type === 'reply') {
      sessionStorage.setItem('previousPageType', 'profile');
      router.push(`/${userPseudo}/reply/${item.id}`);
    }
  };

  const handleCommentButtonClick = (e) => {
    e.stopPropagation();
  };

  const handleLikeButtonClick = (e) => {
    e.stopPropagation();
  };

  const handleDeleteClick = (item, e) => {
    e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !session?.user?.id) return;

    setDeleteLoading(true);
    try {
      const endpoint = itemToDelete.type === 'comment' 
        ? `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/comments/${itemToDelete.id}`
        : `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/replies/${itemToDelete.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Recharger la page pour mettre à jour la liste
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la suppression:', errorData);
        alert(`Erreur lors de la suppression du ${itemToDelete.type === 'comment' ? 'commentaire' : 'réponse'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(`Erreur lors de la suppression du ${itemToDelete.type === 'comment' ? 'commentaire' : 'réponse'}`);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const renderMedia = (media) => {
    if (!media || media.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {media.slice(0, 4).map((mediaItem, index) => {
          const isVideo = mediaItem.type === 'video';
          const src = mediaItem.url.startsWith('http') ? mediaItem.url : `/${mediaItem.url}`;
          
          return (
            <div key={index} className="relative group">
              {isVideo ? (
                <div className="relative">
                  <video 
                    src={src} 
                    className="w-full h-20 object-cover rounded" 
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-lg" />
                  </div>
                </div>
              ) : (
                <img 
                  src={src} 
                  alt="Média" 
                  className="w-full h-20 object-cover rounded" 
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
              className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === option.id
                  ? 'bg-[#90EE90] text-black'
                  : 'bg-[#333] text-gray-300 hover:bg-[#444] hover:text-white'
              }`}
            >
              <FontAwesomeIcon icon={option.icon} className="mr-1 sm:mr-2 text-xs" />
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.shortLabel}</span>
              <span className="ml-1 sm:ml-2 px-1.5 py-0.5 bg-black bg-opacity-20 rounded-full text-xs">
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
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              onClick={() => handleItemClick(item)}
              className="bg-[#1e1e1e] p-3 sm:p-4 md:p-6 rounded-lg border border-[#333] cursor-pointer hover:bg-[#252525] transition-colors"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    item.type === 'comment' ? 'bg-blue-500/20' : 'bg-green-500/20'
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
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDate(item.created_at)}
                      </span>
                      
                      {isOwnProfile && session?.user?.id && (
                        <button
                          onClick={(e) => handleDeleteClick(item, e)}
                          className="p-1 rounded-full hover:bg-red-500/20 transition-colors group"
                          title={`Supprimer ce ${item.type === 'comment' ? 'commentaire' : 'réponse'}`}
                          data-interactive="true"
                        >
                          <FontAwesomeIcon 
                            icon={faTrash} 
                            className="text-red-400 text-xs group-hover:text-red-300" 
                          />
                        </button>
                      )}
                    </div>
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
                        <FontAwesomeIcon icon={faComment} />
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

                    {item.originalPost && item.originalPost.user_pseudo && (
                      <Link 
                        href={`/${item.originalPost.user_pseudo}/post/${item.originalPost.id}`}
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

      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#222] rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-600 mb-4">
                <FontAwesomeIcon 
                  icon={faExclamationTriangle} 
                  className="h-6 w-6 text-white" 
                />
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-white">
                Supprimer ce {itemToDelete?.type === 'comment' ? 'commentaire' : 'réponse'} ?
              </h3>
              
              <div className="text-gray-300 mb-6 space-y-3">
                <p>
                  Êtes-vous sûr de vouloir supprimer ce {itemToDelete?.type === 'comment' ? 'commentaire' : 'réponse'} ?
                </p>
                <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 text-red-200">
                  <p className="text-sm flex items-start">
                    <FontAwesomeIcon icon={faTrash} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Attention :</strong> Cette action est irréversible. 
                      {itemToDelete?.type === 'comment' 
                        ? 'Le commentaire et toutes ses réponses seront définitivement supprimés.'
                        : 'La réponse sera définitivement supprimée.'
                      }
                    </span>
                  </p>
                </div>
              </div>
              
              {deleteLoading ? (
                <div className="flex justify-center items-center py-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                  <span className="ml-3 text-gray-300">Suppression en cours...</span>
                </div>
              ) : (
                <div className="flex gap-3 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteModal(false)}
                    className="px-6 py-2 rounded-full text-gray-300 hover:bg-[#444] transition-colors"
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteConfirm}
                    className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-semibold"
                  >
                    Supprimer
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CommentsRepliesList;
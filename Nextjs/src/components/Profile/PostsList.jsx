import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileText, faEllipsis, faEdit, faTrash, faTag, faPlay, faImage } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import EditPostModal from '../Main/Post/EditPostModal';
import DeletePostModal from '../Main/Post/DeletePostModal';
import MediaModal from '../MediaModal';
import CommentsModal from '../Main/Post/CommentsModal';
import CommentButton from '../Main/Post/CommentButton';
import LikeButton from '../Main/Post/LikeButton';
import FavoriteButton from '../Main/Post/FavoriteButton';

const PostsList = ({ posts, isOwnProfile, userPseudo, onCreatePost, onPostUpdate, onPostDelete }) => {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [postToEdit, setPostToEdit] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentsCount, setCommentsCount] = useState(() => {
    const initialCounts = {};
    posts?.forEach(post => {
      initialCounts[post.id] = post.comments || 0;
    });
    return initialCounts;
  });

  if (!posts || posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-8 sm:py-10 lg:py-12 text-center text-gray-400"
      >
        <FontAwesomeIcon icon={faFileText} className="text-2xl sm:text-3xl lg:text-4xl mb-3 text-gray-500" />
        <p className="text-base sm:text-lg lg:text-xl px-4">
          {isOwnProfile ? "Vous n'avez encore rien publié." : `@${userPseudo} n'a pas encore partagé de publications.`}
        </p>
      </motion.div>
    );
  }

  const handlePostClick = (post, e) => {
    if (
      e.target.closest('button') || 
      e.target.closest('[data-interactive]') ||
      e.target.closest('a')
    ) {
      return;
    }
    
    if (post.user?.pseudo || userPseudo) {
      const targetPseudo = post.user?.pseudo || userPseudo;
      router.push(`/${targetPseudo}/post/${post.id}`);
    }
  };

  const handleMenuToggle = (postId) => {
    setOpenMenuId(openMenuId === postId ? null : postId);
  };

  const handleEditPost = (post) => {
    console.log('Modifier le post:', post);
    setPostToEdit(post);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setPostToEdit(null);
  };

  const handlePostUpdated = (updatedPost) => {
    console.log('Post modifié:', updatedPost);
  };

  const handleDeletePost = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${postToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        if (onPostDelete) {
          onPostDelete(postToDelete.id);
        }
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la suppression:', errorData);
        alert('Erreur lors de la suppression du post');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du post');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteModalClose = () => {
    if (!deleteLoading) {
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

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

  const handleMediaClick = (postMedia, index, e) => {
    e.stopPropagation();
    setSelectedMedia(postMedia || []);
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const renderMedia = (post) => {
    const allMedia = Array.isArray(post.media) ? post.media : [];
    
    if (allMedia.length === 0) return null;

    if (allMedia.length === 1) {
      const media = allMedia[0];
      const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
      const isVideo = media.type === 'video';
      
      return (
        <div 
          className="mt-3 relative cursor-pointer group rounded-lg overflow-hidden"
          onClick={(e) => handleMediaClick(allMedia, 0, e)}
          data-interactive="true"
        >
          {isVideo ? (
            <div className="relative">
              <video 
                src={src} 
                className="w-full rounded-lg max-h-48 sm:max-h-64 lg:max-h-80 object-cover" 
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                <FontAwesomeIcon icon={faPlay} className="text-white text-xl sm:text-2xl lg:text-3xl" />
              </div>
            </div>
          ) : (
            <img 
              src={src} 
              alt="" 
              className="w-full rounded-lg max-h-48 sm:max-h-64 lg:max-h-80 object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors rounded-lg" />
        </div>
      );
    }

    const gridCols = allMedia.length === 2 ? 'grid-cols-2' : 
                     allMedia.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : 
                     'grid-cols-2';
    
    return (
      <div className={`mt-3 grid ${gridCols} gap-2`} data-interactive="true">
        {allMedia.slice(0, 4).map((media, i) => {
          const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
          const isVideo = media.type === 'video';
          
          const isFirstOfThree = allMedia.length === 3 && i === 0;
          const spanClass = isFirstOfThree ? 'row-span-2 hidden sm:block' : '';
          
          return (
            <div 
              key={i}
              className={`relative cursor-pointer group rounded-lg overflow-hidden ${spanClass}`}
              onClick={(e) => handleMediaClick(allMedia, i, e)}
            >
              {isVideo ? (
                <div className="relative">
                  <video 
                    src={src} 
                    className="w-full h-20 sm:h-24 lg:h-32 object-cover group-hover:scale-105 transition-transform duration-300" 
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-sm sm:text-base lg:text-lg" />
                  </div>
                </div>
              ) : (
                <img
                  src={src}
                  alt=""
                  className="w-full h-20 sm:h-24 lg:h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => e.currentTarget.style.display = 'none'}
                />
              )}
              
              {i === 3 && allMedia.length > 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg sm:text-xl">
                    +{allMedia.length - 4}
                  </span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors" />
            </div>
          );
        })}
      </div>
    );
  };

  const handleOpenComments = (post, e) => {
    e.stopPropagation();
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const handleCommentAdded = (postId) => {
    setCommentsCount(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        className="space-y-3 sm:space-y-4 lg:space-y-6"
      >
        {posts.map((post) => (
          <motion.div
            key={post.id}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="bg-[#1e1e1e] p-3 sm:p-4 lg:p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-[#333] relative cursor-pointer hover:bg-[#252525]"
            onClick={(e) => handlePostClick(post, e)}
          >
            {isOwnProfile && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4" data-interactive="true">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuToggle(post.id);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 rounded-full hover:bg-[#333]"
                >
                  <FontAwesomeIcon icon={faEllipsis} className="text-sm sm:text-base" />
                </button>
                
                <AnimatePresence>
                  {openMenuId === post.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-lg z-10 min-w-[120px] sm:min-w-[150px]"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPost(post);
                        }}
                        className="w-full text-left px-3 py-2 sm:px-4 sm:py-3 text-[#90EE90] hover:bg-[#333] transition-colors flex items-center rounded-t-lg text-sm sm:text-base"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2 sm:mr-3 text-xs sm:text-sm" />
                        Modifier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post);
                        }}
                        className="w-full text-left px-3 py-2 sm:px-4 sm:py-3 text-red-400 hover:bg-[#333] transition-colors flex items-center rounded-b-lg border-t border-[#444] text-sm sm:text-base"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2 sm:mr-3 text-xs sm:text-sm" />
                        Supprimer
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {post.title && (
              <h3 className="text-white font-semibold text-base sm:text-lg lg:text-xl mb-2 pr-8 sm:pr-10 lg:pr-12">
                {post.title}
              </h3>
            )}
            
            <p className="text-white whitespace-pre-wrap leading-relaxed mb-3 pr-8 sm:pr-10 lg:pr-12 text-sm sm:text-base">
              {post.content}
            </p>
            
            {renderMedia(post)}
            
            <div className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-[#333] gap-3 sm:gap-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                <span className="text-xs sm:text-sm">
                  Publié le {formatDate(post.createdAt || post.publishedAt)}
                </span>
                {post.category?.name && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30 w-fit">
                    <FontAwesomeIcon icon={faTag} className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                    {post.category.name}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-end sm:justify-start space-x-3 sm:space-x-4" data-interactive="true">
                <CommentButton 
                  commentsCount={commentsCount[post.id] || 0}
                  onClick={(e) => handleOpenComments(post, e)}
                  className="text-xs sm:text-sm"
                />
                <LikeButton 
                  postId={post.id} 
                  initialLikes={post.likes || 0}
                  className="text-xs sm:text-sm"
                />
                <FavoriteButton 
                  postId={post.id}
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {openMenuId && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {/* Modales */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        onPostUpdated={handlePostUpdated}
        post={postToEdit}
      />

      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={handleDeleteModalClose}
        onConfirm={confirmDeletePost}
        isLoading={deleteLoading}
        postTitle={postToDelete?.title}
      />

      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={selectedMedia}
        currentIndex={selectedMediaIndex}
        onNavigate={setSelectedMediaIndex}
      />

      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        post={selectedPost}
        onCommentAdded={handleCommentAdded}
      />
    </>
  );
};

export default PostsList;
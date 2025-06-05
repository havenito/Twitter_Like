import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faFileText, faTag, faEllipsis, faEdit, faTrash} from '@fortawesome/free-solid-svg-icons';
import DeletePostModal from '../Main/Post/DeletePostModal';
import EditPostModal from '../Main/Post/EditPostModal';
import LikeButton from '../Main/Feed/LikeButton';

const PostsList = ({ posts, isOwnProfile, userPseudo, onCreatePost, onPostUpdate, onPostDelete }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [postToEdit, setPostToEdit] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!posts || posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-10 text-center text-gray-400"
      >
        <FontAwesomeIcon icon={faFileText} className="text-3xl mb-3 text-gray-500" />
        <p className="text-lg">
          {isOwnProfile 
            ? "Vous n'avez encore rien publié." 
            : `@${userPseudo} n'a pas encore partagé de publications.`}
        </p>
      </motion.div>
    );
  }

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
    if (onPostUpdate) {
      onPostUpdate(updatedPost);
    }
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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
        console.log('Post supprimé avec succès');
        if (onPostDelete) {
          onPostDelete(postToDelete.id);
        }
        setShowDeleteModal(false);
        setPostToDelete(null);
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la suppression:', errorData.error);
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

  const renderMedia = (post) => {
    const allMedia = Array.isArray(post.media) ? post.media : [];

    if (allMedia.length === 0) return null;

    if (allMedia.length === 1) {
      const media = allMedia[0];
      const normalizedUrl = media.url.startsWith('http') 
        ? media.url 
        : media.url.startsWith('/') 
          ? media.url 
          : `/${media.url}`;
      
      const isVideo = media.type === 'video';

      if (isVideo) {
        return (
          <div className="mt-3 rounded-lg overflow-hidden">
            <video
              controls
              src={normalizedUrl}
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        );
      } else {
        return (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={normalizedUrl}
              alt="Media du post"
              className="w-full h-auto object-cover max-h-96"
              onError={e => e.currentTarget.style.display = 'none'}
            />
          </div>
        );
      }
    }

    const gridCols = allMedia.length === 2 ? 'grid-cols-2' : 
                     allMedia.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

    return (
      <div className={`mt-3 grid ${gridCols} gap-2`}>
        {allMedia.slice(0, 4).map((media, index) => {
          const normalizedUrl = media.url.startsWith('http') 
            ? media.url 
            : media.url.startsWith('/') 
              ? media.url 
              : `/${media.url}`;
          
          const isVideo = media.type === 'video';

          return (
            <div key={media.id || index} className="relative rounded-lg overflow-hidden h-32">
              {isVideo ? (
                <video
                  controls
                  src={normalizedUrl}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <img
                  src={normalizedUrl}
                  alt={`Media ${index + 1}`}
                  className="w-full h-32 object-cover"
                  onError={e => e.target.style.display = 'none'}
                />
              )}
              {allMedia.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white font-semibold">+{allMedia.length - 3}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
        className="space-y-4 sm:space-y-6"
      >
        {posts.map((post) => (
          <motion.div
            key={post.id}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="bg-[#1e1e1e] p-4 sm:p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-[#333] relative"
          >
            {isOwnProfile && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => handleMenuToggle(post.id)}
                  className="text-gray-400 hover:text-white transition-colors p-2 px-4 rounded-full hover:bg-[#333]"
                >
                  <FontAwesomeIcon icon={faEllipsis} />
                </button>
                
                <AnimatePresence>
                  {openMenuId === post.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-lg z-10 min-w-[150px]"
                    >
                      <button
                        onClick={() => handleEditPost(post)}
                        className="w-full text-left px-4 py-3 text-[#90EE90] hover:bg-[#333] transition-colors flex items-center rounded-t-lg"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-3" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeletePost(post)}
                        className="w-full text-left px-4 py-3 text-red-400 hover:bg-[#333] transition-colors flex items-center rounded-b-lg border-t border-[#444]"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-3" />
                        Supprimer
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {post.title && (
              <h3 className="text-white font-semibold text-lg mb-2 pr-10">{post.title}</h3>
            )}
            
            <p className="text-white whitespace-pre-wrap leading-relaxed mb-3 pr-10">{post.content}</p>
            
            {renderMedia(post)}
            
            <div className="text-xs text-gray-500 mt-4 flex justify-between items-center pt-3 border-t border-[#333]">
              <div className="flex items-center space-x-3">
                <span>
                  Publié le {formatDate(post.createdAt || post.publishedAt)}
                </span>
                {post.category?.name && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30">
                    <FontAwesomeIcon icon={faTag} className="mr-1 h-3 w-3" />
                    {post.category.name}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button className="hover:text-[#90EE90] transition-colors flex items-center">
                  <FontAwesomeIcon icon={faComment} className="mr-1" /> 
                  <span>{post.comments || 0}</span>
                </button>
                <LikeButton postId={post.id} initialLikes={post.likes || 0} />
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
    </>
  );
};

export default PostsList;
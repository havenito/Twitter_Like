import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faComment, faPaperPlane, faSpinner, faImage, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Notification from '../../Notification';

const CommentsModal = ({ isOpen, onClose, post, onCommentAdded }) => {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setShowNotification(false);
      setError('');
      setNewComment('');
      setMediaFiles([]);
      setMediaPreviews([]);
    }
  }, [isOpen]);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    const totalMediaCount = mediaFiles.length + files.length;
    
    if (totalMediaCount > 4) {
      setError('Vous ne pouvez ajouter que 4 médias maximum');
      return;
    }

    const newMediaFiles = [...mediaFiles];
    const newPreviews = [...mediaPreviews];

    files.forEach((file) => {
      newMediaFiles.push(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviews.push({
          file,
          url: event.target.result,
          type: file.type.startsWith('image') ? 'image' : 'video'
        });
        setMediaPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    setMediaFiles(newMediaFiles);
    setError('');
  };

  const removeMedia = (index) => {
    const newMediaFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newMediaFiles);
    setMediaPreviews(newPreviews);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() && mediaFiles.length === 0) {
      setError('Le commentaire ne peut pas être vide');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', newComment.trim());
      formData.append('post_id', post.id);
      formData.append('user_id', session.user.id);

      mediaFiles.forEach((file) => {
        formData.append('files[]', file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/comments`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Commentaire créé avec succès:', data);
        setNewComment('');
        setMediaFiles([]);
        setMediaPreviews([]);
        setError('');
        
        if (onCommentAdded) {
          onCommentAdded(post.id);
        }
        
        setShowNotification(true);
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du commentaire');
      }
    } catch (err) {
      console.error('Erreur lors de la création du commentaire:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (user) => {    
    if (!user) {
      return 'Utilisateur introuvable';
    }
    
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

  const renderProfilePicture = (user, size = 'w-8 h-8') => {
    const profilePicture = user?.profile_picture || user?.profilePicture;
    
    if (!profilePicture) {
      return (
        <Image
          src="/defaultuserpfp.png"
          alt={`Photo de profil par défaut de ${user?.pseudo || 'Utilisateur'}`}
          width={32}
          height={32}
          className={`${size} rounded-full object-cover border border-[#555]`}
        />
      );
    }

    return (
      <Image
        src={profilePicture}
        alt={`Photo de profil de ${user?.pseudo || 'Utilisateur'}`}
        width={32}
        height={32}
        className={`${size} rounded-full object-cover border border-[#555]`}
        onError={(e) => {
          console.error('Erreur de chargement de l\'image:', profilePicture);
          e.target.src = '/defaultuserpfp.png';
        }}
      />
    );
  };

  const renderMediaPreviews = () => {
    if (mediaPreviews.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {mediaPreviews.map((preview, index) => (
          <div key={index} className="relative rounded-lg overflow-hidden">
            {preview.type === 'image' ? (
              <img
                src={preview.url}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover"
              />
            ) : (
              <div className="relative">
                <video
                  src={preview.url}
                  className="w-full h-24 object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <FontAwesomeIcon icon={faPlay} className="text-white text-lg" />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => removeMedia(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const handleClose = () => {
    if (submitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setNewComment('');
      setError('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setIsClosing(false);
      onClose();            
    }, 300);  
  };

  const centeredNotificationVariants = {
    initial: { opacity: 0, x: -150, y: -50, scale: 0.3 },
    animate: { opacity: 1, x: -150, y: 0, scale: 1 },
    exit: { opacity: 0, x: -150, y: -20, scale: 0.5, transition: { duration: 0.4 } }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <AnimatePresence>
        {(isOpen || isClosing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isClosing ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={!submitting ? handleClose : undefined}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ 
                scale: isClosing ? 0.95 : 1, 
                opacity: isClosing ? 0 : 1 
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#1b1b1b] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-[#333]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#333]">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FontAwesomeIcon icon={faComment} className="mr-2 text-[#90EE90]" />
                  Nouveau commentaire
                </h2>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="text-gray-400 hover:text-white transition-colors p-2 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {post && (
                <div className="p-4 border-b border-[#333] bg-[#1e1e1e]">
                  <div className="flex items-start space-x-3">
                    {renderProfilePicture(post.user, 'w-10 h-10')}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium">
                          {getDisplayName(post.user)}
                        </span>
                        {post.user?.pseudo && (
                          <span className="text-gray-500 text-sm">
                            @{post.user.pseudo}
                          </span>
                        )}
                      </div>
                      {post.title && (
                        <h3 className="text-white font-semibold mb-1">{post.title}</h3>
                      )}
                      <p className="text-gray-300 text-sm line-clamp-3">{post.content}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 max-h-96 overflow-y-auto">
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <div className="flex items-start space-x-3">
                    {renderProfilePicture(session.user)}
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Écrivez votre commentaire..."
                        className="w-full bg-[#333] text-white placeholder-gray-400 border border-[#555] rounded-lg px-4 py-3 outline-none focus:border-[#90EE90] transition-colors resize-none"
                        rows={4}
                        maxLength={500}
                        autoFocus
                        disabled={submitting || isClosing}
                      />
                      
                      {renderMediaPreviews()}
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={submitting || isClosing || mediaFiles.length >= 4}
                            className="text-[#90EE90] hover:text-[#7CD37C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Ajouter des médias"
                          >
                            <FontAwesomeIcon icon={faImage} className="text-lg" />
                          </button>
                          <span className="text-xs text-gray-500">
                            {newComment.length}/500 • {mediaFiles.length}/4 médias
                          </span>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || (!newComment.trim() && mediaFiles.length === 0) || isClosing}
                            className="bg-[#90EE90] text-black px-6 py-2 rounded-full font-semibold hover:bg-[#7CD37C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                          >
                            {submitting ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                <span>Publication...</span>
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faPaperPlane} />
                                <span>Commenter</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                  
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </form>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showNotification && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          <Notification 
            message="Commentaire posté avec succès !" 
            type="success"
            onClose={() => setShowNotification(false)}
            variants={centeredNotificationVariants}
          />
        </div>
      )}
    </>
  );
};

export default CommentsModal;
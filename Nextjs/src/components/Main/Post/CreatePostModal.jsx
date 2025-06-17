"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faImage, 
  faSpinner,
  faTrashAlt,
  faPaperPlane,
  faTag,
  faSignature,
  faHeading
} from '@fortawesome/free-solid-svg-icons';
import Notification from '../../Notification';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('0');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const fileInputRef = useRef(null);

  // Chargement des catégories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen) return;
      
      setCategoriesLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          if (data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
          } else if (Array.isArray(data)) {
            setCategories(data);
          } else {
            throw new Error('Format de réponse invalide');
          }
        } else {
          throw new Error('Échec de récupération des catégories');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        setCategories([
          { id: 1, name: 'Général' },
          { id: 2, name: 'Technologie' },
          { id: 3, name: 'Sport' },
          { id: 4, name: 'Culture' },
          { id: 5, name: 'Divertissement' }
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategoryId('1');
    setMediaFiles([]);
    setMediaPreviews([]);
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 4) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Le titre et le contenu sont requis');
      return;
    }

    if (!session?.user?.id) {
      setError('Vous devez être connecté pour publier');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('published_at', new Date().toISOString());
      formData.append('user_id', session.user.id);
      formData.append('category_id', categoryId);

      // Ajouter les fichiers médias
      mediaFiles.forEach((file) => {
        formData.append('files[]', file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/create_post`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du post');
      }

      const result = await response.json();
      
      resetForm();
      
      // Afficher la notification de succès
      setShowNotification(true);
      
      // Fermer le modal après un délai pour laisser le temps de voir la notification
      setTimeout(() => {
        onClose();
      }, 1500);
      
      if (onPostCreated) {
        onPostCreated(result);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Variantes pour centrer parfaitement la notification
  const centeredNotificationVariants = {
    initial: { opacity: 0, x: -100, y: -50, scale: 0.3 },
    animate: { opacity: 1, x: -100, y: 0, scale: 1 },
    exit: { opacity: 0, x: -100, y: -20, scale: 0.5, transition: { duration: 0.4 } }
  };

  const maxChars = 500;
  const remainingChars = maxChars - content.length;

  return (
    <>
      {/* Notification */}
      {showNotification && (
        <Notification 
          message="Miaou posté !" 
          type="success" 
          onClose={() => setShowNotification(false)}
          variants={centeredNotificationVariants}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1b1b1b] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#333]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#333]">
                <h2 className="text-xl font-bold text-white">Créer une publication</h2>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={session?.user?.profilePicture || '/defaultuserpfp.png'}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {session?.user?.firstName} {session?.user?.lastName}
                    </p>
                    <p className="text-gray-400 text-sm">@{session?.user?.pseudo}</p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[#90EE90] text-sm font-medium mb-2">
                    <FontAwesomeIcon icon={faHeading} className="text-[#90EE90] mr-2" />
                    Titre
                  </label>
                  <input
                    type="text"
                    placeholder="Titre de votre publication"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#333] text-white placeholder-gray-400 text-lg font-medium border border-[#555] rounded-lg px-3 py-2 outline-none focus:border-[#90EE90] transition-colors"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">{title.length}/100 caractères</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[#90EE90] text-sm font-medium mb-2">
                    <FontAwesomeIcon icon={faTag} className="mr-2" />
                    Catégorie
                  </label>
                  {categoriesLoading ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-[#90EE90] mb-2"></div>
                      <span className="text-gray-400 text-sm">Chargement des catégories...</span>
                    </div>
                  ) : (
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-[#333] text-white border border-[#555] rounded-lg px-3 py-2 outline-none focus:border-[#90EE90] transition-colors"
                      required
                    >
                      {Array.isArray(categories) && categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Content */}
                <div className="relative">
                  <label className="block text-[#90EE90] text-sm font-medium mb-2">
                    <FontAwesomeIcon icon={faSignature} className="text-[#90EE90] mr-2" />
                    Contenu
                  </label>
                  <textarea
                    placeholder="Que voulez-vous partager ?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-[#333] text-white placeholder-gray-400 text-lg border border-[#555] rounded-lg px-3 py-3 outline-none focus:border-[#90EE90] transition-colors resize-none min-h-[120px]"
                    maxLength={maxChars}
                    required
                  />
                  <div className={`absolute bottom-2 right-2 text-sm ${
                    remainingChars < 50 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {remainingChars}
                  </div>
                </div>

                {/* Media Previews */}
                {mediaPreviews.length > 0 && (
                  <div>
                    <label className="block text-[#90EE90] text-sm font-medium mb-2">
                      Médias ({mediaPreviews.length}/4)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {mediaPreviews.map((preview, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden bg-[#333]">
                          {preview.type === 'image' ? (
                            <img
                              src={preview.url}
                              alt={`Preview ${index}`}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <video
                              src={preview.url}
                              className="w-full h-32 object-cover"
                              controls
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full px-2 py-1 hover:bg-opacity-80 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrashAlt} className="w-3 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                  <div className="flex items-center space-x-4">
                    {/* Media Upload */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || mediaFiles.length >= 4}
                      className="text-[#90EE90] hover:text-[#7CD37C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-full hover:bg-[#333]"
                      title="Ajouter des médias"
                    >
                      <FontAwesomeIcon icon={faImage} className="text-xl" />
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleMediaChange}
                      accept="image/*,video/*,.gif"
                      multiple
                      className="hidden"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !title.trim() || !content.trim() || remainingChars < 0 || categoriesLoading}
                    className="bg-[#90EE90] text-black px-6 py-2 rounded-full font-semibold hover:bg-[#7CD37C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Publication...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} />
                        <span>Publier</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreatePostModal;
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faPaperPlane, faSpinner, faTimes, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Notification from '../../Notification';

const SubReplyForm = ({ parentReplyId, onSubReplyAdded }) => {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && mediaFiles.length === 0) {
      setError('La réponse ne peut pas être vide');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('replies_id', parentReplyId);
      formData.append('user_id', session.user.id);

      mediaFiles.forEach((file) => {
        formData.append('files[]', file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/replies`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setContent('');
        setMediaFiles([]);
        setMediaPreviews([]);
        setError('');
        
        setShowNotification(true);
        
        if (onSubReplyAdded && data.reply) {
          onSubReplyAdded(data.reply);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la réponse');
      }
    } catch (err) {
      console.error('Erreur lors de la création de la réponse:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const centeredNotificationVariants = {
    initial: { opacity: 0, x: -165, y: -50, scale: 0.3 },
    animate: { opacity: 1, x: -165, y: 0, scale: 1 },
    exit: { opacity: 0, x: -165, y: -20, scale: 0.5, transition: { duration: 0.4 } }
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

  return (
    <>
      <div className="bg-[#1e1e1e] rounded-lg p-4 border border-[#333]">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Image
                src={session.user.profilePicture || '/defaultuserpfp.png'}
                alt="Votre photo de profil"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Répondre à cette réponse..."
                className="w-full bg-[#333] text-white placeholder-gray-400 border border-[#555] rounded-lg px-3 py-2 outline-none focus:border-[#90EE90] transition-colors resize-none"
                rows={2}
                maxLength={500}
                disabled={submitting}
              />
              
              {renderMediaPreviews()}
              
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting || mediaFiles.length >= 4}
                    className="text-[#90EE90] hover:text-[#7CD37C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Ajouter des médias"
                  >
                    <FontAwesomeIcon icon={faImage} className="text-lg" />
                  </button>
                  <span className="text-xs text-gray-500">
                    {content.length}/500 • {mediaFiles.length}/4 médias
                  </span>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || (!content.trim() && mediaFiles.length === 0)}
                  className="bg-[#90EE90] text-black px-4 py-2 rounded-full font-semibold hover:bg-[#7CD37C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} />
                      <span>Répondre</span>
                    </>
                  )}
                </button>
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

      {showNotification && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          <Notification 
            message="Réponse publiée avec succès !" 
            type="success"
            onClose={() => setShowNotification(false)}
            variants={centeredNotificationVariants}
          />
        </div>
      )}
    </>
  );
};

export default SubReplyForm;
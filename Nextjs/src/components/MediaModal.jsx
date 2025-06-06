"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChevronLeft, faChevronRight, faDownload } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

const MediaModal = ({ isOpen, onClose, media, currentIndex = 0, onNavigate }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(currentIndex);

  useEffect(() => {
    setCurrentMediaIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentMediaIndex]);

  const handlePrevious = () => {
    if (media && media.length > 1) {
      const newIndex = currentMediaIndex > 0 ? currentMediaIndex - 1 : media.length - 1;
      setCurrentMediaIndex(newIndex);
      if (onNavigate) onNavigate(newIndex);
    }
  };

  const handleNext = () => {
    if (media && media.length > 1) {
      const newIndex = currentMediaIndex < media.length - 1 ? currentMediaIndex + 1 : 0;
      setCurrentMediaIndex(newIndex);
      if (onNavigate) onNavigate(newIndex);
    }
  };

  const handleDownload = async () => {
    if (!media || !media[currentMediaIndex]) return;

    const mediaItem = media[currentMediaIndex];
    const mediaUrl = mediaItem.url.startsWith('http') ? mediaItem.url : `/${mediaItem.url}`;

    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `media-${mediaItem.id || Date.now()}.${mediaItem.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  if (!isOpen || !media || media.length === 0) return null;

  const currentMedia = media[currentMediaIndex];
  const mediaUrl = currentMedia.url.startsWith('http') ? currentMedia.url : `/${currentMedia.url}`;
  const isVideo = currentMedia.type === 'video';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/*Header*/}
        <div className="absolute top-0 left-0 right-0 z-60 bg-gradient-to-b from-black to-transparent p-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDownload}
                className="text-white hover:text-[#90EE90] transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
                title="Télécharger"
              >
                <FontAwesomeIcon icon={faDownload} className="text-lg" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {media.length > 1 && (
                <span className="text-white text-sm">
                  {currentMediaIndex + 1} / {media.length}
                </span>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-[#90EE90] transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/*Navigation gauche*/}
        {media.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-[#90EE90] transition-colors p-3 rounded-full hover:bg-white hover:bg-opacity-10 z-60"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-2xl" />
          </button>
        )}

        {/*Navigation droite*/}
        {media.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-[#90EE90] transition-colors p-3 rounded-full hover:bg-white hover:bg-opacity-10 z-60"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-2xl" />
          </button>
        )}

        {/*Média*/}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="max-w-[95vw] max-h-[95vh] relative"
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: '85vh' }}
            />
          ) : (
            <div className="relative">
              <Image
                src={mediaUrl}
                alt={`Média ${currentMediaIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-[85vh] object-contain"
                unoptimized={!mediaUrl.startsWith('/')}
                priority
              />
            </div>
          )}
        </motion.div>

        {/*Numéro média*/}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex(index);
                  if (onNavigate) onNavigate(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentMediaIndex ? 'bg-[#90EE90]' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaModal;
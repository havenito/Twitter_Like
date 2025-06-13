"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import MediaModal from '../../MediaModal';
import ReplyButton from './ReplyButton';
import ReplyLikeButton from './ReplyLikeButton';

const ReplyCardDetail = ({ reply }) => {
  const [imageError, setImageError] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

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

  const handleMediaClick = (index, e) => {
    e.stopPropagation();
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  const renderMedia = () => {
    const allMedia = Array.isArray(reply.media) ? reply.media : [];
    
    if (allMedia.length === 0) return null;

    if (allMedia.length === 1) {
      const media = allMedia[0];
      const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
      const isVideo = media.type === 'video';
      
      return (
        <div 
          className="mt-4 relative cursor-pointer group rounded-xl overflow-hidden"
          onClick={(e) => handleMediaClick(0, e)}
        >
          {isVideo ? (
            <div className="relative">
              <video 
                src={src} 
                className="w-full rounded-xl max-h-[500px] object-cover" 
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                <FontAwesomeIcon icon={faPlay} className="text-white text-5xl" />
              </div>
            </div>
          ) : (
            <img 
              src={src} 
              alt="Média de la réponse" 
              className="w-full rounded-xl max-h-[500px] object-cover group-hover:scale-[1.02] transition-transform duration-300" 
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-colors rounded-xl" />
        </div>
      );
    }

    // Grille pour plusieurs médias
    const gridClass = allMedia.length === 2 
      ? 'grid-cols-2' 
      : allMedia.length === 3 
        ? 'grid-cols-2' 
        : 'grid-cols-2';
    
    return (
      <div className={`mt-4 grid ${gridClass} gap-3 rounded-xl overflow-hidden`}>
        {allMedia.slice(0, 4).map((media, i) => {
          const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
          const isVideo = media.type === 'video';
          
          const isFirstOfThree = allMedia.length === 3 && i === 0;
          const spanClass = isFirstOfThree ? 'row-span-2' : '';
          
          return (
            <div 
              key={media.id || i} 
              className={`relative rounded-lg overflow-hidden cursor-pointer group ${spanClass}`}
              onClick={(e) => handleMediaClick(i, e)}
            >
              {isVideo ? (
                <div className="relative w-full h-48">
                  <video 
                    src={src} 
                    className="w-full h-full object-cover" 
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
                  alt={`Média ${i + 1}`} 
                  className={`w-full ${isFirstOfThree ? 'h-full' : 'h-48'} object-cover group-hover:scale-105 transition-transform duration-300`} 
                />
              )}
              
              {allMedia.length > 4 && i === 3 && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">+{allMedia.length - 3}</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderProfilePicture = () => {
    const profilePicture = reply.user?.profile_picture || reply.user?.profilePicture;
    
    if (!profilePicture || imageError) {
      return (
        <Image
          src="/defaultuserpfp.png"
          alt={`Photo de profil par défaut de ${reply.user?.pseudo || 'Utilisateur'}`}
          width={56}
          height={56}
          className="w-14 h-14 rounded-full object-cover border-2 border-[#333]"
        />
      );
    }

    return (
      <Image
        src={profilePicture}
        alt={`Photo de profil de ${reply.user?.pseudo || 'Utilisateur'}`}
        width={56}
        height={56}
        className="w-14 h-14 rounded-full object-cover border-2 border-[#333]"
        onError={() => setImageError(true)}
      />
    );
  };

  const getDisplayName = () => {
    if (!reply.user) return 'Utilisateur introuvable';
    
    const firstName = reply.user.first_name || reply.user.firstName;
    const lastName = reply.user.last_name || reply.user.lastName;
    const pseudo = reply.user.pseudo;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    return pseudo || 'Utilisateur introuvable';
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e1e1e] rounded-xl shadow-lg border border-[#333] overflow-hidden"
      >
        <div className="p-6 pb-4">
          <div className="flex items-start space-x-4">
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
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  {reply.user?.pseudo ? (
                    <Link 
                      href={`/${reply.user.pseudo}`} 
                      className="text-white font-semibold text-lg hover:text-[#90EE90] transition-colors truncate"
                    >
                      {getDisplayName()}
                    </Link>
                  ) : (
                    <span className="text-gray-400 font-semibold text-lg">Utilisateur introuvable</span>
                  )}
                  
                  {reply.user?.pseudo && (
                    <Link 
                      href={`/${reply.user.pseudo}`}
                      className="text-gray-500 hover:text-[#90EE90] transition-colors"
                    >
                      @{reply.user.pseudo}
                    </Link>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {formatDate(reply.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="text-white text-lg leading-relaxed whitespace-pre-wrap mb-4">
            {reply.content}
          </div>
          
          {renderMedia()}
        </div>

        <div className="flex px-6 pb-2 items-center justify-end space-x-4">
          <ReplyButton 
            repliesCount={reply.sub_replies?.length || 0}
            className="text-sm"
          />
          <ReplyLikeButton 
            replyId={reply.id} 
            initialLikes={reply.likes_count || 0}
            className="text-sm"
          />
        </div>
      </motion.article>

      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={reply.media || []}
        currentIndex={selectedMediaIndex}
        onNavigate={setSelectedMediaIndex}
      />
    </>
  );
};

export default ReplyCardDetail;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faPlay } from '@fortawesome/free-solid-svg-icons';
import LikeButton from '../Main/Post/LikeButton';
import FavoriteButton from '../Main/Post/FavoriteButton';
import CommentButton from '../Main/Post/CommentButton';
import MediaModal from '../MediaModal';

const PostCardDetail = ({ post }) => {
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
    const allMedia = Array.isArray(post.media) ? post.media : [];
    
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
              alt="Média du post" 
              className="w-full rounded-xl max-h-[500px] object-cover group-hover:scale-[1.02] transition-transform duration-300" 
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-colors rounded-xl" />
        </div>
      );
    }

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
    const profilePicture = post.user?.profilePicture;
    
    if (!profilePicture || imageError) {
      return (
        <Image
          src="/defaultuserpfp.png"
          alt={`Photo de profil par défaut de ${post.user?.pseudo || 'Utilisateur'}`}
          width={56}
          height={56}
          className="w-14 h-14 rounded-full object-cover border-2 border-[#333]"
        />
      );
    }

    const isValidImageUrl = profilePicture.startsWith('https://res.cloudinary.com') || 
                           profilePicture.startsWith('https://lh3.googleusercontent.com') || 
                           profilePicture.startsWith('https://avatars.githubusercontent.com') || 
                           profilePicture.startsWith('/');

    if (isValidImageUrl) {
      return (
        <Image
          src={profilePicture}
          alt={`Photo de profil de ${post.user?.pseudo || 'Utilisateur'}`}
          width={56}
          height={56}
          className="w-14 h-14 rounded-full object-cover border-2 border-[#333]"
          onError={() => setImageError(true)}
          unoptimized={!profilePicture.startsWith('/')}
        />
      );
    } else {
      return (
        <img
          src={profilePicture}
          alt={`Photo de profil de ${post.user?.pseudo || 'Utilisateur'}`}
          className="w-14 h-14 rounded-full object-cover border-2 border-[#333]"
          onError={() => setImageError(true)}
        />
      );
    }
  };

  const getDisplayName = () => {
    if (!post.user) return 'Utilisateur introuvable';
    
    const { firstName, lastName, pseudo } = post.user;
    
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
              {post.user?.pseudo ? (
                <Link href={`/${post.user.pseudo}`} className="block">
                  {renderProfilePicture()}
                </Link>
              ) : (
                renderProfilePicture()
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  {post.user?.pseudo ? (
                    <Link 
                      href={`/${post.user.pseudo}`} 
                      className="text-white font-semibold text-lg hover:text-[#90EE90] transition-colors truncate"
                    >
                      {getDisplayName()}
                    </Link>
                  ) : (
                    <span className="text-gray-400 font-semibold text-lg">Utilisateur introuvable</span>
                  )}
                  
                  {post.user?.pseudo && (
                    <Link 
                      href={`/${post.user.pseudo}`}
                      className="text-gray-500 hover:text-[#90EE90] transition-colors"
                    >
                      @{post.user.pseudo}
                    </Link>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {formatDate(post.publishedAt)}
                  </span>
                  
                  {post.category?.name && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30">
                      <FontAwesomeIcon icon={faTag} className="mr-1 h-3 w-3" />
                      {post.category.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          {post.title && (
            <h1 className="text-white font-bold text-2xl mb-4 leading-tight">
              {post.title}
            </h1>
          )}
          
          <div className="text-white text-lg leading-relaxed whitespace-pre-wrap mb-4">
            {post.content}
          </div>
          
          {renderMedia()}
        </div>

        <div className="flex px-6 pb-2 items-center justify-end space-x-4">
          <CommentButton 
            commentsCount={post.comments || 0}
            className="text-sm"
          />
          <LikeButton 
            postId={post.id} 
            initialLikes={post.likes || 0}
            className="text-sm"
          />
          <FavoriteButton 
            postId={post.id}
            className="text-sm"
          />
        </div>
      </motion.article>

      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={post.media || []}
        currentIndex={selectedMediaIndex}
        onNavigate={setSelectedMediaIndex}
      />
    </>
  );
};

export default PostCardDetail;
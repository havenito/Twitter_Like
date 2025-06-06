"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-regular-svg-icons';
import { faTag } from '@fortawesome/free-solid-svg-icons';
import LikeButton from './LikeButton';
import FavoriteButton from './FavoriteButton';

const PostCard = ({ post }) => {
  const [imageError, setImageError] = useState(false);

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

  const renderMedia = () => {
    const allMedia = Array.isArray(post.media) ? post.media : [];
    
    if (allMedia.length === 0) return null;

    if (allMedia.length === 1) {
      const media = allMedia[0];
      const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
      return media.type === 'video'
        ? <video controls src={src} className="w-full rounded-lg max-h-96 object-cover" />
        : <img src={src} alt="" className="w-full rounded-lg max-h-96 object-cover" />;
    }

    const cols = allMedia.length === 2 ? 'grid-cols-2' : allMedia.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
    
    return (
      <div className={`mt-3 grid ${cols} gap-2`}>
        {allMedia.slice(0,4).map((media, i) => {
          const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
          const isVideo = media.type === 'video';
          return (
            <div key={media.id||i} className="relative rounded-lg overflow-hidden">
              {isVideo
                ? <video controls src={src} className="w-full h-32 object-cover" />
                : <img src={src} alt="" className="w-full h-32 object-cover" />
              }
              {allMedia.length > 4 && i === 3 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white font-semibold">+{allMedia.length-3}</span>
                </div>
              )}
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
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
        />
      );
    }

    const isValidImageUrl = profilePicture.startsWith('https://res.cloudinary.com') || profilePicture.startsWith('https://lh3.googleusercontent.com') || profilePicture.startsWith('https://avatars.githubusercontent.com') || profilePicture.startsWith('/');

    if (isValidImageUrl) {
      return (
        <Image
          src={profilePicture}
          alt={`Photo de profil de ${post.user?.pseudo || 'Utilisateur'}`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
          onError={() => setImageError(true)}
          unoptimized={!profilePicture.startsWith('/')}
        />
      );
    } else {
      return (
        <img
          src={profilePicture}
          alt={`Photo de profil de ${post.user?.pseudo || 'Utilisateur'}`}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1e1e1e] p-4 sm:p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-[#333]"
    >
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 mr-3">
          {post.user?.pseudo ? (
            <Link href={`/${post.user.pseudo}`} className="block">
              {renderProfilePicture()}
            </Link>
          ) : (
            renderProfilePicture()
          )}
        </div>
        
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {post.user?.pseudo ? (
              <Link 
                href={`/${post.user.pseudo}`} 
                className="text-white font-medium hover:text-[#90EE90] transition-colors truncate"
              >
                {getDisplayName()}
              </Link>
            ) : (
              <span className="text-gray-400 font-medium">Utilisateur introuvable</span>
            )}
            
            {post.user?.pseudo && (
              <Link 
                href={`/${post.user.pseudo}`}
                className="text-gray-500 text-sm hover:text-[#90EE90] transition-colors"
              >
                @{post.user.pseudo}
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">
              {formatDate(post.publishedAt)}
            </span>
            
            {post.category?.name && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30">
                <FontAwesomeIcon icon={faTag} className="mr-1 h-3 w-3" />
                {post.category.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {post.title && (
        <h3 className="text-white font-semibold text-lg mb-2">{post.title}</h3>
      )}
      
      <p className="text-white whitespace-pre-wrap leading-relaxed mb-3">{post.content}</p>
      
      {renderMedia()}
      
      <div className="text-xs text-gray-500 mt-4 flex justify-between items-center pt-3 border-t border-[#333]">
        <div className="flex items-center space-x-4">
          <button className="hover:text-[#90EE90] transition-colors flex items-center">
            <FontAwesomeIcon icon={faComment} className="mr-1" /> 
            <span>{post.comments || 0}</span>
          </button>
          <LikeButton postId={post.id} initialLikes={post.likes || 0} />
          <FavoriteButton postId={post.id} />
        </div>
        <span>{formatDate(post.publishedAt)}</span>
      </div>
    </motion.div>
  );
};

export default PostCard;
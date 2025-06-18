"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-regular-svg-icons';
import { faTag, faPlay, faFlag } from '@fortawesome/free-solid-svg-icons';
import LikeButton from './LikeButton';
import FavoriteButton from './FavoriteButton';
import MediaModal from '../../MediaModal';
import CommentsModal from './CommentsModal';
import CommentButton from './CommentButton';
import ReportModal from '../../Signalement/Signalement';

const PostCard = ({ post, disableNavigation = false }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [showReport, setShowReport] = useState(false);

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

  const handlePostClick = (e) => {
    if (
      disableNavigation ||
      e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('[data-interactive]')
    ) {
      return;
    }
    
    if (post.user?.pseudo) {
      router.push(`/${post.user.pseudo}/post/${post.id}`);
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
          className="mt-3 relative cursor-pointer group rounded-lg overflow-hidden"
          onClick={(e) => handleMediaClick(0, e)}
          data-interactive="true"
        >
          {isVideo ? (
            <div className="relative">
              <video 
                src={src} 
                className="w-full rounded-lg max-h-96 object-cover" 
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
              alt="" 
              className="w-full rounded-lg max-h-96 object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors" />
        </div>
      );
    }

    const cols = allMedia.length === 2 ? 'grid-cols-2' : allMedia.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
    
    return (
      <div className={`mt-3 grid ${cols} gap-2`} data-interactive="true">
        {allMedia.slice(0,4).map((media, i) => {
          const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
          const isVideo = media.type === 'video';
          return (
            <div 
              key={media.id||i} 
              className="relative rounded-lg overflow-hidden cursor-pointer group"
              onClick={(e) => handleMediaClick(i, e)}
            >
              {isVideo ? (
                <div className="relative">
                  <video 
                    src={src} 
                    className="w-full h-32 object-cover" 
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-colors">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-2xl" />
                  </div>
                </div>
              ) : (
                <img 
                  src={src} 
                  alt="" 
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              )}
              {allMedia.length > 4 && i === 3 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white font-semibold">+{allMedia.length-3}</span>
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
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
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

  const handleCommentAdded = (postId) => {
    if (postId === post.id) {
      setCommentsCount(prev => prev + 1);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handlePostClick}
        className={`bg-[#1e1e1e] p-4 sm:p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-[#333] ${
          !disableNavigation ? 'cursor-pointer hover:bg-[#252525]' : ''
        }`}
      >
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 mr-3" data-interactive="true">
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
                  data-interactive="true"
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
                  data-interactive="true"
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
          <div className="flex items-center space-x-4" data-interactive="true">
            <CommentButton 
              commentsCount={commentsCount}
              onClick={() => setShowCommentsModal(true)}
            />
            <LikeButton postId={post.id} initialLikes={post.likes || 0} />
            <FavoriteButton postId={post.id} />
            
            {/* Bouton signaler - seulement si l'utilisateur est connecté et ce n'est pas son propre post */}
            {session?.user && session.user.id !== post.user?.id && (
              <button
                className="hover:text-orange-400 transition-colors flex items-center p-2 rounded-full group"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReport(true);
                }}
                title="Signaler ce post"
                data-interactive="true"
              >
                <FontAwesomeIcon icon={faFlag} className="mr-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs">Signaler</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={post.media || []}
        currentIndex={selectedMediaIndex}
        onNavigate={setSelectedMediaIndex}
      />

      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        post={post}
        onCommentAdded={handleCommentAdded}
      />

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        userId={session?.user?.id}
        postId={post.id}
        reportedUserId={post.user?.id}
      />
    </>
  );
};

export default PostCard;
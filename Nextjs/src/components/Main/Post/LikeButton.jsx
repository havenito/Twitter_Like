'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';

const LikeButton = ({ 
  postId, 
  initialLikes = 0, 
  className = "",
  disabled = false 
}) => {
  const { data: session } = useSession();
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!session?.user?.id || !postId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}/posts/${postId}/like-status`
        );
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.liked);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de like:', error);
      }
    };

    checkLikeStatus();
  }, [session?.user?.id, postId]);

  const handleLike = async () => {
    if (!session?.user?.id) {
      alert('Vous devez être connecté pour liker un post');
      return;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${postId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: session.user.id
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(data.likes_count);
      } else {
        const errorData = await response.json();
        console.error('Erreur lors du like:', errorData.error);
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleLike}
      disabled={loading || disabled}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`flex items-center space-x-1 transition-colors p-1 rounded-full group ${
        isLiked 
          ? 'text-red-500 hover:text-red-600 hover:bg-red-50 hover:bg-opacity-10' 
          : 'text-gray-400 hover:text-red-500 hover:bg-red-50 hover:bg-opacity-10'
      } ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <motion.div
        animate={isAnimating ? { 
          scale: [1, 1.3, 1],
          rotate: [0, -10, 10, -5, 0]
        } : {}}
        transition={{ 
          duration: 0.6,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <FontAwesomeIcon 
          icon={isLiked ? faHeart : faHeartRegular} 
          className="text-sm"
        />
        
        <AnimatePresence>
          {isAnimating && isLiked && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: 0, 
                    scale: 1,
                    x: Math.cos((i * 60) * Math.PI / 180) * 20,
                    y: Math.sin((i * 60) * Math.PI / 180) * 20
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full"
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
      
      <motion.span
        whileHover={!disabled ? { scale: 1.1 } : {}}
        transition={{ duration: 0.2 }}
        className={`text-xs transition-colors duration-300 ${
          isLiked 
            ? 'text-red-500 group-hover:text-red-600' 
            : 'text-gray-400 group-hover:text-red-500'
        }`}
      >
        {likesCount}
      </motion.span>
    </motion.button>
  );
};

export default LikeButton;
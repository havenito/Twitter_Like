'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

const FavoriteButton = ({ postId }) => {
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!session?.user?.id || !postId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}/posts/${postId}/favorite-status`
        );
        
        if (response.ok) {
          const data = await response.json();
          setIsFavorited(data.favorited);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de favori:', error);
      }
    };

    checkFavoriteStatus();
  }, [session?.user?.id, postId]);

  const handleFavorite = async () => {
    if (!session?.user?.id) {
      alert('Vous devez être connecté pour ajouter un post aux favoris');
      return;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${postId}/favorite`,
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
        setIsFavorited(data.favorited);
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la gestion du favori:', errorData.error);
      }
    } catch (error) {
      console.error('Erreur lors de la gestion du favori:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleFavorite}
      disabled={loading}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center space-x-1 transition-colors p-2 rounded-full group ${
        isFavorited 
          ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 hover:bg-opacity-10' 
          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 hover:bg-opacity-10'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          icon={isFavorited ? faStar : faStarRegular} 
          className="text-sm"
        />
      </motion.div>
      
      <motion.span
        animate={isAnimating ? { 
          scale: [1, 1.2, 1]
        } : {}}
        transition={{ duration: 0.3 }}
        className={`transition-colors duration-300 text-xs ${
          isFavorited 
            ? 'text-yellow-500 group-hover:text-yellow-600' 
            : 'text-gray-400 group-hover:text-yellow-500'
        }`}
      >
        Favori
      </motion.span>
    </motion.button>
  );
};

export default FavoriteButton;
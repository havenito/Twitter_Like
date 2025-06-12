import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { useSession } from 'next-auth/react';

const ReplyLikeButton = ({ 
  replyId, 
  initialLikes = 0, 
  className = "",
  disabled = false 
}) => {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    console.log('ReplyLikeButton props:', { replyId, initialLikes, likesCount });
    setLikesCount(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    if (!session?.user?.id || !replyId) return;

    const checkLikeStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}/replies/${replyId}/like-status`
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
  }, [session?.user?.id, replyId]);

  const handleLike = async () => {
    if (!session?.user?.id) {
      alert('Vous devez être connecté pour liker une réponse');
      return;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/replies/${replyId}/like`,
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
          rotate: [0, -10, 10, 0]
        } : {}}
        transition={{ duration: 0.6 }}
      >
        <FontAwesomeIcon 
          icon={isLiked ? faHeart : faHeartRegular}
          className="text-sm"
        />
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

export default ReplyLikeButton;
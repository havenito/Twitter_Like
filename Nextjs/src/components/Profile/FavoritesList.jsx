import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import PostCard from '../Main/Post/PostCard';

const FavoritesList = ({ favorites, isOwnProfile, userPseudo }) => {
  if (!favorites || favorites.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-10 text-center text-gray-400"
      >
        <FontAwesomeIcon icon={faStar} className="text-3xl mb-3 text-gray-500" />
        <p className="text-lg">
          {isOwnProfile 
            ? "Vous n'avez encore aucun favori." 
            : `@${userPseudo} n'a encore aucun favori.`}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      className="space-y-4 sm:space-y-6"
    >
      {favorites.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </motion.div>
  );
};

export default FavoritesList;
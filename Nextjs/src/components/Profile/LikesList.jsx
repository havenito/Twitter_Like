import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartCrack } from '@fortawesome/free-solid-svg-icons';
import PostCard from '../Main/Post/PostCard';

const LikesList = ({ likes, userPseudo, isOwnProfile }) => {
  if (!likes || likes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-10 text-center text-gray-400"
      >
        <FontAwesomeIcon icon={faHeartCrack} className="text-3xl mb-3 text-gray-500" />
        <p className="text-lg">
          {isOwnProfile 
            ? "Vous n'avez encore aimé aucune publication." 
            : `@${userPseudo} n'a encore aimé aucune publication.`}
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
      {likes.map((post) => (
        <motion.div
          key={`liked-${post.id}`}
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="relative"
        >
          <PostCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default LikesList;
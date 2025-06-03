import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartCrack } from '@fortawesome/free-solid-svg-icons';

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
      {likes.map((likedItem) => ( // 'likedItem' devrait être une structure de post
        <motion.div
          key={likedItem.id}
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="bg-[#1e1e1e] p-4 sm:p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          {/* Afficher ici une version résumée ou complète du post aimé */}
          <p className="text-white">
            Contenu du post aimé : {likedItem.content || "Contenu non disponible"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Par @{likedItem.authorPseudo || 'Auteur inconnu'} - Aimé le {new Date(likedItem.likedAt || Date.now()).toLocaleDateString('fr-FR')}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default LikesList;
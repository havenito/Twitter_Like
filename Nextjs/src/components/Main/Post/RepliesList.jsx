import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faComment } from '@fortawesome/free-solid-svg-icons';
import ReplyItem from './ReplyItem';

const RepliesList = ({ replies, loading, commentId }) => {
  if (loading) {
    return (
      <div className="bg-[#1e1e1e] rounded-lg p-8 border border-[#333] text-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-[#90EE90] mb-3" />
        <p className="text-gray-400">Chargement des réponses...</p>
      </div>
    );
  }

  if (!replies || replies.length === 0) {
    return (
      <div className="bg-[#1e1e1e] rounded-lg p-8 border border-[#333] text-center">
        <FontAwesomeIcon icon={faComment} className="text-3xl text-gray-500 mb-3" />
        <h3 className="text-white font-semibold mb-2">Aucune réponse</h3>
        <p className="text-gray-400">Soyez le premier à répondre à ce commentaire !</p>
      </div>
    );
  }

  // Trier les réponses par nombre de likes décroissants, puis par date décroissante
  const sortReplies = (repliesArray) => {
    return [...repliesArray].sort((a, b) => {
      const aLikes = a.likes_count || 0;
      const bLikes = b.likes_count || 0;

      if (aLikes !== bLikes) {
        return bLikes - aLikes;
      }

      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return bDate - aDate;
    });
  };

  const getReorderedReplies = () => {
    const sortedReplies = sortReplies(replies);
    const cols = 2;
    const reordered = [];
    
    for (let i = 0; i < sortedReplies.length; i += cols) {
      const row = sortedReplies.slice(i, i + cols);
      
      row.forEach((reply, colIndex) => {
        const targetIndex = colIndex * Math.ceil(sortedReplies.length / cols) + Math.floor(i / cols);
        if (!reordered[targetIndex]) {
          reordered[targetIndex] = reply;
        }
      });
    }
    
    return reordered.filter(reply => reply !== undefined);
  };

  const reorderedReplies = getReorderedReplies();

  return (
    <div className="space-y-6">
      <h3 className="text-white font-semibold text-lg mb-4">
        Réponses ({replies.length})
      </h3>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
        className="columns-1 xl:columns-2 gap-4"
        style={{ columnFill: 'balance' }}
      >
        {reorderedReplies.map((reply) => (
          <motion.div
            key={reply.id}
            variants={{ 
              hidden: { opacity: 0, y: 20 }, 
              visible: { opacity: 1, y: 0 } 
            }}
            className="break-inside-avoid mb-4 inline-block w-full"
          >
            <ReplyItem 
              reply={reply}
              commentId={commentId}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default RepliesList;
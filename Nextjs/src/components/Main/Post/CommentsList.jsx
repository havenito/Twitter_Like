import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import CommentItem from './CommentItem';

const CommentsList = ({ comments, loading, postId }) => {
  if (loading) {
    return (
      <div className="bg-[#1e1e1e] rounded-lg p-8 border border-[#333] text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90] mb-4 mx-auto"></div>
        <p className="text-gray-400">Chargement des commentaires...</p>
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="bg-[#1e1e1e] rounded-lg p-8 border border-[#333] text-center">
        <FontAwesomeIcon icon={faComment} className="text-3xl text-gray-500 mb-3" />
        <h3 className="text-white font-semibold mb-2">Aucun commentaire</h3>
        <p className="text-gray-400">Soyez le premier à commenter ce post !</p>
      </div>
    );
  }

  // Trier les commentaires par nombre de likes décroissants, puis par date décroissante
  const sortComments = (commentsArray) => {
    return [...commentsArray].sort((a, b) => {
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

  // Organiser les commentaires en ordre colonne par colonne
  const getReorderedComments = () => {
    const sortedComments = sortComments(comments);
    const cols = 2;
    const reordered = [];
    
    for (let i = 0; i < sortedComments.length; i += cols) {
      const row = sortedComments.slice(i, i + cols);
      
      row.forEach((comment, colIndex) => {
        const targetIndex = colIndex * Math.ceil(sortedComments.length / cols) + Math.floor(i / cols);
        if (!reordered[targetIndex]) {
          reordered[targetIndex] = comment;
        }
      });
    }
    
    return reordered.filter(comment => comment !== undefined);
  };

  const reorderedComments = getReorderedComments();

  return (
    <div className="space-y-6">
      <h3 className="text-white font-semibold text-lg mb-4">
        Commentaires ({comments.length})
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
        {reorderedComments.map((comment) => (
          <motion.div
            key={comment.id}
            variants={{ 
              hidden: { opacity: 0, y: 20 }, 
              visible: { opacity: 1, y: 0 } 
            }}
            className="break-inside-avoid mb-4 inline-block w-full"
          >
            <CommentItem 
              comment={comment}
              postId={postId}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default CommentsList;
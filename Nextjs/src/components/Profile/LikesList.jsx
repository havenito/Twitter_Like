import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartCrack, faFilter, faHeart, faComment, faReply } from '@fortawesome/free-solid-svg-icons';
import PostCard from '../Main/Post/PostCard';
import LikedCommentCard from './LikedCommentCard';
import LikedReplyCard from './LikedReplyCard';

const LikesList = ({ likes, userPseudo, isOwnProfile }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const organizedLikes = useMemo(() => {
    if (!likes || likes.length === 0) return { posts: [], comments: [], replies: [] };
    
    const posts = [];
    const comments = [];
    const replies = [];
    
    likes.forEach(item => {
      if (item.type === 'post' || !item.type) {
        posts.push(item);
      } else if (item.type === 'comment') {
        comments.push(item);
      } else if (item.type === 'reply') {
        replies.push(item);
      }
    });
    
    return { posts, comments, replies };
  }, [likes]);

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case 'posts':
        return organizedLikes.posts;
      case 'comments':
        return organizedLikes.comments;
      case 'replies':
        return organizedLikes.replies;
      default:
        return [...organizedLikes.posts, ...organizedLikes.comments, ...organizedLikes.replies];
    }
  }, [organizedLikes, activeFilter]);

  const filterOptions = [
    { 
      id: 'all', 
      label: 'Tout', 
      shortLabel: 'Tout', 
      icon: faFilter,
      count: organizedLikes.posts.length + organizedLikes.comments.length + organizedLikes.replies.length
    },
    { 
      id: 'posts', 
      label: 'Publications', 
      shortLabel: 'Posts', 
      icon: faHeart,
      count: organizedLikes.posts.length
    },
    { 
      id: 'comments', 
      label: 'Commentaires', 
      shortLabel: 'Comm.', 
      icon: faComment,
      count: organizedLikes.comments.length
    },
    { 
      id: 'replies', 
      label: 'Réponses', 
      shortLabel: 'Rép.', 
      icon: faReply,
      count: organizedLikes.replies.length
    }
  ];

  const totalLikes = organizedLikes.posts.length + organizedLikes.comments.length + organizedLikes.replies.length;

  if (!likes || totalLikes === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-10 text-center text-gray-400"
      >
        <FontAwesomeIcon icon={faHeartCrack} className="text-3xl sm:text-4xl mb-3 text-gray-500" />
        <p className="text-base sm:text-lg px-4">
          {isOwnProfile 
            ? "Vous n'avez encore aimé aucune publication." 
            : `@${userPseudo} n'a encore aimé aucune publication.`}
        </p>
      </motion.div>
    );
  }

  const renderItem = (item) => {
    if (item.type === 'comment') {
      return <LikedCommentCard key={`comment-${item.id}`} comment={item} />;
    } else if (item.type === 'reply') {
      return <LikedReplyCard key={`reply-${item.id}`} reply={item} />;
    } else {
      return (
        <div key={`post-${item.id}`}>
          <PostCard post={item} />
        </div>
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-[#1e1e1e] p-3 sm:p-4 rounded-lg border border-[#333]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium text-sm sm:text-base flex items-center">
            <FontAwesomeIcon icon={faFilter} className="mr-2 text-[#90EE90] text-xs sm:text-sm" />
            Filtrer par type
          </h3>
          <span className="text-xs text-gray-500">
            {filteredItems.length} élément{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveFilter(option.id)}
              className={`relative whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2.5 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0
                ${activeFilter === option.id 
                  ? 'bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-50' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] border border-transparent'
                }`}
            >
              <FontAwesomeIcon icon={option.icon} className="text-xs" />
              <span className="block sm:hidden">{option.shortLabel}</span>
              <span className="hidden sm:block">{option.label}</span>
              <span className="bg-gray-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8 sm:py-10 text-center text-gray-400 bg-[#1e1e1e] rounded-lg border border-[#333]"
        >
          <FontAwesomeIcon 
            icon={activeFilter === 'posts' ? faHeart : activeFilter === 'comments' ? faComment : activeFilter === 'replies' ? faReply : faFilter} 
            className="text-2xl sm:text-3xl mb-3 text-gray-500" 
          />
          <p className="text-sm sm:text-base px-4">
            {activeFilter === 'posts' && (
              isOwnProfile 
                ? "Vous n'avez encore aimé aucune publication." 
                : `@${userPseudo} n'a encore aimé aucune publication.`
            )}
            {activeFilter === 'comments' && (
              isOwnProfile 
                ? "Vous n'avez encore aimé aucun commentaire." 
                : `@${userPseudo} n'a encore aimé aucun commentaire.`
            )}
            {activeFilter === 'replies' && (
              isOwnProfile 
                ? "Vous n'avez encore aimé aucune réponse." 
                : `@${userPseudo} n'a encore aimé aucune réponse.`
            )}
            {activeFilter === 'all' && (
              isOwnProfile 
                ? "Vous n'avez encore rien aimé." 
                : `@${userPseudo} n'a encore rien aimé.`
            )}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="space-y-4 sm:space-y-6"
        >
          {filteredItems.map((item, index) => (
            <motion.div
              key={`${item.type || 'post'}-${item.id}-${index}`}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              {renderItem(item)}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default LikesList;
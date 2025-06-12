import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-regular-svg-icons';

const ReplyButton = ({ 
  repliesCount = 0, 
  onClick, 
  className = "",
  disabled = false 
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center space-x-1 transition-colors p-1 rounded-full group ${
        disabled 
          ? 'opacity-50 cursor-not-allowed text-gray-500' 
          : 'text-gray-400 hover:text-[#90EE90] hover:bg-[#90EE90] hover:bg-opacity-10'
      } ${className}`}
    >
      <motion.div
        whileHover={!disabled ? { rotate: [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <FontAwesomeIcon 
          icon={faComment} 
          className="text-sm"
        />
      </motion.div>
      
      <motion.span
        whileHover={!disabled ? { scale: 1.1 } : {}}
        transition={{ duration: 0.2 }}
        className={`text-xs transition-colors duration-300 ${
          disabled 
            ? 'text-gray-500' 
            : 'text-gray-400 group-hover:text-[#90EE90]'
        }`}
      >
        {repliesCount}
      </motion.span>
    </motion.button>
  );
};

export default ReplyButton;
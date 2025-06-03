"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const FloatingCreateButton = ({ onClick }) => {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 md:hidden bg-[#90EE90] text-black p-4 rounded-full shadow-lg hover:bg-[#7CD37C] transition-colors z-40"
    >
      <FontAwesomeIcon icon={faPlusCircle} className="text-xl" />
    </motion.button>
  );
};

export default FloatingCreateButton;
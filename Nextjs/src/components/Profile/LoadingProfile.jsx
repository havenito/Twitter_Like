import React from 'react';
import { motion } from 'framer-motion';

const LoadingProfile = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] text-white p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex flex-col items-center text-center"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 mb-8 border-b-4 border-[#90EE90]"></div>
        <p className="text-gray-300 text-lg sm:text-xl">Chargement du profil...</p>
        <p className="text-gray-500 text-sm mt-1">Un instant, nous préparons tout.</p>
      </motion.div>
    </div>
  );
};

export default LoadingProfile;
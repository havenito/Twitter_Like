import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSlash, faArrowLeft, faHome } from '@fortawesome/free-solid-svg-icons';

const ProfileNotFound = ({ error }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] px-4 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-md w-full p-6 sm:p-8 bg-[#1e1e1e] rounded-xl shadow-2xl"
      >
        <FontAwesomeIcon 
          icon={faUserSlash} 
          className="text-red-500 text-5xl sm:text-6xl mb-6" 
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Oups ! Profil Introuvable</h1>
        <p className="text-gray-400 mb-8 text-base sm:text-lg">
          {error || "Désolé, le profil que vous cherchez n'existe pas ou n'est plus disponible."}
        </p>
        <Link href="/home" passHref>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#7CD37C' }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#90EE90] text-black px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-semibold flex items-center justify-center mx-auto text-sm sm:text-md hover:shadow-lg transition-all duration-200"
          >
            <FontAwesomeIcon icon={faHome} className="mr-2" />
            Retour à l'accueil
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default ProfileNotFound;
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUserPlus, faComment, faStar } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const EmptyNotifications = ({ activeFilter }) => {
  const getEmptyStateContent = () => {
    switch (activeFilter) {
      case 'follows':
        return {
          icon: faUserPlus,
          title: 'Aucune notification de suivi',
          description: 'Vous n\'avez pas encore reçu de demandes de suivi ou de nouveaux abonnés.',
          action: {
            text: 'Découvrir des utilisateurs',
            href: '/home'
          }
        };
      case 'comments':
        return {
          icon: faComment,
          title: 'Aucun commentaire reçu',
          description: 'Personne n\'a encore commenté vos publications.',
          action: {
            text: 'Voir vos publications',
            href: `/home`
          }
        };
      default:
        return {
          icon: faBell,
          title: 'Aucune notification',
          description: 'Vous êtes à jour ! Aucune nouvelle notification pour le moment.',
          action: {
            text: 'Explorer Minouverse',
            href: '/home'
          }
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.2, 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
          className="w-20 h-20 mx-auto mb-6 bg-[#90EE90] bg-opacity-20 rounded-full flex items-center justify-center relative"
        >
          <FontAwesomeIcon 
            icon={content.icon} 
            className="text-3xl text-[#90EE90]" 
          />
          
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-[#90EE90] bg-opacity-10 rounded-full"
          />
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold text-white mb-3"
        >
          {content.title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-8 leading-relaxed"
        >
          {content.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href={content.action.href}
            className="inline-flex items-center px-6 py-3 bg-[#90EE90] text-black font-semibold rounded-full hover:bg-[#7CD37C] transition-all duration-200 transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faStar} className="mr-2" />
            {content.action.text}
          </Link>
        </motion.div>

        <div className="mt-12 flex justify-center space-x-4 opacity-30">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-[#90EE90] rounded-full"
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            className="w-2 h-2 bg-[#90EE90] rounded-full"
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            className="w-2 h-2 bg-[#90EE90] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default EmptyNotifications;
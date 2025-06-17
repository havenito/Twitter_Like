import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faXmark } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion'; 

// Accepter une nouvelle prop 'variants' (renommée propVariants pour éviter conflit de nom)
export default function Notification({ message, type = 'success', duration = 3000, onClose, variants: propVariants }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 500); 
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 500); 
  };

  // Définir les variantes par défaut
  const defaultNotificationVariants = {
    initial: { opacity: 0, y: -50, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.5, transition: { duration: 0.4 } }
  };

  // Utiliser les variantes passées en prop, ou les variantes par défaut sinon
  const notificationVariants = propVariants || defaultNotificationVariants;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          // Utiliser les variantes déterminées ci-dessus
          variants={notificationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center px-4 py-3 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-[#90EE90] text-black' : 'bg-red-500/90 text-white'
          }`} 
        >
          <FontAwesomeIcon 
            icon={type === 'success' ? faCheckCircle : faXmark} 
            className="mr-2" 
          />
          <span className="font-medium">{message}</span>
          <button 
            onClick={handleClose} 
            className={`ml-4 ${type === 'success' ? 'text-black/50 hover:text-black' : 'text-white/70 hover:text-white'}`} 
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
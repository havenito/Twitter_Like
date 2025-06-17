import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faInfoCircle, faXmark } from '@fortawesome/free-solid-svg-icons';

const SubscriptionNotification = ({ 
  type = 'success', 
  message, 
  isVisible, 
  onClose, 
  duration = 5000,
  details 
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        if (onClose) {
          setTimeout(onClose, 300); // Délai pour l'animation de sortie
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const handleClose = () => {
    setShow(false);
    if (onClose) {
      setTimeout(onClose, 300);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faTimesCircle;
      case 'info':
        return faInfoCircle;
      default:
        return faInfoCircle;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          icon: 'text-green-400',
          text: 'text-green-300'
        };
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: 'text-red-400',
          text: 'text-red-300'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          icon: 'text-blue-400',
          text: 'text-blue-300'
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          icon: 'text-gray-400',
          text: 'text-gray-300'
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 max-w-md w-full mx-4"
        >
          <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 shadow-lg backdrop-blur-sm`}>
            <div className="flex items-start">
              <FontAwesomeIcon 
                icon={getIcon()} 
                className={`${colors.icon} text-xl mr-3 mt-0.5 flex-shrink-0`} 
              />
              <div className="flex-grow">
                <p className={`${colors.text} font-medium text-sm`}>
                  {message}
                </p>
                {details && (
                  <p className="text-gray-400 text-xs mt-1">
                    {details}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors ml-2 flex-shrink-0"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionNotification;
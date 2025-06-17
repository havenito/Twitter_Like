import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={isLoading ? undefined : onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#222] rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#90EE90] mb-4">
              <FontAwesomeIcon 
                icon={faExclamationTriangle} 
                className="h-6 w-6 text-[#222]" 
              />
            </div>
            
            <h3 className="text-xl font-semibold mb-4 text-white">
              {title}
            </h3>
            
            <div className="text-gray-300 mb-6">
              <p>{message}</p>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#90EE90]"></div>
                <span className="ml-3 text-gray-300">Déconnexion en cours...</span>
              </div>
            ) : (
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-6 py-2 rounded-full text-gray-300 hover:bg-[#444] transition-colors"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className="px-6 py-2 bg-[#90EE90] text-[#222] rounded-full hover:bg-[#7CD37C] transition-colors font-semibold"
                >
                  Confirmer
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
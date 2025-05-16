import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={isLoading ? undefined : onClose} 
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-[#2a2a2a] p-6 rounded-lg shadow-xl w-full max-w-sm text-white"
            onClick={(e) => e.stopPropagation()} 
          >
            <h3 className="text-xl font-semibold mb-4 text-[#90EE90]">{title}</h3>
            <p className="text-gray-300 mb-6">{message}</p>
            {isLoading ? (
              <div className="flex justify-center items-center py-3">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90]"></div>
              </div>
            ) : (
              <div className="flex justify-end gap-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-gray-300 hover:bg-[#444] transition-colors"
                >
                  Non
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-[#90EE90] text-black rounded-full hover:bg-[#7CD37C] transition-colors font-semibold"
                >
                  Oui
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
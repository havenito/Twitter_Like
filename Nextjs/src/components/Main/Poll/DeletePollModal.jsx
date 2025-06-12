"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTrash } from '@fortawesome/free-solid-svg-icons';

const DeletePollModal = ({ isOpen, onClose, onConfirm, isLoading, pollTitle }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#222] rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-600 mb-4">
              <FontAwesomeIcon 
                icon={faExclamationTriangle} 
                className="h-6 w-6 text-white" 
              />
            </div>
            
            <h3 className="text-xl font-semibold mb-4 text-white">
              Supprimer ce sondage ?
            </h3>
            
            <div className="text-gray-300 mb-6 space-y-3">
              <p>
                Êtes-vous sûr de vouloir supprimer ce sondage ?
              </p>
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 text-red-200">
                <p className="text-sm flex items-start">
                  <FontAwesomeIcon icon={faTrash} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Attention :</strong> Cette action est irréversible. 
                    Le sondage et tous ses votes seront définitivement supprimés.
                  </span>
                </p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                <span className="ml-3 text-gray-300">Suppression en cours...</span>
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
                  className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-semibold"
                >
                  Supprimer
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeletePollModal;
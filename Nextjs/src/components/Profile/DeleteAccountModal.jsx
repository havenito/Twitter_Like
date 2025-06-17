import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faSpinner, faXmark, faEnvelope } from '@fortawesome/free-solid-svg-icons';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, isLoading, userEmail }) => {
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (e) => {
    setEmailConfirmation(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleConfirm = () => {
    if (emailConfirmation.toLowerCase() !== userEmail.toLowerCase()) {
      setEmailError('L\'adresse email ne correspond pas à celle de votre compte');
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmailConfirmation('');
      setEmailError('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#222] rounded-2xl p-6 w-full max-w-md border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={faExclamationTriangle} 
                  className="text-red-500 text-xl mr-3" 
                />
                <h2 className="text-xl font-bold text-white">
                  Supprimer le compte
                </h2>
              </div>
              {!isLoading && (
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <h3 className="text-red-400 font-semibold mb-2">
                Action irréversible
              </h3>
              <p className="text-gray-300 text-sm">
                Cette action supprimera définitivement votre compte et toutes vos données :
              </p>
              <ul className="text-gray-300 text-sm mt-2 ml-4 list-disc">
                <li>Toutes vos publications</li>
                <li>Vos abonnements et abonnés</li>
                <li>Votre profil et vos médias</li>
                <li>Toutes vos données personnelles</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Pour confirmer, tapez votre adresse email :
              </label>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faEnvelope} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="email"
                  value={emailConfirmation}
                  onChange={handleEmailChange}
                  placeholder={userEmail}
                  className="w-full pl-10 pr-3 py-3 bg-[#333] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isLoading}
                />
              </div>
              {emailError && (
                <p className="text-red-400 text-sm mt-2">{emailError}</p>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                <span className="ml-3 text-gray-300">Suppression du compte en cours...</span>
              </div>
            ) : (
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="px-6 py-2 rounded-full text-gray-300 hover:bg-[#444] transition-colors"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={!emailConfirmation}
                  className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Supprimer définitivement
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountModal;
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faXmark } from '@fortawesome/free-solid-svg-icons';

const CancelSubscriptionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading, 
  currentPlan, 
  subscriptionPlans 
}) => {
  const currentPlanData = subscriptionPlans.find(plan => plan.id === currentPlan);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-2xl mr-3" />
                <h2 className="text-xl font-bold text-white">Confirmer la résiliation</h2>
              </div>
              {!isLoading && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 font-semibold mb-2">Attention !</p>
              <p className="text-gray-300 text-sm">
                Votre abonnement sera immédiatement résilié et vous perdrez l'accès aux fonctionnalités plus ou premium.
              </p>
              <p className="text-gray-300 text-sm mt-2">
                Cette action est irréversible. Pour vous réabonner, vous devrez effectuer un nouveau paiement.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-white font-medium">
                Êtes-vous sûr de vouloir résilier votre abonnement{' '}
                <span className="text-[#90EE90]">{currentPlanData?.name}</span> ?
              </p>
              
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-sm text-gray-300 mb-2">Vous perdrez l'accès à :</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  {currentPlanData?.features.filter(feature => !feature.includes('Free')).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-[#90EE90] mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-[#90EE90]/10 border border-[#90EE90]/30 rounded-lg p-3">
                <p className="text-[#90EE90] text-sm font-medium mb-1">Changement d'abonnement ?</p>
                <p className="text-gray-300 text-sm">
                  Pour changer de plan, vous devez d'abord résilier votre abonnement actuel, 
                  puis souscrire au nouveau plan de votre choix.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                <span className="ml-3 text-gray-300">Résiliation en cours...</span>
              </div>
            ) : (
              <div className="flex gap-3">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-[#444] text-white py-2 rounded-lg font-semibold hover:bg-[#555] transition-colors"
                >
                  Annuler
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Résilier immédiatement
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CancelSubscriptionModal;
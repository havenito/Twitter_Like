"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faFlag, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import Notification from '../Notification';

const motifs = [
  "Harcèlement",
  "Incitation à la haine",
  "Spam",
  "Usurpation d'identité",
  "Contenu inapproprié",
  "Autre"
];

export default function Signalement({ isOpen, onClose, userId, postId, reportedUserId, commentId }) {
  const [motif, setMotif] = useState(motifs[0]);
  const [details, setDetails] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setMotif(motifs[0]);
    setDetails('');
    setShowDropdown(false);
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!details.trim()) {
      setError('Veuillez décrire le problème');
      return;
    }

    setLoading(true);
    setError('');

    const body = {
      user_id: userId,
      report_type: motif,
      content: details,
      ...(postId && { post_id: postId }),
      ...(reportedUserId && { reported_user_id: reportedUserId }),
      ...(commentId && { comment_id: commentId }),
    };
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/signalement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        resetForm();
        
        // Afficher la notification de succès
        setShowNotification(true);
        
        // Fermer le modal après un délai pour laisser le temps de voir la notification
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error('Erreur lors de l\'envoi du signalement');
      }
    } catch (error) {
      setError(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  // Variantes pour centrer parfaitement la notification
  const centeredNotificationVariants = {
    initial: { opacity: 0, x: -100, y: -50, scale: 0.3 },
    animate: { opacity: 1, x: -100, y: 0, scale: 1 },
    exit: { opacity: 0, x: -100, y: -20, scale: 0.5, transition: { duration: 0.4 } }
  };

  const maxChars = 500;
  const remainingChars = maxChars - details.length;

  return (
    <>
      {/* Notification */}
      {showNotification && (
        <Notification 
          message="Signalement envoyé !" 
          type="success" 
          onClose={() => setShowNotification(false)}
          variants={centeredNotificationVariants}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1b1b1b] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#333]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#333]">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FontAwesomeIcon icon={faFlag} className="mr-2 text-[#90EE90]" />
                  Signaler
                </h2>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <p className="text-gray-400 text-sm mb-6">
                  Merci de contribuer à la sécurité de la plateforme en signalant ce contenu inapproprié.
                </p>

                {/* Type de signalement */}
                <div>
                  <label className="block text-[#90EE90] text-sm font-medium mb-2">
                    <FontAwesomeIcon icon={faFlag} className="mr-2" />
                    Type de signalement
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-full bg-[#333] text-white border border-[#555] rounded-lg px-3 py-2 outline-none focus:border-[#90EE90] transition-colors flex justify-between items-center"
                    >
                      <span>{motif}</span>
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`h-4 w-4 text-[#90EE90] transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    
                    {showDropdown && (
                      <div className="absolute mt-1 w-full bg-[#333] border border-[#555] rounded-lg overflow-hidden shadow-lg z-10">
                        {motifs.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setMotif(m);
                              setShowDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left cursor-pointer transition-colors ${
                              motif === m 
                                ? 'bg-[#90EE90] bg-opacity-20 text-[#90EE90] font-medium' 
                                : 'text-gray-100 hover:bg-[#444] hover:text-white'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails */}
                <div className="relative">
                  <label className="block text-[#90EE90] text-sm font-medium mb-2">
                    Détails du signalement
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Expliquez le problème rencontré..."
                    className="w-full bg-[#333] text-white placeholder-gray-400 text-lg border border-[#555] rounded-lg px-3 py-3 outline-none focus:border-[#90EE90] transition-colors resize-none min-h-[120px]"
                    maxLength={maxChars}
                    required
                    disabled={loading}
                  />
                  <div className={`absolute bottom-2 right-2 text-sm ${
                    remainingChars < 50 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {remainingChars}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Footer avec boutons */}
                <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                  <p className="text-xs text-gray-500">
                    Votre signalement sera examiné par notre équipe de modération.
                  </p>

                  {/* Submit Button */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-6 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !details.trim() || remainingChars < 0}
                      className="bg-[#90EE90] text-black px-6 py-2 rounded-full font-semibold hover:bg-[#7CD37C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                          />
                          <span>Envoi...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faFlag} />
                          <span>Signaler</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
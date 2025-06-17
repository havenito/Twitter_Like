"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const PollVoteSection = ({ poll, onVoteSuccess, showResults }) => {
  const { data: session } = useSession();
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOption, setVotedOption] = useState(null);
  const [checkingVote, setCheckingVote] = useState(false);

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!session?.user?.id || !poll?.id) return;

      setCheckingVote(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/polls/${poll.id}/vote-status/${session.user.id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setHasVoted(data.has_voted);
          setVotedOption(data.voted_option);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de vote:', error);
      } finally {
        setCheckingVote(false);
      }
    };

    checkVoteStatus();
  }, [session?.user?.id, poll?.id]);

  const handleVote = async () => {
    if (selectedOption === null) {
      setError('Veuillez sélectionner une option');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/polls/${poll.id}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            option: selectedOption,
            user_id: session.user.id
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHasVoted(true);
        setVotedOption(selectedOption);
        if (onVoteSuccess) {
          onVoteSuccess(data.poll);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors du vote');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {checkingVote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-3 mb-6 text-blue-200 flex items-center text-sm"
        >
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          Vérification de votre statut de vote...
        </motion.div>
      )}

      <AnimatePresence>
        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30 rounded-lg p-4 mb-6 flex items-center"
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-3" />
            <div>
              <p className="font-semibold">
                {votedOption !== null ? 'Vous avez déjà voté pour ce sondage !' : 'Vote enregistré avec succès !'}
              </p>
              <p className="text-sm">
                {votedOption !== null && poll.options && poll.options[votedOption] 
                  ? `Votre choix : "${poll.options[votedOption]}"` 
                  : 'Merci pour votre participation.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3 mb-6 text-red-200 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-3 mb-6">
        {poll.options && poll.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isVotedOption = hasVoted && votedOption === index;

          return (
            <motion.div
              key={index}
              whileHover={{ scale: hasVoted || showResults ? 1 : 1.02 }}
              className={`relative rounded-lg p-4 transition-all duration-300 overflow-hidden ${
                isVotedOption
                  ? 'bg-[#90EE90] bg-opacity-10 text-[#90EE90] border border-[#90EE90] border-opacity-30 cursor-default'
                  : 'border border-[#555] hover:border-[#90EE90] hover:bg-[#333] cursor-pointer text-white'
              }`}
              onClick={() => !hasVoted && !showResults && setSelectedOption(index)}
            >
              {isVotedOption && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-lg bg-[#90EE90] bg-opacity-15"
                />
              )}

              <div className="relative flex items-center justify-between">
                <div className="flex items-center">
                  {!hasVoted && !showResults && (
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 transition-colors ${
                      isSelected ? 'border-[#90EE90] bg-[#90EE90]' : 'border-gray-400'
                    }`}>
                      {isSelected && (
                        <div className="w-full h-full rounded-full bg-[#90EE90] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-black" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isVotedOption && (
                    <FontAwesomeIcon 
                      icon={faCheckCircle} 
                      className="text-[#90EE90] mr-3" 
                    />
                  )}
                  
                  <span className="font-medium">
                    {option}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!hasVoted && !showResults && session?.user && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVote}
          disabled={loading || selectedOption === null || checkingVote}
          className="w-full bg-[#90EE90] text-black py-3 rounded-lg font-semibold hover:bg-[#7CD37C] focus:outline-none focus:ring-2 focus:ring-[#90EE90] focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Vote en cours...
            </>
          ) : checkingVote ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Vérification...
            </>
          ) : (
            'Voter'
          )}
        </motion.button>
      )}
    </div>
  );
};

export default PollVoteSection;
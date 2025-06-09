"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartBar, 
  faTrophy, 
  faVoteYea,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

const PollResults = ({ poll, showResults, totalVotes }) => {
  if (!poll || !poll.options) return null;

  const maxVotes = Math.max(...(poll.votes || []));
  const winningIndices = poll.votes ? poll.votes.map((votes, index) => votes === maxVotes ? index : -1).filter(i => i !== -1) : [];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333] sticky top-8">
      <div className="flex items-center mb-6">
        <FontAwesomeIcon icon={faChartBar} className="text-[#90EE90] text-xl mr-3" />
        <h3 className="text-xl font-semibold text-white">Résultats</h3>
      </div>

      <AnimatePresence mode="wait">
        {showResults ? (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <motion.div variants={itemVariants} className="bg-[#333] bg-opacity-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Total des votes</span>
                <span className="text-[#90EE90] font-bold text-lg">{totalVotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Options disponibles</span>
                <span className="text-white font-semibold">{poll.options.length}</span>
              </div>
            </motion.div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Classement :</h4>
              {poll.options
                .map((option, index) => ({
                  option,
                  index,
                  votes: poll.votes ? poll.votes[index] || 0 : 0,
                  percentage: totalVotes > 0 ? Math.round(((poll.votes ? poll.votes[index] || 0 : 0) / totalVotes) * 100) : 0
                }))
                .sort((a, b) => b.votes - a.votes)
                .map((item, rank) => (
                  <motion.div
                    key={item.index}
                    variants={itemVariants}
                    className={`p-3 rounded-lg border transition-all ${
                      winningIndices.includes(item.index)
                        ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                        : 'border-[#555] bg-[#333] bg-opacity-30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {rank === 0 && winningIndices.includes(item.index) && (
                          <FontAwesomeIcon 
                            icon={faTrophy} 
                            className="text-yellow-500 mr-2" 
                          />
                        )}
                        <span className={`font-medium ${
                          winningIndices.includes(item.index) ? 'text-yellow-300' : 'text-white'
                        }`}>
                          {item.option}
                        </span>
                      </div>
                      <span className={`text-sm ${
                        winningIndices.includes(item.index) ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        #{rank + 1}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400 flex items-center">
                        <FontAwesomeIcon icon={faVoteYea} className="mr-1" />
                        {item.votes} vote{item.votes !== 1 ? 's' : ''}
                      </div>
                      <div className={`font-bold ${
                        winningIndices.includes(item.index) ? 'text-yellow-400' : 'text-[#90EE90]'
                      }`}>
                        {item.percentage}%
                      </div>
                    </div>

                    <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8, delay: rank * 0.1 }}
                        className={`h-full rounded-full ${
                          winningIndices.includes(item.index) 
                            ? 'bg-yellow-500' 
                            : 'bg-[#90EE90]'
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
            </div>

            {winningIndices.length > 1 && (
              <motion.div
                variants={itemVariants}
                className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3"
              >
                <div className="flex items-center text-yellow-300 text-sm">
                  <FontAwesomeIcon icon={faTrophy} className="mr-2" />
                  Égalité entre {winningIndices.length} options !
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <FontAwesomeIcon icon={faEyeSlash} className="text-4xl text-gray-500 mb-4" />
            <p className="text-gray-400 mb-2">Résultats masqués</p>
            <p className="text-sm text-gray-500">
              Cliquez sur "Voir les résultats" pour afficher les statistiques
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PollResults;
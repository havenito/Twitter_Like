"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faVoteYea, faClock, faEye, faCheckCircle, faTag } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const PollCard = ({ poll, isAuthenticated }) => {
  const { data: session } = useSession();
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOption, setVotedOption] = useState(null);
  const [checkingVote, setCheckingVote] = useState(false);

  const totalVotes = poll.votes ? poll.votes.reduce((sum, count) => sum + count, 0) : 0;
  const optionsCount = poll.options ? poll.options.length : 0;

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!session?.user?.id || !poll.id) return;

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
  }, [session?.user?.id, poll.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-[#1e1e1e] p-6 rounded-lg border border-[#333] hover:border-[#90EE90] transition-all duration-200 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[#90EE90] bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <FontAwesomeIcon icon={faChartBar} className="text-[#90EE90]" />
          </div>
          <div className="text-sm text-gray-400">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            {formatDate(poll.date_created)}
          </div>
        </div>
        
        {isAuthenticated && hasVoted && !checkingVote && (
          <div className="flex items-center text-green-400 text-sm">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
            Voté
          </div>
        )}
        
        {checkingVote && (
          <div className="flex items-center text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent mr-1"></div>
            Vérification...
          </div>
        )}
      </div>

      <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-[#90EE90] transition-colors line-clamp-2">
        {poll.question}
      </h3>

      {poll.description && (
        <div className="mb-4">
          <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
            {poll.description}
          </p>
        </div>
      )}

      {poll.category && (
        <div className="mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30">
            <FontAwesomeIcon icon={faTag} className="mr-1 h-3 w-3" />
            {poll.category.name}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faVoteYea} className="mr-1" />
          <span>{optionsCount} option{optionsCount !== 1 ? 's' : ''}</span>
        </div>
        <div>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {poll.options && poll.options.slice(0, 2).map((option, index) => (
          <div 
            key={index} 
            className={`px-3 py-2 rounded text-sm truncate transition-colors ${
              hasVoted && votedOption === index 
                ? 'bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30' 
                : 'bg-[#333] bg-opacity-50 text-gray-300'
            }`}
          >
            {option}
            {hasVoted && votedOption === index && (
              <FontAwesomeIcon icon={faCheckCircle} className="ml-2 text-[#90EE90]" />
            )}
          </div>
        ))}
        {poll.options && poll.options.length > 2 && (
          <div className="text-xs text-gray-500 text-center">
            +{poll.options.length - 2} option{poll.options.length - 2 !== 1 ? 's' : ''} de plus
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[#333]">
        <Link href={`/polls/${poll.id}`}>
          <button className="w-full bg-[#90EE90] bg-opacity-10 text-[#90EE90] py-2 rounded-lg hover:bg-opacity-20 transition-colors text-sm font-medium flex items-center justify-center">
            <FontAwesomeIcon icon={faEye} className="mr-2" />
            Voir le sondage
          </button>
        </Link>
      </div>
    </motion.div>
  );
};

export default PollCard;
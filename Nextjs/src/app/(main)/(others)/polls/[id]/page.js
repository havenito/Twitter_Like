"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChartBar, faClock, faVoteYea, faUser, faEye, faEyeSlash, faSpinner, faExclamationTriangle, faAlignLeft, faTag } from '@fortawesome/free-solid-svg-icons';
import PollVoteSection from '@/components/Main/Poll/PollVoteSection';
import PollResults from '@/components/Main/Poll/PollResults';

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const pollId = params.id;

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return;

      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/polls/${pollId}`);
        
        if (!response.ok) {
          throw new Error('Sondage introuvable');
        }
        
        const data = await response.json();
        setPoll(data.poll);
        
        if (session?.user?.id) {
          const voteResponse = await fetch(
            `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/polls/${pollId}/vote-status/${session.user.id}`
          );
          
          if (voteResponse.ok) {
            const voteData = await voteResponse.json();
            setHasVoted(voteData.has_voted);
            if (voteData.has_voted) {
              setShowResults(true);
            }
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId, session?.user?.id]);

  const handleVoteSuccess = (updatedPoll) => {
    setPoll(updatedPoll);
    setHasVoted(true);
    setShowResults(true);
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] text-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 mb-8 border-b-4 border-[#90EE90]"></div>
          <p className="text-gray-300 text-lg">Chargement du sondage...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] text-white p-4">
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-red-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sondage introuvable</h1>
          <p className="text-gray-400 mb-6">{error || 'Le sondage demandé n\'existe pas ou a été supprimé.'}</p>
          <Link href="/polls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#90EE90] text-black px-6 py-3 rounded-full hover:bg-[#7CD37C] transition-colors font-semibold flex items-center mx-auto"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Retour aux sondages
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = poll.votes ? poll.votes.reduce((sum, count) => sum + count, 0) : 0;

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/polls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors mb-6"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Retour aux sondages
            </motion.button>
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-[#90EE90] bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <FontAwesomeIcon icon={faChartBar} className="text-[#90EE90] text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Détail du sondage</h1>
                <div className="flex items-center text-sm text-gray-400 mt-1">
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  Créé le {formatDate(poll.date_created)}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleResults}
              className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors ${
                showResults 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-[#90EE90] hover:bg-[#7CD37C] text-black'
              }`}
            >
              <FontAwesomeIcon 
                icon={showResults ? faEyeSlash : faEye} 
                className="mr-2" 
              />
              {showResults ? 'Masquer les résultats' : 'Voir les résultats'}
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333]"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4">{poll.question}</h2>
                
                {poll.description && (
                  <div className="mb-6 p-4 bg-[#333] bg-opacity-30 rounded-lg border-l-4 border-[#90EE90]">
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faAlignLeft} className="text-[#90EE90] mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-[#90EE90] font-medium mb-2">Description</h4>
                        <p className="text-gray-300 leading-relaxed">
                          {poll.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {poll.category && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30">
                      <FontAwesomeIcon icon={faTag} className="mr-2 h-3 w-3" />
                      {poll.category.name}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-400 space-x-4">
                  <span className="flex items-center">
                    <FontAwesomeIcon icon={faVoteYea} className="mr-1" />
                    {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center">
                    <FontAwesomeIcon icon={faUser} className="mr-1" />
                    {poll.options ? poll.options.length : 0} option{poll.options?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <PollVoteSection 
                poll={poll}
                onVoteSuccess={handleVoteSuccess}
                showResults={showResults}
              />
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PollResults 
                poll={poll}
                showResults={showResults}
                totalVotes={totalVotes}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
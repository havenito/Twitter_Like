import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faVoteYea, faClock, faTag, faEye, faEllipsis, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import DeletePollModal from '../Main/Poll/DeletePollModal';

const PollsList = ({ polls, isOwnProfile, userPseudo, onPollUpdate, onPollDelete }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pollToDelete, setPollToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!polls || polls.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-10 text-center text-gray-400"
      >
        <FontAwesomeIcon icon={faChartBar} className="text-3xl mb-3 text-gray-500" />
        <p className="text-lg">
          {isOwnProfile 
            ? "Vous n'avez encore créé aucun sondage." 
            : `@${userPseudo} n'a encore créé aucun sondage.`}
        </p>
        {isOwnProfile && (
          <Link href="/polls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 bg-[#90EE90] text-black px-6 py-2 rounded-full hover:bg-[#7CD37C] transition-colors font-semibold"
            >
              Créer un sondage
            </motion.button>
          </Link>
        )}
      </motion.div>
    );
  }

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

  const handleMenuToggle = (pollId) => {
    setOpenMenuId(openMenuId === pollId ? null : pollId);
  };

  const handleDeletePoll = (poll) => {
    setPollToDelete(poll);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const confirmDeletePoll = async () => {
    if (!pollToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/polls/${pollToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: pollToDelete.user_id
        }),
      });

      if (response.ok) {
        if (onPollDelete) {
          onPollDelete(pollToDelete.id);
        }
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la suppression:', errorData);
        alert('Erreur lors de la suppression du sondage');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du sondage');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteModalClose = () => {
    if (!deleteLoading) {
      setShowDeleteModal(false);
      setPollToDelete(null);
    }
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        className="space-y-4 sm:space-y-6"
      >
        {polls.map((poll) => {
          const totalVotes = poll.votes ? poll.votes.reduce((sum, count) => sum + count, 0) : 0;
          const optionsCount = poll.options ? poll.options.length : 0;

          return (
            <motion.div
              key={poll.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#1e1e1e] p-4 sm:p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-[#333] relative group"
            >
              {isOwnProfile && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleMenuToggle(poll.id)}
                    className="text-gray-400 hover:text-white transition-colors p-2 px-4 rounded-full hover:bg-[#333]"
                  >
                    <FontAwesomeIcon icon={faEllipsis} />
                  </button>
                  
                  <AnimatePresence>
                    {openMenuId === poll.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-lg z-10 min-w-[150px]"
                      >
                        <button
                          onClick={() => handleDeletePoll(poll)}
                          className="w-full text-left px-4 py-3 text-red-400 hover:bg-[#333] transition-colors flex items-center rounded-lg"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-3" />
                          Supprimer
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

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
              </div>

              <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-[#90EE90] transition-colors pr-10">
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

              <div className="mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {poll.options && poll.options.slice(0, 4).map((option, index) => (
                    <div 
                      key={index} 
                      className="px-3 py-2 bg-[#333] bg-opacity-50 text-gray-300 rounded text-sm truncate"
                    >
                      {option}
                    </div>
                  ))}
                </div>
                {poll.options && poll.options.length > 4 && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    +{poll.options.length - 4} option{poll.options.length - 4 !== 1 ? 's' : ''} de plus
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-[#333]">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faVoteYea} className="mr-1" />
                    <span>{optionsCount} option{optionsCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div>
                    {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <Link href={`/polls/${poll.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#90EE90] bg-opacity-10 text-[#90EE90] px-3 py-1 rounded-full hover:bg-opacity-20 transition-colors text-xs font-medium flex items-center"
                  >
                    <FontAwesomeIcon icon={faEye} className="mr-1" />
                    Voir le sondage
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {openMenuId && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setOpenMenuId(null)}
        />
      )}

      <DeletePollModal
        isOpen={showDeleteModal}
        onClose={handleDeleteModalClose}
        onConfirm={confirmDeletePoll}
        isLoading={deleteLoading}
        pollTitle={pollToDelete?.question}
      />
    </>
  );
};

export default PollsList;
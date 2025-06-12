"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faPlus, faSpinner, faExclamationTriangle, faFilter, faTag } from '@fortawesome/free-solid-svg-icons';
import PollCard from '@/components/Main/Poll/PollCard';
import CreatePollModal from '@/components/Main/Poll/CreatePollModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const PAGE_SIZE = 20;

export default function PollsPage() {
  const { data: session } = useSession();
  const [polls, setPolls] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(Array.isArray(data) ? data : data.categories || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };

    fetchCategories();
  }, []);

  const fetchPolls = useCallback(async (pageNum = 1, categoryId = '', append = false) => {
    try {
      if (!append) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      let url = `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/polls?page=${pageNum}&limit=${PAGE_SIZE}`;
      if (categoryId) {
        url = `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/polls/category/${categoryId}?page=${pageNum}&limit=${PAGE_SIZE}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des sondages');
      }
      
      const data = await response.json();
      
      if (append) {
        setPolls(prev => [...prev, ...(data.polls || [])]);
      } else {
        setPolls(data.polls || []);
      }
      
      setHasNext(data.has_next || false);
      setCurrentPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (hasNext && !loadingMore) {
      await fetchPolls(currentPage + 1, selectedCategory, true);
    }
  }, [hasNext, loadingMore, currentPage, selectedCategory, fetchPolls]);

  const [isFetching] = useInfiniteScroll(fetchMore);

  useEffect(() => {
    fetchPolls(1, selectedCategory, false);
  }, [selectedCategory, fetchPolls]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setPolls([]);
    setCurrentPage(1);
    setHasNext(true);
  };

  const handlePollCreated = (newPoll) => {
    setPolls(prev => [newPoll, ...prev]);
    setShowCreateModal(false);
  };

  const handlePollClick = (poll) => {
    setSelectedPoll(poll);
    setShowDetailModal(true);
  };

  const handleVoteSuccess = (updatedPoll) => {
    setPolls(prev => prev.map(poll => 
      poll.id === updatedPoll.id ? updatedPoll : poll
    ));
    setSelectedPoll(updatedPoll);
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
          <p className="text-gray-300 text-lg">Chargement des sondages...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] text-white p-4">
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-red-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erreur de chargement</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => fetchPolls(1, selectedCategory, false)}
            className="bg-[#90EE90] text-black px-6 py-3 rounded-full hover:bg-[#7CD37C] transition-colors font-semibold"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#90EE90] mb-2 flex items-center">
                <FontAwesomeIcon icon={faChartBar} className="mr-3" />
                Sondages
              </h1>
              <p className="text-gray-400">Participez aux sondages de la communauté</p>
            </div>
            
            {session?.user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="bg-[#90EE90] text-black px-6 py-3 rounded-full hover:bg-[#7CD37C] transition-colors font-semibold flex items-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Créer un sondage
              </motion.button>
            )}
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-[#222] border border-[#444] text-white rounded-full px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-[#90EE90] transition-all"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {polls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FontAwesomeIcon icon={faChartBar} size="3x" className="text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun sondage disponible</h2>
            <p className="text-gray-400">
              {session?.user 
                ? "Soyez le premier à créer un sondage !" 
                : "Connectez-vous pour participer aux sondages."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {polls.map((poll) => (
              <motion.div
                key={poll.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <PollCard 
                  poll={poll} 
                  onClick={() => handlePollClick(poll)}
                  isAuthenticated={!!session?.user}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#90EE90]"></div>
          </div>
        )}

        {!hasNext && polls.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">Vous avez vu tous les sondages disponibles !</p>
          </div>
        )}
      </div>

      <CreatePollModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPollCreated={handlePollCreated}
      />
    </div>
  );
}
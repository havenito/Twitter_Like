"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PostCard from '../../../../components/Main/Post/PostCard';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export default function ForYouPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fonction pour réorganiser les posts en ordre ligne par ligne
  const getReorderedPosts = () => {
    const cols = 3; 
    const reordered = [];
    
    // Regrouper par lignes de 3
    for (let i = 0; i < posts.length; i += cols) {
      const row = posts.slice(i, i + cols);
      
      // Distribuer chaque post de la ligne dans l'ordre des colonnes
      row.forEach((post, colIndex) => {
        const targetIndex = colIndex * Math.ceil(posts.length / cols) + Math.floor(i / cols);
        if (!reordered[targetIndex]) {
          reordered[targetIndex] = post;
        }
      });
    }
    
    return reordered.filter(post => post !== undefined);
  };

  const fetchPosts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/foryou?page=${page}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des posts');
      }
      
      const data = await response.json();
      
      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      
      setHasNext(data.hasNext);
      setCurrentPage(data.currentPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (hasNext && !loadingMore) {
      await fetchPosts(currentPage + 1, true);
    }
  }, [hasNext, loadingMore, currentPage, fetchPosts]);

  const [isFetching] = useInfiniteScroll(fetchMore);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] text-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex flex-col items-center text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 mb-8 border-b-4 border-[#90EE90]"></div>
          <p className="text-gray-300 text-lg sm:text-xl">Chargement de votre fil...</p>
          <p className="text-gray-500 text-sm mt-1">Découverte des dernières publications.</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#111]">
        <div className="text-center text-red-500">
          <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4" />
          <p className="text-xl">Erreur : {error}</p>
          <button 
            onClick={() => fetchPosts()}
            className="mt-4 bg-[#90EE90] text-black px-6 py-2 rounded-full hover:bg-[#7CD37C] transition-colors"
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
          <h1 className="text-3xl font-bold text-[#90EE90] mb-2">Pour vous</h1>
          <p className="text-gray-400">Découvrez les dernières publications</p>
        </motion.div>

        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400 text-lg">Aucun post à afficher pour le moment.</p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="columns-1 sm:columns-2 lg:columns-3 gap-6"
            style={{ columnFill: 'balance' }}
          >
            {getReorderedPosts().map((post) => (
              <motion.div
                key={post.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="break-inside-avoid mb-6 inline-block w-full"
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#90EE90]"></div>
          </div>
        )}

        {!hasNext && posts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">Vous avez vu tous les posts disponibles !</p>
          </div>
        )}
      </div>
    </div>
  );
}
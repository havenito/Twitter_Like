"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faStar, faExclamationTriangle, faLock } from '@fortawesome/free-solid-svg-icons';
import FavoritesList from '@/components/Profile/FavoritesList';

export default function FavoritesPage() {
  const params = useParams();
  const router = useRouter();
  const username = Array.isArray(params?.username) ? params.username[0] : params?.username;
  const { data: session } = useSession();
  
  const [favorites, setFavorites] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!username || !session?.user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/profile/${username}`
        );

        if (!profileResponse.ok) {
          throw new Error('Profil introuvable');
        }

        const profile = await profileResponse.json();
        setProfileData(profile);

        const isOwn = session?.user?.pseudo === username;
        setIsOwnProfile(isOwn);

        if (!isOwn) {
          setError('Accès refusé. Vous ne pouvez voir que vos propres favoris.');
          return;
        }

        // Récupérer les favoris uniquement pour le propriétaire
        const favoritesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}/favorites`
        );

        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          setFavorites(favoritesData.favorites || []);
        } else {
          throw new Error('Impossible de récupérer les favoris');
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, session]);

  const handleBackClick = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] text-white">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-6 sm:py-8">
            <div className="w-24 h-10 bg-[#333] rounded-full animate-pulse"></div>
            <div className="flex-1 text-center">
              <div className="h-8 bg-[#333] rounded-lg mx-auto mb-2 w-48 animate-pulse"></div>
              <div className="h-4 bg-[#333] rounded-lg mx-auto w-32 animate-pulse"></div>
            </div>
            <div className="w-24"></div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#1e1e1e] p-4 sm:p-6 rounded-xl border border-[#333] animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#333] rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-[#333] rounded w-3/4"></div>
                    <div className="h-4 bg-[#333] rounded w-1/2"></div>
                    <div className="h-20 bg-[#333] rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111] text-white">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 py-6 sm:py-8">
          <div className="flex items-center mb-8">
            <motion.button
              onClick={handleBackClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors mr-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Retour
            </motion.button>
            
            <h1 className="text-xl sm:text-2xl font-bold text-white">Favoris</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e1e1e] rounded-xl border border-[#333] p-8 sm:p-12 text-center"
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <FontAwesomeIcon 
                  icon={error.includes('Accès refusé') ? faLock : faExclamationTriangle} 
                  className="text-red-400 text-3xl"
                />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {error.includes('Accès refusé') ? 'Accès refusé' : 'Impossible d\'accéder aux favoris'}
                </h2>
                <p className="text-gray-400 text-sm sm:text-base max-w-md">
                  {error.includes('Accès refusé') 
                    ? 'Vous ne pouvez consulter que vos propres favoris. Cette fonctionnalité est privée.' 
                    : error
                  }
                </p>
              </div>

              <motion.button 
                onClick={() => router.push('/foryou')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#90EE90] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#7CD37C] transition-all flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Retour à l'accueil</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-6 sm:py-8 border-b border-[#333]"
        >
          <motion.button
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors text-sm sm:text-base"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            <span className="hidden sm:inline">Retour</span>
          </motion.button>
          
          <div className="flex-1 text-center">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#90EE90] flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faStar} className="mr-2 sm:mr-3" />
              Mes Favoris
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-xs sm:text-sm mt-1"
            >
              Vos posts favoris • Collection privée
            </motion.p>
          </div>
          
          <div className="w-[80px] sm:w-[120px]"></div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="py-4 sm:py-6"
        >
          <div className="bg-[#1e1e1e] rounded-xl p-4 sm:p-6 border border-[#333]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#90EE90] bg-opacity-20 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faStar} className="text-[#90EE90] text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm sm:text-base">Collection de favoris</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">Posts que vous avez sauvegardés</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-[#90EE90]">
                  {favorites.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  {favorites.length === 0 ? 'aucun favori' : favorites.length === 1 ? 'favori' : 'favoris'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pb-6 sm:pb-8"
        >
          <FavoritesList 
            favorites={favorites}
            isOwnProfile={true}
            userPseudo={username}
          />
        </motion.div>
      </div>
    </div>
  );
}
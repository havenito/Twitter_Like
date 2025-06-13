"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] text-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex flex-col items-center text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 mb-8 border-b-4 border-[#90EE90]"></div>
          <p className="text-gray-300 text-lg sm:text-xl">Chargement des favoris...</p>
          <p className="text-gray-500 text-sm mt-1">Récupération de vos posts favoris.</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] bg-[#111] text-white p-6 text-center">
        <FontAwesomeIcon 
          icon={error.includes('Accès refusé') ? faLock : faExclamationTriangle} 
          className={`${error.includes('Accès refusé') ? 'text-red-400' : 'text-red-400'} text-5xl mb-4`}
        />
        <p className="text-xl font-semibold mb-2">
          {error.includes('Accès refusé') ? 'Accès refusé' : 'Impossible d\'accéder aux favoris'}
        </p>
        <p className="text-gray-400 mb-6">
          {error.includes('Accès refusé') 
            ? 'Vous ne pouvez consulter que vos propres favoris.' 
            : error
          }
        </p>
        <button 
          onClick={() => router.push('/home')}
          className="bg-[#90EE90] text-black px-6 py-2 rounded-full font-semibold hover:bg-[#7CD37C] transition-all"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <motion.button
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Retour
          </motion.button>
          
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-[#90EE90] flex items-center justify-center">
              <FontAwesomeIcon icon={faStar} className="mr-2" />
              Mes Favoris
            </h1>
            <p className="text-gray-400 text-sm">
              Vos posts favoris privés
            </p>
          </div>
          
          <div className="w-[120px]"></div>
        </div>

        <FavoritesList 
          favorites={favorites}
          isOwnProfile={true}
          userPseudo={username}
        />
      </div>
    </div>
  );
}
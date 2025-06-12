"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faStar, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import FavoritesList from '@/components/Profile/FavoritesList';

export default function FavoritesPage() {
  const params = useParams();
  const username = Array.isArray(params?.username) ? params.username[0] : params?.username;
  const { data: session } = useSession();
  
  const [favorites, setFavorites] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!username || !session?.user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Récupérer les informations du profil
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

        // Vérifier si l'utilisateur connecté suit ce profil (si ce n'est pas son propre profil)
        let isUserFollowing = false;
        if (session?.user?.id && profile.id && !isOwn) {
          try {
            const followResponse = await fetch(
              `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}/follows/${profile.id}`
            );
            if (followResponse.ok) {
              const followData = await followResponse.json();
              isUserFollowing = followData.status;
              setIsFollowing(isUserFollowing);
            }
          } catch (followError) {
            console.error('Erreur lors de la vérification du statut de suivi:', followError);
          }
        }

        // Logique mise à jour : compte public OU propre profil OU on suit le compte privé
        const canViewFavorites = !profile.private || isOwn || isUserFollowing;

        if (!canViewFavorites) {
          setError('Ce compte est privé. Vous devez le suivre pour voir ses favoris.');
          return;
        }

        // Récupérer les favoris
        if (isOwn) {
          // Si c'est notre propre profil, utiliser notre ID
          const favoritesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}/favorites`
          );

          if (favoritesResponse.ok) {
            const favoritesData = await favoritesResponse.json();
            setFavorites(favoritesData.favorites || []);
          } else {
            throw new Error('Impossible de récupérer les favoris');
          }
        } else {
          // Pour les autres profils, on ne peut voir les favoris que s'ils sont publics ou si on les suit
          const favoritesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${profile.id}/favorites`
          );

          if (favoritesResponse.ok) {
            const favoritesData = await favoritesResponse.json();
            setFavorites(favoritesData.favorites || []);
          } else {
            throw new Error('Impossible de récupérer les favoris');
          }
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, session]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111] text-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 mb-8 border-b-4 border-[#90EE90]"></div>
          <p className="text-gray-300 text-lg">Chargement des favoris...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-red-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Impossible d'accéder aux favoris</h1>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-[#90EE90] flex items-center justify-center">
              <FontAwesomeIcon icon={faStar} className="mr-2" />
              Favoris
            </h1>
            <p className="text-gray-400 text-sm">
              {isOwnProfile 
                ? "Vos posts favoris" 
                : `Posts favoris de @${username}`}
            </p>
          </div>
        </div>

        <FavoritesList 
          favorites={favorites}
          isOwnProfile={isOwnProfile}
          userPseudo={username}
        />
      </div>
    </div>
  );
}
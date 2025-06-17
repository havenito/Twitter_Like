"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUsers, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import UserCard from '../../../../../components/Profile/UserCard';

export default function FollowersPage() {
  const params = useParams();
  const { data: session } = useSession();
  const username = Array.isArray(params?.username) ? params.username[0] : params?.username;

  const [followers, setFollowers] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Récupérer les infos du profil
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/profile/${username}`
        );
        
        if (!profileResponse.ok) {
          throw new Error('Utilisateur introuvable');
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
              // Seuls les suivis acceptés comptent
              isUserFollowing = followData.is_accepted || false;
              setIsFollowing(isUserFollowing);
            }
          } catch (followError) {
            console.error('Erreur lors de la vérification du statut de suivi:', followError);
          }
        }

        // Logique mise à jour : compte public OU propre profil OU on suit le compte privé (accepté)
        const canViewFollowers = !profile.private || isOwn || isUserFollowing;

        if (!canViewFollowers) {
          setError('Ce compte est privé. Vous devez le suivre pour voir ses abonnés.');
          return;
        }

        const followersResponse = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${profile.id}/followers`
        );

        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          setFollowers(followersData.followers || []);
        } else {
          throw new Error('Impossible de récupérer la liste des abonnés');
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
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90] mb-4"></div>
            <p className="text-xl">Chargement des abonnés...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href={`/${username}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center mb-6 px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Retour au profil
            </motion.button>
          </Link>

          <div className="text-center py-16">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="text-red-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Impossible d'accéder aux abonnés</h1>
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
          <Link href={`/${username}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Retour
            </motion.button>
          </Link>

          <div className="text-center">
            <h1 className="text-2xl font-bold flex items-center">
              <FontAwesomeIcon icon={faUsers} className="mr-3 text-[#90EE90]" />
              Abonnés
            </h1>
            <p className="text-gray-400 mt-1">
              {followers.length} abonné{followers.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="w-24"></div> {/* Spacer pour centrer le titre */}
        </div>

        {/* Liste des abonnés */}
        {followers.length === 0 ? (
          <div className="text-center py-16">
            <FontAwesomeIcon icon={faUsers} size="3x" className="text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun abonné</h2>
            <p className="text-gray-400">
              {isOwnProfile 
                ? "Vous n'avez pas encore d'abonnés." 
                : `@${username} n'a pas encore d'abonnés.`}
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-4"
          >
            {followers.map((follower) => (
              <UserCard key={follower.id} user={follower} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
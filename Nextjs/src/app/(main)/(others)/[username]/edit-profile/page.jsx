"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProfileForm from '@/components/Profile/ProfileForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faExclamationTriangle, faCheckCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

export default function UserEditProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { username } = useParams();

  const [pageError, setPageError] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [userData, setUserData] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    if (userData && session.user.id !== userData.id) {
      setPageError("Vous n'êtes pas autorisé·e à modifier ce profil.");
    }
  }, [status, session, userData]);

  useEffect(() => {
    if (status !== 'authenticated' || pageError) return;

    const fetchProfile = async () => {
      setLoadingData(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/profile/${username}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error("Impossible de charger votre profil.");
        const data = await res.json();
        setUserData({
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          pseudo: data.pseudo,
          biography: data.biography,
          isPrivate: data.private,
          profilePicture: data.profile_picture,
          banner: data.banner,
          updatedAt: data.updated_at
        });
      } catch (err) {
        setPageError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchProfile();
  }, [status, username, pageError]);

  const handleUpdate = async (formData) => {
    setOperationLoading(true);
    setFormError(null);
    setSuccessMessage('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${userData.id}`,
        { method: 'PUT', body: formData }
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'La mise à jour a échoué.');
      }
      
      // Mettre à jour la session avec les nouvelles informations utilisateur
      await updateSession({
        ...session.user,
        firstName: json.user.first_name,
        lastName: json.user.last_name,
        pseudo: json.user.pseudo,
        biography: json.user.biography,
        profilePicture: json.user.profile_picture,
        banner: json.user.banner,
        isPrivate: json.user.private
      });
      
      router.push(`/${json.user.pseudo}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] bg-[#111] text-white p-6 text-center">
        <FontAwesomeIcon icon={faLock} className="text-red-400 text-5xl mb-4" />
        <p className="text-xl font-semibold mb-2">{pageError}</p>
        <p className="text-gray-400 mb-6">Vous ne pouvez modifier que votre propre profil.</p>
        <button 
            onClick={() => router.push(session?.user?.pseudo ? `/${session.user.pseudo}` : '/home')}
            className="bg-[#90EE90] text-black px-6 py-2 rounded-full font-semibold hover:bg-[#7CD37C] transition-all"
        >
            {session?.user?.pseudo ? "Retourner à mon profil" : "Retourner à l'accueil"}
        </button>
      </div>
    );
  }

  if (loadingData || status === 'loading') {
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
          <p className="text-gray-300 text-lg sm:text-xl">Chargement des informations...</p>
          <p className="text-gray-500 text-sm mt-1">Préparation de votre profil en cours.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#111] text-white p-6">
      <Link href={`/${username}`} className="absolute top-6 left-4 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-4 py-2 bg-[#333] text-white rounded-full shadow-md hover:bg-[#444] transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
          Retour au profil
        </motion.button>
      </Link>
      <div className="mx-auto max-w-2xl bg-[#1b1b1b] p-8 rounded-xl shadow-lg mt-16">
        <h1 className="text-2xl mb-6">
          Modifier mon profil
        </h1>
        {formError && (
          <div className="mb-6 p-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-md text-sm flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" />
            {formError}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-3 bg-green-500/20 text-green-300 border border-green-500/50 rounded-md text-sm flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" />
            {successMessage}
          </div>
        )}
        {userData && (
          <ProfileForm
            key={userData.updatedAt || userData.id}
            initialData={userData}
            onSubmit={handleUpdate}
            loading={operationLoading}
          />
        )}
      </div>
    </div>
  );
}
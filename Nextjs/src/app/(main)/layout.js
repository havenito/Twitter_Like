"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { signOut } from 'next-auth/react';
import Header from '../../components/Main/Header/Header';
import Footer from '../../components/Footer';

export default function HomeLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userBanStatus, setUserBanStatus] = useState(null);
  const [checkingBan, setCheckingBan] = useState(true);

  // Vérifier le statut de bannissement
  useEffect(() => {
    const checkBanStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${session.user.id}/ban-status`);
          if (response.ok) {
            const banData = await response.json();
            setUserBanStatus(banData);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du bannissement:', error);
        }
      }
      setCheckingBan(false);
    };

    if (status === 'authenticated') {
      checkBanStatus();
    } else if (status === 'unauthenticated') {
      setCheckingBan(false);
    }
  }, [session?.user?.id, status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      console.group('🔍 INFORMATIONS UTILISATEUR CONNECTÉ');
      console.log('📧 Email:', session.user.email);
      console.log('👤 ID:', session.user.id);
      console.log('🏷️ Pseudo:', session.user.pseudo);
      console.log('👨‍💼 Prénom:', session.user.firstName);
      console.log('👨‍💼 Nom:', session.user.lastName);
      console.log('🖼️ Photo de profil:', session.user.profilePicture);
      console.log('🔒 Compte privé:', session.user.isPrivate);
      console.log('📝 Biographie:', session.user.biography);
      console.log('🎨 Bannière:', session.user.banner);
      console.log('💎 Abonnement:', session.user.subscription);
      console.log('⚡ Rôles:', session.user.roles);
      console.log('📱 Session complète:', session);
      console.groupEnd();
    } else if (status === 'loading') {
      console.log('⏳ Session en cours de chargement...');
    } else {
      console.log('❌ Aucun utilisateur connecté');
    }
  }, [session, status]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const formatBanDuration = (banUntil) => {
    if (!banUntil) return 'permanent';
    
    const banDate = new Date(banUntil);
    const now = new Date();
    
    if (banDate <= now) return 'expiré';
    
    const diffMs = banDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 jour';
    if (diffDays < 30) return `${diffDays} jours`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} mois`;
    return `${Math.ceil(diffDays / 365)} an(s)`;
  };

  if (status === 'loading' || checkingBan) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90EE90] mb-4 mx-auto"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && userBanStatus?.is_banned) {
    const banDuration = formatBanDuration(userBanStatus.ban_until);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900/20 to-[#121212] text-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center bg-[#1e1e1e] p-8 rounded-2xl border border-red-500/30 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 mx-auto mb-6 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center"
          >
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              className="text-4xl text-red-400" 
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-red-400 mb-4"
          >
            Compte Suspendu
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <p className="text-gray-300 mb-4 leading-relaxed">
              Votre compte a été suspendu suite à une violation des conditions d'utilisation de Minouverse.
            </p>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Durée de la suspension :</span>
                <span className="font-semibold text-red-400">
                  {banDuration === 'permanent' ? 'Permanente' : banDuration}
                </span>
              </div>
              
              {userBanStatus.ban_until && banDuration !== 'expiré' && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-red-500/20">
                  <span className="text-sm text-gray-400">Fin de suspension :</span>
                  <span className="text-sm text-gray-300">
                    {new Date(userBanStatus.ban_until).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
            
            {userBanStatus.warn_count > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Avertissements reçus :</span>
                  <span className="font-semibold text-orange-400">
                    {userBanStatus.warn_count}/3
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Se déconnecter</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white flex flex-col">
        <Header />
        <main className="flex flex-1 pt-14 md:pt-[76px]"> 
          {children} 
        </main>
        <Footer />
      </div>
    );
  }

  return null; 
}
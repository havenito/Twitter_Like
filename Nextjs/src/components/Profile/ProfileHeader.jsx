import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPen, faCalendarAlt, faLock, faGlobe, faUsers, faUserPlus, faUserMinus, faTrash, faEllipsis, faFlag, faClock } from '@fortawesome/free-solid-svg-icons';
import { useSession, signOut } from 'next-auth/react';
import UnfollowPrivateConfirmModal from './UnfollowPrivateConfirmModal';
import DeleteAccountModal from './DeleteAccountModal';
import Signalement from '../Signalement/Signalement';

const ProfileHeader = ({ profileData, isOwnProfile, isFollowing, setIsFollowing }) => {
  const { data: session } = useSession();
  const [followLoading, setFollowLoading] = useState(false);
  const [followStatus, setFollowStatus] = useState(null);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const formattedDate = profileData.joinDate 
    ? new Date(profileData.joinDate).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric'
      })
    : 'Date inconnue';

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return num.toString();
  };

  const renderSubscriptionBadge = (user) => {
    const subscription = user?.subscription || 'free';
    
    if (subscription === 'plus') {
      return (
        <div className="inline-flex items-center ml-3">
          <Image
            src="/plusbadge.png"
            alt="Badge Plus"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    } else if (subscription === 'premium') {
      return (
        <div className="inline-flex items-center ml-3">
          <Image
            src="/premiumbadge.png"
            alt="Badge Premium"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
        </div>
      );
    }
    
    return null;
  };

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user?.id || !profileData?.id || isOwnProfile) {
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}/follows/${profileData.id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status) {
            setFollowStatus(data.follow_status);
            setIsFollowing(data.is_accepted);
          } else {
            setFollowStatus(null);
            setIsFollowing(false);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de suivi:', error);
      }
    };

    checkFollowStatus();
  }, [session?.user?.id, profileData?.id, isOwnProfile, setIsFollowing]);

  const handleFollowToggle = async () => {
    if (!session?.user?.id || !profileData?.id || followLoading) return;
    
    if (followStatus === 'pending') {
      // Si en attente, on peut annuler la demande
      await performUnfollow();
    } else if (isFollowing && !profileData.isPublic) {
      setShowUnfollowModal(true);
      return;
    } else if (isFollowing) {
      // Pour les comptes publics, unfollow direct
      await performUnfollow();
    } else {
      // Si on ne suit pas, envoyer une demande de suivi
      await performFollow();
    }
  };

  const performFollow = async () => {
    setFollowLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/follows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          follower_id: session.user.id,
          followed_id: profileData.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFollowStatus(data.follow.status);
        
        if (data.follow.status === 'accepted') {
          setIsFollowing(true);
        } else if (data.follow.status === 'pending') {
          setIsFollowing(false);
        }
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la demande de suivi:', errorData.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur lors de la demande de suivi:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const performUnfollow = async () => {
    setFollowLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/follows`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          follower_id: session.user.id,
          followed_id: profileData.id,
        }),
      });

      if (response.ok) {
        setIsFollowing(false);
        setFollowStatus(null);
        setShowUnfollowModal(false);
      } else {
        const errorData = await response.json();
        console.error('Erreur lors du désabonnement:', errorData.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollowConfirm = async () => {
    await performUnfollow();
  };

  const handleUnfollowCancel = () => {
    setShowUnfollowModal(false);
  };

  const handleMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
    setShowProfileMenu(false);
  };

  const confirmDeleteAccount = async () => {
    if (!session?.user?.id) return;
    
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la suppression du compte:', errorData.error || 'Erreur inconnue');
        alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteModal(false);
  };

  const getFollowButtonContent = () => {
    if (followLoading) {
      return {
        icon: faClock,
        text: 'Chargement...',
        className: 'bg-[#222222] text-white'
      };
    }

    if (followStatus === 'pending') {
      return {
        icon: faClock,
        text: 'En attente',
        className: 'bg-yellow-600 hover:bg-yellow-700 text-white'
      };
    }

    if (isFollowing) {
      return {
        icon: faUserMinus,
        text: 'Se désabonner',
        className: 'bg-[#222222] text-white hover:bg-red-600 hover:text-white'
      };
    }

    return {
      icon: faUserPlus,
      text: 'Suivre',
      className: 'bg-[#90EE90] text-black hover:bg-[#7CD37C]'
    };
  };

  const isUserOwnProfile = isOwnProfile || 
    (session?.user?.id && profileData?.id && session.user.id === profileData.id) ||
    (session?.user?.pseudo && profileData?.pseudo && session.user.pseudo === profileData.pseudo) ||
    (session?.user?.email && profileData?.email && session.user.email === profileData.email);

  return (
    <>
      <div className="relative text-white">
        <div className="h-48 sm:h-64 bg-gray-800 overflow-hidden relative">
          {profileData.bannerImage ? (
            <Image
              src={profileData.bannerImage}
              alt={`Bannière de ${profileData.pseudo}`}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div className="w-full h-full bg-[#DBDBDB]"></div>
          )}
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-16 sm:-mt-20">
            <motion.div 
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-[#111] overflow-hidden bg-gray-700 flex items-center justify-center">
                <Image
                  src={profileData.profilePicture || '/defaultuserpfp.png'}
                  alt={`Photo de profil de ${profileData.pseudo}`}
                  width={160}
                  height={160}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  priority
                />
              </div>
            </motion.div>
            
            <motion.div 
              className="mt-4 sm:mt-0 flex flex-col items-end gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {isUserOwnProfile ? (
                <div className="flex gap-3 relative">
                  <Link href={`/${profileData.pseudo}/edit-profile`}>
                    <motion.button
                      whileHover={{ scale: 1.05, backgroundColor: '#7CD37C' }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#90EE90] text-black px-4 py-2 rounded-full font-semibold text-sm flex items-center"
                    >
                      <FontAwesomeIcon icon={faUserPen} className="mr-2" />
                      Modifier le profil
                    </motion.button>
                  </Link>
                  
                  <div className="relative">
                    <motion.button
                      onClick={handleMenuToggle}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#333] text-white px-4 py-3 rounded-full font-semibold text-sm flex items-center hover:bg-[#444] transition-colors"
                    >
                      <FontAwesomeIcon icon={faEllipsis} />
                    </motion.button>
                    
                    <AnimatePresence>
                      {showProfileMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full mt-2 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-lg z-10 min-w-[180px]"
                        >
                          <button
                            onClick={handleDeleteAccount}
                            className="w-full text-left px-4 py-3 text-red-400 hover:bg-[#333] transition-colors flex items-center rounded-lg"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-3" />
                            Supprimer le compte
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : session?.user && (
                <div className="flex gap-3 items-center">
                  <motion.button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    whileHover={{ scale: followLoading ? 1 : 1.05 }}
                    whileTap={{ scale: followLoading ? 1 : 0.95 }}
                    className={`px-6 py-2 rounded-full font-semibold text-sm flex items-center transition-all duration-200 min-w-[140px] justify-center ${getFollowButtonContent().className} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {followLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Chargement...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon 
                          icon={getFollowButtonContent().icon} 
                          className="mr-2" 
                        />
                        {getFollowButtonContent().text}
                      </>
                    )}
                  </motion.button>
                  <div className="relative">
                    <motion.button
                      onClick={handleMenuToggle}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#333] text-white px-4 py-3 rounded-full font-semibold text-sm flex items-center hover:bg-[#444] transition-colors"
                    >
                      <FontAwesomeIcon icon={faEllipsis} />
                    </motion.button>
                    <AnimatePresence>
                      {showProfileMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full mt-2 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-lg z-10 min-w-[180px]"
                        >
                          <button
                            onClick={() => {
                              setShowReportModal(true);
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-4 py-3 text-red-400 hover:bg-[#333] transition-colors flex items-center rounded-lg"
                          >
                            <FontAwesomeIcon icon={faFlag} className="mr-3" />
                            Signaler cet utilisateur
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {profileData.firstName || profileData.pseudo} {profileData.lastName}
              </h1>
              {renderSubscriptionBadge(profileData)}
            </div>
            <p className="text-gray-400 text-sm sm:text-base">@{profileData.pseudo}</p>
            
            {profileData.bio && (
              <p className="mt-3 text-gray-300 max-w-xl text-sm sm:text-base leading-relaxed">
                {profileData.bio}
              </p>
            )}
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-gray-400 items-center">
              <span className="flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />
                A rejoint en {formattedDate}
              </span>
              <span className="flex items-center" title={profileData.isPublic ? 'Compte public' : 'Compte privé'}>
                <FontAwesomeIcon icon={profileData.isPublic ? faGlobe : faLock} className="mr-1.5" />
                {profileData.isPublic ? 'Public' : 'Privé'}
              </span>
            </div>
            
            <motion.div 
              className="flex gap-2 mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Link 
                href={`/${profileData.pseudo}/following`} 
                className="group hover:bg-[#1a1a1a] rounded-lg px-3 py-2 transition-all duration-200"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center text-sm sm:text-base"
                >
                  <FontAwesomeIcon 
                    icon={faUserPlus} 
                    className="mr-2 text-[#90EE90] group-hover:text-[#7CD37C]" 
                  />
                  <span className="font-bold text-white group-hover:text-[#90EE90]">
                    {formatNumber(profileData.following)}
                  </span>
                  <span className="text-gray-400 ml-1 group-hover:text-gray-300">
                    abonnements
                  </span>
                </motion.div>
              </Link>
              
              <Link 
                href={`/${profileData.pseudo}/followers`} 
                className="group hover:bg-[#1a1a1a] rounded-lg px-3 py-2 transition-all duration-200"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center text-sm sm:text-base"
                >
                  <FontAwesomeIcon 
                    icon={faUsers} 
                    className="mr-2 text-[#90EE90] group-hover:text-[#7CD37C]" 
                  />
                  <span className="font-bold text-white group-hover:text-[#90EE90]">
                    {formatNumber(profileData.followers)}
                  </span>
                  <span className="text-gray-400 ml-1 group-hover:text-gray-300">
                    abonnés
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowProfileMenu(false)}
        />
      )}

      <UnfollowPrivateConfirmModal
        isOpen={showUnfollowModal}
        onClose={handleUnfollowCancel}
        onConfirm={handleUnfollowConfirm}
        isLoading={followLoading}
        userName={profileData.pseudo}
        isPrivateAccount={!profileData.isPublic}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteAccount}
        onConfirm={confirmDeleteAccount}
        isLoading={deleteLoading}
        userEmail={session?.user?.email || ''}
      />
      
      <Signalement
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        userId={session?.user?.id}
        reportedUserId={profileData?.id}
      />
    </>
  );
};

export default ProfileHeader;
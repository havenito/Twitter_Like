"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignature, faAlignLeft, faCamera, faImage, faGlobe, faLock as faLockSolid, faSpinner, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

const ProfileForm = ({ initialData, onSubmit, loading, error: submissionError, successMessage: submissionSuccess }) => {
  const { data: session } = useSession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [biography, setBiography] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const profilePictureInputRef = useRef(null);
  const [deleteProfilePicture, setDeleteProfilePicture] = useState(false);

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const bannerInputRef = useRef(null);
  const [deleteBanner, setDeleteBanner] = useState(false);

  const [profilePictureError, setProfilePictureError] = useState('');
  const [bannerError, setBannerError] = useState('');

  // Vérifier si l'utilisateur a un abonnement premium/plus
  const userSubscription = session?.user?.subscription || 'free';
  const hasGifAccess = userSubscription === 'plus' || userSubscription === 'premium';

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPseudo(initialData.pseudo || '');
      setBiography(initialData.biography || '');
      setIsPublic(!initialData.isPrivate);
      
      if (initialData.profilePicture) {
        setProfilePicturePreview(initialData.profilePicture);
      }
      
      if (initialData.banner) {
        setBannerPreview(initialData.banner);
      }
    }
  }, [initialData]);

  const validateFileType = (file, type) => {
    const isGif = file.type === 'image/gif';
    const isValidImage = file.type.startsWith('image/');

    if (!isValidImage) {
      return `Seuls les fichiers image sont autorisés pour ${type === 'profile' ? 'la photo de profil' : 'la bannière'}.`;
    }

    if (isGif && !hasGifAccess) {
      return `Les GIFs ne sont disponibles que pour les abonnements Plus et Premium. ${type === 'profile' ? 'Votre photo de profil' : 'Votre bannière'} doit être une image statique.`;
    }

    return null;
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validationError = validateFileType(file, 'profile');
      if (validationError) {
        setProfilePictureError(validationError);
        if (profilePictureInputRef.current) {
          profilePictureInputRef.current.value = '';
        }
        return;
      }

      setProfilePictureError('');
      setProfilePictureFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setDeleteProfilePicture(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setDeleteProfilePicture(true);
    setProfilePictureError('');
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.value = "";
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validationError = validateFileType(file, 'banner');
      if (validationError) {
        setBannerError(validationError);
        if (bannerInputRef.current) {
          bannerInputRef.current.value = '';
        }
        return;
      }

      setBannerError('');
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setDeleteBanner(false);
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null); 
    setDeleteBanner(true);
    setBannerError('');
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (profilePictureError || bannerError) {
      return;
    }

    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('pseudo', pseudo);
    formData.append('biography', biography);
    formData.append('isPublic', isPublic.toString());

    if (deleteProfilePicture) {
      formData.append('delete_profile_picture', 'true');
    } else if (profilePictureFile) {
      formData.append('profile_picture', profilePictureFile);
    }

    if (deleteBanner) {
      formData.append('delete_banner_image', 'true');
    } else if (bannerFile) {
      formData.append('banner_image', bannerFile);
    }
    
    onSubmit(formData);
  };

  const fieldVariant = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  const getAcceptedFileTypes = () => {
    if (hasGifAccess) {
      return "image/*";
    }
    return "image/jpeg,image/jpg,image/png,image/webp";
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 }}}}
    >
      {!hasGifAccess && (
        <motion.div 
          variants={fieldVariant} 
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-blue-300 font-medium text-sm mb-1">Photos animées (GIF)</h4>
              <p className="text-blue-200 text-xs leading-relaxed">
                Les GIFs pour les photos de profil et bannières sont réservés aux abonnements Plus et Premium. 
                Vous pouvez utiliser des images statiques (JPEG, PNG, WebP).
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={fieldVariant} className="flex flex-col items-center space-y-3">
        <label className="block text-sm font-medium text-[#90EE90] self-start mb-1">Photo de profil</label>
        <div 
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[#555555] cursor-pointer hover:border-[#90EE90] transition-colors flex items-center justify-center bg-[#444444]"
            onClick={() => !deleteProfilePicture && profilePictureInputRef.current?.click()}
            title="Cliquer pour changer la photo de profil"
        >
          {profilePicturePreview && !deleteProfilePicture ? (
            <Image src={profilePicturePreview} alt="Aperçu photo de profil" layout="fill" objectFit="cover" />
          ) : (
            <FontAwesomeIcon icon={faCamera} className="text-gray-400 text-3xl" />
          )}
        </div>
        <input
          type="file"
          accept={getAcceptedFileTypes()}
          ref={profilePictureInputRef}
          onChange={handleProfilePictureChange}
          className="hidden"
        />
        <div className="flex space-x-4 items-center">
            <button 
                type="button" 
                onClick={() => profilePictureInputRef.current?.click()}
                className="text-sm text-[#90EE90] hover:underline"
            >
                {profilePicturePreview && !deleteProfilePicture ? "Changer la photo" : "Ajouter une photo"}
            </button>
            {profilePicturePreview && !deleteProfilePicture && (
                <button
                    type="button"
                    onClick={handleRemoveProfilePicture}
                    className="text-sm text-red-400 hover:text-red-300 hover:underline flex items-center"
                    title="Supprimer la photo de profil"
                >
                    <FontAwesomeIcon icon={faTrashAlt} className="mr-1 h-3 w-3" />
                    Supprimer
                </button>
            )}
        </div>
        {profilePictureError && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs mt-1 text-center"
          >
            {profilePictureError}
          </motion.p>
        )}
        {hasGifAccess && (
          <p className="text-green-400 text-xs text-center">
            ✨ GIFs autorisés avec votre abonnement {userSubscription === 'premium' ? 'Premium' : 'Plus'}
          </p>
        )}
      </motion.div>

      <motion.div variants={fieldVariant} className="space-y-2">
        <label className="block text-sm font-medium text-[#90EE90] mb-1">Bannière du profil</label>
        <div 
            className="relative w-full h-36 sm:h-40 rounded-lg overflow-hidden border-2 border-[#555555] cursor-pointer hover:border-[#90EE90] transition-colors flex items-center justify-center bg-[#444444]/70"
            onClick={() => !deleteBanner && bannerInputRef.current?.click()}
            title="Cliquer pour changer la bannière"
        >
          {bannerPreview && !deleteBanner ? (
            <Image src={bannerPreview} alt="Aperçu bannière" layout="fill" objectFit="cover" />
          ) : (
            <div className="text-center text-gray-400">
              <FontAwesomeIcon icon={faImage} className="text-3xl mb-1" />
              <p className="text-xs">Cliquer pour ajouter une bannière</p>
            </div>
          )}
        </div>
        <input
          type="file"
          accept={getAcceptedFileTypes()}
          ref={bannerInputRef}
          onChange={handleBannerChange}
          className="hidden"
        />
        <div className="flex space-x-4 items-center mt-1">
            <button 
                type="button" 
                onClick={() => bannerInputRef.current?.click()}
                className="text-sm text-[#90EE90] hover:underline"
            >
                {bannerPreview && !deleteBanner ? "Changer la bannière" : "Ajouter une bannière"}
            </button>
            {bannerPreview && !deleteBanner && (
                 <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="text-sm text-red-400 hover:text-red-300 hover:underline flex items-center"
                    title="Supprimer la bannière"
                >
                    <FontAwesomeIcon icon={faTrashAlt} className="mr-1 h-3 w-3" />
                    Supprimer
                </button>
            )}
        </div>
        {bannerError && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-xs mt-1"
          >
            {bannerError}
          </motion.p>
        )}
        {hasGifAccess && (
          <p className="text-green-400 text-xs">
            ✨ GIFs autorisés avec votre abonnement {userSubscription === 'premium' ? 'Premium' : 'Plus'}
          </p>
        )}
      </motion.div>

      <motion.div variants={fieldVariant} className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-[#90EE90]">
            Prénom
          </label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FontAwesomeIcon icon={faSignature} />
            </span>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
              className="w-full pl-10 pr-3 py-2 bg-[#444] text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#90EE90] focus:border-[#90EE90]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-[#90EE90]">
            Nom <span className="text-gray-400 text-xs">(Facultatif)</span>
          </label>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FontAwesomeIcon icon={faSignature} />
            </span>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom"
              className="w-full pl-10 pr-3 py-2 bg-[#444] text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#90EE90] focus:border-[#90EE90]"
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={fieldVariant}>
        <label htmlFor="pseudo" className="block text-sm font-medium text-[#90EE90]">
          Pseudo
        </label>
        <div className="mt-1 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <FontAwesomeIcon icon={faUser} />
          </span>
          <input
            id="pseudo"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Votre pseudo unique"
            className="w-full pl-10 pr-3 py-2 bg-[#444] text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#90EE90] focus:border-[#90EE90]"
            required
          />
        </div>
      </motion.div>

      <motion.div variants={fieldVariant}>
        <label htmlFor="biography" className="block text-sm font-medium text-[#90EE90]">
          Biographie <span className="text-gray-400 text-xs">(Max. 255 caractères)</span>
        </label>
        <div className="mt-1 relative">
           <span className="absolute left-3 top-3 text-gray-400">
            <FontAwesomeIcon icon={faAlignLeft} />
          </span>
          <textarea
            id="biography"
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            rows="3"
            maxLength="255"
            placeholder="Parlez un peu de vous..."
            className="w-full pl-10 pr-3 py-2 bg-[#444] text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#90EE90] focus:border-[#90EE90]"
          />
        </div>
         <p className="text-xs text-gray-400 mt-1 text-right">{biography.length}/255</p>
      </motion.div>

      <motion.div variants={fieldVariant}>
        <label className="block text-sm font-medium text-[#90EE90] mb-2">
          Confidentialité du compte
        </label>
        <div className="flex items-center justify-between bg-[#444] px-4 py-3 rounded-md border border-gray-600">
          <div className="flex items-center">
            <span className="mr-3 text-gray-400">
              <FontAwesomeIcon icon={isPublic ? faGlobe : faLockSolid} />
            </span>
            <span className="text-white">
              {isPublic ? 'Compte public' : 'Compte privé'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isPublic ? 'bg-[#90EE90]' : 'bg-gray-500'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {isPublic
            ? 'Tout le monde peut voir votre profil et vos publications.'
            : 'Seuls les abonnés que vous approuvez peuvent voir votre profil et vos publications.'}
        </p>
      </motion.div>

      <motion.div variants={fieldVariant} className="pt-4">
        <button
          type="submit"
          disabled={loading || profilePictureError || bannerError}
          className="w-full flex items-center justify-center px-4 py-2.5 bg-[#90EE90] text-black font-semibold rounded-full hover:bg-[#7CD37C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1b1b1b] focus:ring-[#90EE90] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </button>
      </motion.div>
    </motion.form>
  );
};

export default ProfileForm;
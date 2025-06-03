"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignature, faAlignLeft, faCamera, faImage, faGlobe, faLock as faLockSolid, faSpinner, faTrashAlt } from '@fortawesome/free-solid-svg-icons'; // Added faTrashAlt
import { motion } from 'framer-motion';

const ProfileForm = ({ initialData, onSubmit, loading, error: submissionError, successMessage: submissionSuccess }) => {
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

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setPseudo(initialData.pseudo || '');
      setBiography(initialData.biography || '');
      setIsPublic(initialData.isPrivate !== undefined ? !initialData.isPrivate : true);
      setProfilePicturePreview(initialData.profilePicture || null);
      setBannerPreview(initialData.banner || null);
      setDeleteProfilePicture(false);
      setDeleteBanner(false); 
    }
  }, [initialData]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setDeleteProfilePicture(false); // If a new file is chosen, we are not deleting
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null); // Or set to a default placeholder if you have one
    setDeleteProfilePicture(true);
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.value = ""; // Clear the file input
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setDeleteBanner(false); // If a new file is chosen, we are not deleting
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null); // Or set to a default placeholder
    setDeleteBanner(true);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = ""; // Clear the file input
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 }}}}
    >
      {/* Profile Picture */}
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
          accept="image/*"
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
      </motion.div>

      {/* Banner Image */}
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
          accept="image/*"
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
      </motion.div>

      {/* First Name and Last Name - Side by side */}
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

      {/* Pseudo */}
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

      {/* Biography */}
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

      {/* Account Privacy */}
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
          disabled={loading}
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
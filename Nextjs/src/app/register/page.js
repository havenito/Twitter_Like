"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEnvelope, faSignature, faCamera, faGlobe, faLock as faLockSolid, faEye, faEyeSlash, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import Notification from '../../components/Notification';
import { motion } from 'framer-motion';
import { useSession } from "next-auth/react";

// Pseudos réservés
const RESERVED_PSEUDOS = [
  'login', 'register', 'comment', 'edit-profile', 'favorites', 'followers', 
  'following', 'post', 'reply', 'foryou', 'message', 'home', 'polls', 
  'search', 'premium', 'api', 'auth', 'forgot-password', 'reset-password', 
  'notifications', 'admin', 'user', 'reports', 'dashboard', 'settings',
  'profile', 'about', 'help', 'support', 'contact', 'terms', 'privacy',
  'www', 'mail', 'email', 'ftp', 'blog', 'news', 'static', 'assets',
  'css', 'js', 'img', 'images', 'upload', 'download', 'test', 'demo'
];

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [pseudo, setUsername] = useState('');
  const [pseudoError, setPseudoError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [profile_picture, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const fileInputRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  const validatePseudo = (pseudoValue) => {
    if (!pseudoValue) {
      return "Le pseudo est requis.";
    }
    
    if (pseudoValue.length < 3) {
      return "Le pseudo doit contenir au moins 3 caractères.";
    }
    
    if (pseudoValue.length > 30) {
      return "Le pseudo ne peut pas dépasser 30 caractères.";
    }
    
    if (!/^[a-zA-Z0-9_.-]+$/.test(pseudoValue)) {
      return "Le pseudo ne peut contenir que des lettres, chiffres, points, tirets et underscores.";
    }
    
    if (pseudoValue.startsWith('.') || pseudoValue.startsWith('-') || pseudoValue.startsWith('_') ||
        pseudoValue.endsWith('.') || pseudoValue.endsWith('-') || pseudoValue.endsWith('_')) {
      return "Le pseudo ne peut pas commencer ou finir par un point, tiret ou underscore.";
    }
    
    if (RESERVED_PSEUDOS.includes(pseudoValue.toLowerCase())) {
      return `Le pseudo "${pseudoValue}" est réservé et ne peut pas être utilisé.`;
    }
    
    return null;
  };

  const validateImageFile = (file) => {
    if (!file) return null;
    
    // Vérifier que c'est bien un fichier image
    if (!file.type.startsWith('image/')) {
      return "Le fichier doit être une image.";
    }
    
    // Vérifier si c'est un GIF (interdit pour les comptes gratuits)
    if (file.type === 'image/gif') {
      return "Les GIFs ne sont disponibles que pour les abonnements Plus et Premium. Votre photo de profil doit être une image statique (JPEG, PNG, WebP).";
    }
    
    // Types d'images autorisés pour les comptes gratuits
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return "Format non supporté. Formats autorisés: JPEG, PNG, WebP. Les GIFs sont réservés aux abonnements Plus et Premium.";
    }
    
    return null;
  };

  const handlePseudoChange = (e) => {
    const newPseudo = e.target.value;
    setUsername(newPseudo);
    
    const error = validatePseudo(newPseudo);
    setPseudoError(error);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setImageError(validationError);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setProfileImage(null);
        setPreviewImage(null);
        return;
      }

      setImageError('');
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => { 
    setShowConfirmPassword(!showConfirmPassword);
  };

  const checkMinLength = (pass) => pass.length >= 8;
  const checkHasUppercase = (pass) => /[A-Z]/.test(pass);
  const checkHasNumber = (pass) => /\d/.test(pass);
  const checkHasSpecialChar = (pass) => /[!@#$%^&*(),.?":{}|<>_-]/.test(pass);

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordCriteria({
      minLength: checkMinLength(newPassword),
      hasUppercase: checkHasUppercase(newPassword),
      hasNumber: checkHasNumber(newPassword),
      hasSpecialChar: checkHasSpecialChar(newPassword),
    });
  };

  const validatePassword = (password) => {
    if (!checkMinLength(password)) {
      return "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (!checkHasUppercase(password)) {
      return "Le mot de passe doit contenir au moins une lettre majuscule.";
    }
    if (!checkHasNumber(password)) {
      return "Le mot de passe doit contenir au moins un chiffre.";
    }
    if (!checkHasSpecialChar(password)) {
      return "Le mot de passe doit contenir au moins un caractère spécial.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!firstName || !email || !pseudo || !password || !confirmPassword) { 
      setError('Veuillez remplir tous les champs obligatoires (Prénom, Email, Pseudo, Mot de passe).');
      setLoading(false);
      return;
    }

    const pseudoValidationError = validatePseudo(pseudo);
    if (pseudoValidationError) {
      setError(pseudoValidationError);
      setLoading(false);
      return;
    }

    if (profile_picture) {
      const imageValidationError = validateImageFile(profile_picture);
      if (imageValidationError) {
        setError(imageValidationError);
        setLoading(false);
        return;
      }
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('pseudo', pseudo);
      formData.append('password', password);
      
      // Utiliser l'image de profil par défaut si aucune n'est sélectionnée
      if (profile_picture) {
        formData.append('profile_picture', profile_picture);
        formData.append('useDefaultImage', 'false');
      } else {
        formData.append('useDefaultImage', 'true');
      }
      
      formData.append('isPublic', isPublic.toString());
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Échec de l\'inscription');
      }
      
      setShowNotification(true);
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      setError(error.message || 'Échec de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const centeredNotificationVariants = {
    initial: { opacity: 0, x:-285, y: -50, scale: 0.3 }, 
    animate: { opacity: 1, x:-285, y: 0, scale: 1 },    
    exit: { opacity: 0, x:-285, y: -20, scale: 0.5, transition: { duration: 0.4 } }
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 50
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -50,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  };

  const formFields = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fieldVariant = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#222222]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90EE90] mb-4 mx-auto"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#222222]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90EE90] mb-4 mx-auto"></div>
          <p className="text-gray-400">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#222222] py-12 px-4">
      {showNotification && (
        <Notification 
          message="Création du compte réussie! Redirection vers la page de connexion..." 
          type="success" 
          onClose={() => setShowNotification(false)}
          variants={centeredNotificationVariants} 
        />
      )}
      
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="w-full max-w-md bg-[#333333] p-8 rounded-lg shadow-lg"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <Link href="/">
            <Image 
              src="/minouverselogo.png" 
              alt="Minouverse Logo" 
              width={80} 
              height={80} 
              className="object-contain"
            />
          </Link>
        </motion.div>
        
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold text-center text-[#90EE90] mb-6"
        >
          Inscription à Minouverse
        </motion.h1>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4"
          >
            {error}
          </motion.div>
        )}
        
        <motion.form 
          variants={formFields}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          <motion.div 
            variants={fieldVariant}
            className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4"
          >
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-blue-200 text-xs leading-relaxed">
                  Les GIFs pour les photos de profil sont réservés aux abonnements Plus et Premium. 
                  Vous pouvez utiliser des images statiques (JPEG, PNG, WebP).
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={fieldVariant}
            className="flex flex-col items-center mb-4"
          >
            <div 
              className="w-24 h-24 rounded-full bg-[#444444] mb-2 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-[#90EE90] hover:opacity-80 transition-opacity"
              onClick={() => fileInputRef.current.click()}
            >
              {previewImage ? (
                <Image 
                  src={previewImage} 
                  alt="Preview" 
                  width={96} 
                  height={96} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <FontAwesomeIcon icon={faCamera} className="text-[#90EE90] text-2xl" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="text-[#90EE90] text-sm hover:underline"
            >
              {previewImage ? "Changer de photo" : "Ajouter une photo de profil"}
            </button>
            <p className="text-gray-400 text-xs mt-1 text-center">
              {!previewImage ? "Facultatif - Une photo par défaut sera utilisée si aucune photo n'est choisie" : ""}
            </p>
            {imageError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs mt-1 text-center"
              >
                {imageError}
              </motion.p>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
          </motion.div>
          
          <motion.div 
            variants={fieldVariant}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label htmlFor="firstName" className="block text-[#90EE90] mb-1">
                Prénom
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FontAwesomeIcon icon={faSignature} />
                </span>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom"
                  className="w-full pl-10 pr-3 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-[#90EE90] mb-1">
                Nom <span className="text-gray-400 text-xs">(Facultatif)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FontAwesomeIcon icon={faSignature} />
                </span>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom"
                  className="w-full pl-10 pr-3 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                />
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={fieldVariant}>
            <label htmlFor="email" className="block text-[#90EE90] mb-1">
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse email"
                className="w-full pl-10 pr-3 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
            </div>
          </motion.div>
          
          <motion.div variants={fieldVariant}>
            <label htmlFor="pseudo" className="block text-[#90EE90] mb-1">
              Pseudo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                id="pseudo"
                type="text"
                value={pseudo}
                onChange={handlePseudoChange}
                placeholder="Choisissez un pseudo unique"
                className={`w-full pl-10 pr-3 py-2 bg-[#444444] text-white rounded border ${
                  pseudoError ? 'border-red-500' : 'border-[#555555]'
                } focus:outline-none focus:ring-2 ${
                  pseudoError ? 'focus:ring-red-500' : 'focus:ring-[#90EE90]'
                }`}
                required
              />
            </div>
            {pseudoError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs mt-1"
              >
                {pseudoError}
              </motion.p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              3-30 caractères, lettres, chiffres, points, tirets et underscores autorisés
            </p>
          </motion.div>
          
          <motion.div variants={fieldVariant}>
            <label htmlFor="password" className="block text-[#90EE90] mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange} 
                placeholder="Créez un mot de passe"
                className="w-full pl-10 pr-10 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#90EE90] focus:outline-none"
                onClick={toggleShowPassword}
                tabIndex="-1" 
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <div className="mt-2 space-y-1 pt-1 text-xs">
              <p className={`flex items-center ${passwordCriteria.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={passwordCriteria.minLength ? faCheckCircle : faTimesCircle} className="mr-2" />
                Au moins 8 caractères.
              </p>
              <p className={`flex items-center ${passwordCriteria.hasUppercase ? 'text-green-400' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={passwordCriteria.hasUppercase ? faCheckCircle : faTimesCircle} className="mr-2" />
                Au moins une lettre majuscule (A-Z).
              </p>
              <p className={`flex items-center ${passwordCriteria.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={passwordCriteria.hasNumber ? faCheckCircle : faTimesCircle} className="mr-2" />
                Au moins un chiffre (0-9).
              </p>
              <p className={`flex items-center ${passwordCriteria.hasSpecialChar ? 'text-green-400' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={passwordCriteria.hasSpecialChar ? faCheckCircle : faTimesCircle} className="mr-2" />
                Au moins un caractère spécial (!@#$...).
              </p>
            </div>
          </motion.div>

          <motion.div variants={fieldVariant}>
            <label htmlFor="confirmPassword" className="block text-[#90EE90] mb-1">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                className="w-full pl-10 pr-10 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#90EE90] focus:outline-none"
                onClick={toggleShowConfirmPassword}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </motion.div>
          
          <motion.div variants={fieldVariant} className="pt-2">
            <label className="block text-[#90EE90] mb-3">
              Confidentialité du compte
            </label>
            <div className="flex items-center justify-between bg-[#444444] px-4 py-3 rounded border border-[#555555]">
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
                  isPublic ? 'bg-[#90EE90]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-1 ml-1">
              {isPublic 
                ? 'Tout le monde peut voir votre profil et vos publications.'
                : 'Seuls vos abonnés peuvent voir votre profil et vos publications.'}
            </p>
          </motion.div>
          
          <motion.button
            variants={fieldVariant}
            type="submit"
            disabled={loading || pseudoError || imageError}
            className="w-full px-4 py-2 bg-[#90EE90] text-black font-medium rounded-full hover:bg-[#7CD37C] transition-colors disabled:opacity-50 mt-4"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </motion.button>
        </motion.form>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-[#90EE90] hover:underline">
              Se connecter
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
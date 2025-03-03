"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEnvelope, faSignature, faCamera, faGlobe, faLock as faLockSolid, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Notification from '../components/Notification';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const fileInputRef = useRef(null);

  const router = useRouter();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!firstName || !lastName || !email || !username || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      setLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);
      
      if (profileImage) {
        formData.append('profileImage', profileImage);
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
      
      // Afficher la notification de succès
      setShowNotification(true);
      
      // Redirection vers la page de connexion après un court délai
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      setError(error.message || 'Échec de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#222222] py-12">
      {showNotification && (
        <Notification 
          message="Création du compte réussie! Redirection vers la page de connexion..." 
          type="success" 
          onClose={() => setShowNotification(false)}
        />
      )}
      
      <div className="w-full max-w-md bg-[#333333] p-8 rounded-lg shadow-lg">
        <div className="flex justify-center mb-6">
          <Image 
            src="/minouverselogo.png" 
            alt="Minouverse Logo" 
            width={80} 
            height={80} 
            className="object-contain"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-[#90EE90] mb-6">
          Inscription à Minouverse
        </h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div 
              className="w-24 h-24 rounded-full bg-[#444444] mb-2 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-[#90EE90] hover:opacity-80 transition-opacity"
              onClick={() => fileInputRef.current.click()}
            >
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
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
            <p className="text-gray-400 text-xs mt-1">
              {!previewImage ? "Facultatif - Une photo par défaut sera utilisée si aucune photo n'est choisie" : ""}
            </p>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                Nom
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
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
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
          </div>
          
          <div>
            <label htmlFor="username" className="block text-[#90EE90] mb-1">
              Pseudo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choisissez un pseudo unique"
                className="w-full pl-10 pr-3 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
            </div>
          </div>
          
          <div>
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
                onChange={(e) => setPassword(e.target.value)}
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
          </div>
          
          <div className="pt-2">
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
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#90EE90] text-black font-medium rounded-full hover:bg-[#7CD37C] transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-[#90EE90] hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
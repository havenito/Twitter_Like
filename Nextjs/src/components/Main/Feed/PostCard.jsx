"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faHeart, faImage } from '@fortawesome/free-regular-svg-icons';
import { faVideo, faTag, faFlag } from '@fortawesome/free-solid-svg-icons';
import ReportModal from '../../Signalement/Signalements'; 

const PostCard = ({ post }) => {
  const [imageError, setImageError] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const renderMedia = () => {
    // Plus de logique complexe ! Seulement post.media
    const allMedia = Array.isArray(post.media) ? post.media : [];
    
    if (allMedia.length === 0) return null;

    // Un seul média ?
    if (allMedia.length === 1) {
      const media = allMedia[0];
      const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
      return media.type === 'video'
        ? <video controls src={src} className="w-full rounded-lg max-h-96 object-cover" />
        : <img src={src} alt="" className="w-full rounded-lg max-h-96 object-cover" />;
    }

    // Plusieurs médias → grille
    const cols = allMedia.length === 2 ? 'grid-cols-2' : 
                 allMedia.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
    
    return (
      <div className={`mt-3 grid ${cols} gap-2`}>
        {allMedia.slice(0,4).map((media, i) => {
          const src = media.url.startsWith('http') ? media.url : `/${media.url}`;
          const isVideo = media.type === 'video';
          return (
            <div key={media.id||i} className="relative rounded-lg overflow-hidden">
              {isVideo
                ? <video controls src={src} className="w-full h-32 object-cover" />
                : <img src={src} alt="" className="w-full h-32 object-cover" />
              }
              {allMedia.length > 4 && i === 3 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white font-semibold">+{allMedia.length-3}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Fonction pour afficher la photo de profil avec gestion d'erreur
  const renderProfilePicture = () => {
    const profilePicture = post.user?.profilePicture;
    
    // Si pas de photo ou erreur de chargement, afficher l'image par défaut
    if (!profilePicture || imageError) {
      return (
        <Image
          src="/defaultuserpfp.png"
          alt={`Photo de profil par défaut de ${post.user?.pseudo || 'Utilisateur'}`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
        />
      );
    }

    // Vérifier si l'URL est valide pour Next.js Image
    const isValidImageUrl = profilePicture.startsWith('https://res.cloudinary.com') || 
                           profilePicture.startsWith('https://lh3.googleusercontent.com') ||
                           profilePicture.startsWith('https://avatars.githubusercontent.com') ||
                           profilePicture.startsWith('/');

    if (isValidImageUrl) {
      return (
        <Image
          src={profilePicture}
          alt={`Photo de profil de ${post.user?.pseudo || 'Utilisateur'}`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
          onError={() => setImageError(true)}
          unoptimized={!profilePicture.startsWith('/')} // Désactiver l'optimisation pour les URLs externes non configurées
        />
      );
    } else {
      // Utiliser une balise img normale pour les URLs non configurées
      return (
        <img
          src={profilePicture}
          alt={`Photo de profil de ${post.user?.pseudo || 'Utilisateur'}`}
          className="w-12 h-12 rounded-full object-cover border-2 border-[#333]"
          onError={() => setImageError(true)}
        />
      );
    }
  };

  // Fonction pour déterminer le nom d'affichage
  const getDisplayName = () => {
    if (!post.user) return 'Utilisateur introuvable';
    
    const { firstName, lastName, pseudo } = post.user;
    
    // Si on a firstName et lastName, les afficher ensemble
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // Si on a seulement firstName, l'afficher
    if (firstName) {
      return firstName;
    }
    
    // Sinon, afficher le pseudo
    return pseudo || 'Utilisateur introuvable';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1e1e1e] p-4 sm:p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-[#333]"
    >
      {/* Header avec photo de profil et pseudo */}
      <div className="flex items-center mb-4">
        {/* Photo de profil */}
        <div className="flex-shrink-0 mr-3">
          {post.user?.pseudo ? (
            <Link href={`/${post.user.pseudo}`} className="block">
              {renderProfilePicture()}
            </Link>
          ) : (
            renderProfilePicture()
          )}
        </div>
        
        {/* Informations utilisateur */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {post.user?.pseudo ? (
              <Link 
                href={`/${post.user.pseudo}`} 
                className="text-white font-medium hover:text-[#90EE90] transition-colors truncate"
              >
                {getDisplayName()}
              </Link>
            ) : (
              <span className="text-gray-400 font-medium">Utilisateur introuvable</span>
            )}
            
            {post.user?.pseudo && (
              <Link 
                href={`/${post.user.pseudo}`}
                className="text-gray-500 text-sm hover:text-[#90EE90] transition-colors"
              >
                @{post.user.pseudo}
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">
              {formatDate(post.publishedAt)}
            </span>
            
            {/* Badge de catégorie */}
            {post.category?.name && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-30">
                <FontAwesomeIcon icon={faTag} className="mr-1 h-3 w-3" />
                {post.category.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Titre du post s'il existe */}
      {post.title && (
        <h3 className="text-white font-semibold text-lg mb-2">{post.title}</h3>
      )}
      
      {/* Contenu du post */}
      <p className="text-white whitespace-pre-wrap leading-relaxed mb-3">{post.content}</p>
      
      {/* Médias du post */}
      {renderMedia()}
      
      {/* Footer avec interactions */}
      <div className="text-xs text-gray-500 mt-4 flex justify-between items-center pt-3 border-t border-[#333]">
        <div className="flex items-center space-x-4">
          <button className="hover:text-[#90EE90] transition-colors flex items-center">
            <FontAwesomeIcon icon={faComment} className="mr-1" /> 
            <span>{post.comments || 0}</span>
          </button>
          <button className="hover:text-red-500 transition-colors flex items-center">
            <FontAwesomeIcon icon={faHeart} className="mr-1" /> 
            <span>{post.likes || 0}</span>
          </button>
          {(post.media && post.media.length > 0) || post.mediaUrl ? (
            <span className="text-gray-600 flex items-center">
              <FontAwesomeIcon icon={faImage} className="mr-1" />
              <span>{post.media ? post.media.length : 1}</span>
            </span>
          ) : null}
          {/* Bouton signaler */}
          <button
            className="hover:text-orange-400 transition-colors flex items-center"
            onClick={() => setShowReport(true)}
            title="Signaler ce post"
          >
            <FontAwesomeIcon icon={faFlag} className="mr-1" />
            <span>Signaler</span>
          </button>
        </div>
        
        {/* Description de la catégorie au survol */}
        {post.category?.description && (
          <div className="hidden sm:block">
            <span 
              className="text-gray-600 text-xs italic"
              title={post.category.description}
            >
              {post.category.description.length > 30 
                ? `${post.category.description.substring(0, 30)}...`
                : post.category.description
              }
            </span>
          </div>
        )}
      </div>
      {/* Modal de signalement */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        userId={post.user?.id}
        postId={post.id}
      />
    </motion.div>
  );
};

export default PostCard;
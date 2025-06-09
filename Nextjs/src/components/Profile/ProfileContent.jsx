import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PostsList from './PostsList';
import MediaGrid from './MediaGrid';
import LikesList from './LikesList';
import FavoritesList from './FavoritesList';
import PollsList from './PollsList';

const ProfileContent = ({ profileData, isOwnProfile }) => {
  const [activeTab, setActiveTab] = useState('posts');
  
  // Si le profil est privé et que ce n'est pas le nôtre, le contenu principal de la page
  // gère déjà cela. Ce composant ne sera pas rendu ou sera rendu avec des données limitées.
  // On peut donc supposer ici que si ce composant est affiché, l'accès est autorisé.

  const tabs = [
    { id: 'posts', label: 'Publications' },
    { id: 'media', label: 'Média' },
    { id: 'likes', label: 'J\'aime' },
    { id: 'favorite', label: 'Favoris'},
    { id: 'polls', label: 'Sondages'}
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
      <div className="border-b border-gray-700">
        <nav className="flex space-x-1 sm:space-x-2 -mb-px" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative whitespace-nowrap px-3 py-3 sm:px-4 font-medium text-sm sm:text-base rounded-t-md focus:outline-none transition-colors duration-200
                ${activeTab === tab.id 
                  ? 'text-[#90EE90]' 
                  : 'text-gray-400 hover:text-gray-200 hover:border-gray-500'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeProfileTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#90EE90]" 
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="py-6">
        {activeTab === 'posts' && <PostsList posts={profileData.posts || []} isOwnProfile={isOwnProfile} userPseudo={profileData.pseudo} />}
        {activeTab === 'media' && <MediaGrid posts={profileData.posts} userPseudo={profileData.pseudo} isOwnProfile={isOwnProfile} />}
        {activeTab === 'likes' && <LikesList likes={profileData.likes} userPseudo={profileData.pseudo} isOwnProfile={isOwnProfile} />}
        {activeTab === 'favorite' && <FavoritesList favorites={profileData.favorites} userPseudo={profileData.pseudo} isOwnProfile={isOwnProfile} />}
        {activeTab === 'polls' && <PollsList polls={profileData.polls || []} userPseudo={profileData.pseudo} isOwnProfile={isOwnProfile} />}
      </div>
    </div>
  );
};

export default ProfileContent;
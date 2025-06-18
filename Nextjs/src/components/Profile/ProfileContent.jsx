import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PostsList from './PostsList';
import MediaGrid from './MediaGrid';
import LikesList from './LikesList';
import PollsList from './PollsList';
import CommentsRepliesList from './CommentsRepliesList';

const ProfileContent = ({ profileData, isOwnProfile }) => {
  const [activeTab, setActiveTab] = useState('posts');
  
  // Si le profil est privé et que ce n'est pas le nôtre, le contenu principal de la pagegère déjà cela. Ce composant ne sera pas rendu ou sera rendu avec des données limitées.

  const tabs = [
    { id: 'posts', label: 'Publications', shortLabel: 'Posts' },
    { id: 'media', label: 'Média', shortLabel: 'Média' },
    { id: 'likes', label: 'J\'aime', shortLabel: 'Likes' },
    { id: 'comments', label: 'Commentaires & Réponses', shortLabel: 'Comm.' },
    { id: 'polls', label: 'Sondages', shortLabel: 'Sondages'}
  ];

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 mt-4 sm:mt-6 lg:mt-8">
      <div className="border-b border-gray-700">
        <nav className="flex space-x-1 sm:space-x-2 -mb-px overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3 lg:px-4 font-medium text-xs sm:text-sm lg:text-base rounded-t-md focus:outline-none transition-colors duration-200 flex-shrink-0
                ${activeTab === tab.id 
                  ? 'text-[#90EE90]' 
                  : 'text-gray-400 hover:text-gray-200 hover:border-gray-500'
                }`}
            >
              <span className="block sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:block">{tab.label}</span>
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
      
      <div className="py-3 sm:py-4 lg:py-6">
        {activeTab === 'posts' && <PostsList posts={profileData.posts || []} isOwnProfile={isOwnProfile} userPseudo={profileData.pseudo} />}
        {activeTab === 'media' && <MediaGrid posts={profileData.posts} userPseudo={profileData.pseudo} isOwnProfile={isOwnProfile} />}
        {activeTab === 'likes' && <LikesList likes={profileData.likes} userPseudo={profileData.pseudo} isOwnProfile={isOwnProfile} />}
        {activeTab === 'comments' && <CommentsRepliesList commentsAndReplies={profileData.commentsAndReplies || []} userPseudo={profileData.pseudo} isOwnProfile={isOwnProfile} />}
        {activeTab === 'polls' && <PollsList polls={profileData.polls || []} userPseudo={profileData.pseudo} isOwnProfile={isOwnProfile} />}
      </div>
    </div>
  );
};

export default ProfileContent;
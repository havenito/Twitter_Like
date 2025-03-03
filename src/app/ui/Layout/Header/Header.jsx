"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Header = () => {
  const [activeTab, setActiveTab] = useState('pour-vous');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('userToken');
      setIsAuthenticated(!!token);
    };
    
    checkAuthStatus();
  }, []);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      localStorage.removeItem('userToken');
      setIsAuthenticated(false);
      router.push('/login');
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="fixed top-0 ml-64 w-[calc(100%-16rem)] bg-[#333333] h-16 border-b border-black z-20 flex items-center">
      <div className="flex justify-between items-center w-full px-8">
        <div className="flex-1 flex justify-end">
          <button 
            onClick={() => setActiveTab('pour-vous')}
            className={`px-8 py-2 mr-8 text-lg font-medium text-[#90EE90] transition-all ${
              activeTab === 'pour-vous' 
                ? 'border-b-4 border-[#90EE90]' 
                : 'hover:text-white'
            }`}
          >
            Pour Vous
          </button>
        </div>
        
        <div className="flex justify-center mx-4">
          <Image 
            src="/minouverselogo.png" 
            alt="Minouverse Logo" 
            width={50} 
            height={50} 
            className="object-contain"
          />
        </div>
        
        <div className="flex-1 flex items-center">
          <button 
            onClick={() => setActiveTab('abonnements')}
            className={`px-8 py-2 ml-8 text-lg font-medium text-[#90EE90] transition-all ${
              activeTab === 'abonnements' 
                ? 'border-b-4 border-[#90EE90]' 
                : 'hover:text-white'
            }`}
          >
            Abonnements
          </button>
          
          <button 
            onClick={handleAuthClick}
            className="ml-auto px-6 py-2 rounded-full bg-[#90EE90] text-black font-medium transition-all duration-500 hover:bg-[#7796B6]/20 hover:text-white"
          >
            {isAuthenticated ? 'Se déconnecter' : 'Se connecter'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
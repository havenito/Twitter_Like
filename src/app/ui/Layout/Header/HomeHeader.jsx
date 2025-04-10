"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown } from "@fortawesome/free-solid-svg-icons";

const HomeHeader = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('userToken');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("Erreur lors de l'accès au localStorage:", error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between px-8 py-6 bg-[#1b1b1b] border-b border-[#333] z-20">
      {/* Section centrale - Logo uniquement */}
      <div className="flex items-center justify-center">
        <Link href="/">
          <Image src="/minouverselogo.png" alt="Logo" width={60} height={60} className="rounded-full" />
        </Link>
      </div>
      
      {/* Section droite - Authentification */}
      <div className="flex gap-4">
        {isAuthenticated ? (
          <>
            <Link href="/home">
              <button className="bg-[#333] text-gray-300 px-5 py-2 rounded-full hover:bg-[#444] hover:text-white transition-all duration-300">
                Mon fil
              </button>
            </Link>
            <button 
              onClick={handleLogout}
              className="bg-[#90EE90] text-black px-5 py-2 rounded-full hover:bg-[#7CD37C] transition-all duration-300"
            >
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            <Link href="/register">
              <button className="bg-[#333] text-gray-300 px-5 py-2 rounded-full hover:bg-[#444] hover:text-white transition-all duration-300">
                Inscription
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-[#90EE90] text-black px-5 py-2 rounded-full hover:bg-[#7CD37C] transition-all duration-300">
                Connexion
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default HomeHeader;
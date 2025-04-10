"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('userToken');
      setIsAuthenticated(!!token);
    };
    
    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsAuthenticated(false);
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-6 bg-[#1b1b1b] border-b border-[#333] z-20">
      {/* Section gauche - Avantages */}
      <div className="flex items-center">
        <Link href="/advantages">
          <button
            className={`text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 ${
              pathname === "/advantages"
                ? "text-[#90EE90] bg-[#333] shadow-md"
                : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
            }`}
          >
            <FontAwesomeIcon icon={faCrown} className="mr-2" />
            Avantages
          </button>
        </Link>
      </div>
      
      {/* Section centrale - Pour vous + Logo + Abonnements */}
      <div className="flex items-center justify-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
        <Link href="/foryou">
          <button
            className={`text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 ${
              pathname === "/foryou"
                ? "text-[#90EE90] bg-[#333] shadow-md"
                : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
            }`}
          >
            Pour Vous
          </button>
        </Link>
        
        <Image src="/minouverselogo.png" alt="Logo" width={50} height={50} className="rounded-full mx-4" />
        
        <Link href="/subscriptions">
          <button
            className={`text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 ${
              pathname === "/subscriptions"
                ? "text-[#90EE90] bg-[#333] shadow-md"
                : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
            }`}
          >
            Abonnements
          </button>
        </Link>
      </div>
      
      {/* Section droite - Authentification */}
      <div className="flex gap-4">
        {isAuthenticated ? (
          <button 
            onClick={handleLogout}
            className="bg-[#90EE90] text-black px-5 py-2 rounded-full hover:bg-[#7CD37C] transition-all duration-300"
          >
            Se déconnecter
          </button>
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

export default Header;
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faBars, faTimes, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from '../../ConfirmModal'; 
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogoutClick = () => {
    setShowConfirmModal(true); 
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true); 
    
    try {
      await signOut({ callbackUrl: '/', redirect: true }); 
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
    finally {
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems = [
    { href: "/foryou", label: "Pour Vous" },
    { href: "/following", label: "Abonnements" }
  ];

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const isAuthenticated = status === 'authenticated';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-[#1b1b1b] border-b border-[#333] z-20">
        <div className="hidden md:flex items-center justify-between px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link href="/premium">
              <button
                className={`text-sm font-semibold px-4 lg:px-5 py-2 rounded-full transition-all duration-300 ${
                  pathname === "/premium"
                    ? "text-[#90EE90] bg-[#333] shadow-md"
                    : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
                }`}
              >
                <FontAwesomeIcon icon={faCrown} className="mr-2" />
                <span className="hidden lg:inline">Avantages</span>
                <span className="lg:hidden">Premium</span>
              </button>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link href="/foryou">
              <button
                className={`text-sm font-semibold px-3 lg:px-5 py-2 rounded-full transition-all duration-300 ${
                  pathname === "/foryou"
                    ? "text-[#90EE90] bg-[#333] shadow-md"
                    : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
                }`}
              >
                Pour Vous
              </button>
            </Link>
            
            <Link href={"/home"}>
              <Image 
                src="/minouverselogo.png" 
                alt="Logo" 
                width={45} 
                height={45} 
                className="rounded-full mx-2 lg:mx-4 hover:scale-105 transition-transform duration-200" 
              />
            </Link>
            
            <Link href="/following">
              <button
                className={`text-sm font-semibold px-3 lg:px-5 py-2 rounded-full transition-all duration-300 ${
                  pathname === "/following"
                    ? "text-[#90EE90] bg-[#333] shadow-md"
                    : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
                }`}
              >
                <span className="hidden lg:inline">Abonnements</span>
                <span className="lg:hidden">Suivis</span>
              </button>
            </Link>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handleLogoutClick} 
              className="bg-[#90EE90] text-black px-4 lg:px-5 py-2 rounded-full hover:bg-[#7CD37C] transition-all duration-300 font-semibold flex items-center space-x-2"
              disabled={isLoggingOut}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="md:hidden" />
              <span className="hidden md:inline">
                {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </span>
            </button>
          </div>
        </div>

        {/* Layout Mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3">
          <div className="flex-1 flex justify-center">
            <Link href={"/home"}>
              <Image 
                src="/minouverselogo.png" 
                alt="Logo" 
                width={40} 
                height={40} 
                className="rounded-full hover:scale-105 transition-transform duration-200" 
              />
            </Link>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-[#333] text-[#90EE90] p-2 rounded-lg border border-[#555] hover:bg-[#444] transition-colors"
            aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-lg" />
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                onClick={handleMobileMenuClose}
              />
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 bg-[#1b1b1b] border-b border-[#333] shadow-lg z-40 md:hidden"
              >
                <nav className="p-4 space-y-3">
                  {navigationItems.map((item) => (
                    <Link 
                      key={item.href}
                      href={item.href}
                      onClick={handleMobileMenuClose}
                      className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        pathname === item.href
                          ? "text-[#90EE90] bg-[#333]"
                          : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  <Link 
                    href="/premium"
                    onClick={handleMobileMenuClose}
                    className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      pathname === "/premium"
                        ? "text-[#90EE90] bg-[#333]"
                        : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
                    }`}
                  >
                    <FontAwesomeIcon icon={faCrown} className="mr-2" />
                    Avantages Premium
                  </Link>
                  
                  <div className="border-t border-[#333] my-3"></div>
                  
                  <button
                    onClick={() => {
                      handleMobileMenuClose();
                      handleLogoutClick();
                    }}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-[#333] rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                    {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                  </button>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          if (!isLoggingOut) {
            setShowConfirmModal(false);
          }
        }}
        onConfirm={confirmLogout}
        title="Confirmation de déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        isLoading={isLoggingOut} 
      />
    </>
  );
};

export default Header;
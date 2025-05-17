"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from '../../ConfirmModal'; 
import { useSession, signOut } from 'next-auth/react'; 

const Header = () => {
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoutClick = () => {
    setShowConfirmModal(true); 
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true); 
    
    try {
      await signOut({ redirect: false }); 
      router.push('/login'); 
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false); 
      setShowConfirmModal(false); 
    }
  };

  const isAuthenticated = status === 'authenticated';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-6 bg-[#1b1b1b] border-b border-[#333] z-20">
        <div className="flex items-center">
          <Link href="/premium">
            <button
              className={`text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 ${
                pathname === "/premium"
                  ? "text-[#90EE90] bg-[#333] shadow-md"
                  : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
              }`}
            >
              <FontAwesomeIcon icon={faCrown} className="mr-2" />
              Avantages
            </button>
          </Link>
        </div>
        
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
          
          <Link href={"/home"}>
            <Image src="/minouverselogo.png" alt="Logo" width={50} height={50} className="rounded-full mx-4" />
          </Link>
          
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
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleLogoutClick} 
            className="bg-[#90EE90] text-black px-5 py-2 rounded-full hover:bg-[#7CD37C] transition-all duration-300"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
          </button>
        </div>
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
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faSearch, 
  faHistory, 
  faStar, 
  faBell, 
  faEnvelope, 
  faChartBar, 
  faTrophy, // Remplace faCalendarAlt par faTrophy
  faPlusCircle,
  faBars,
  faTimes 
} from "@fortawesome/free-solid-svg-icons";

const Sidebar = ({ onCreatePost }) => {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuItems = [
    { icon: faUser, label: "Profil", href: session?.user?.pseudo ? `/${session.user.pseudo}` : "#" },
    { icon: faSearch, label: "Recherche", href: "/search" },
    { icon: faHistory, label: "Historique", href: "/history" },
    { icon: faStar, label: "Favoris", href: session?.user?.pseudo ? `/${session.user.pseudo}/favorites` : "#" },
    { icon: faBell, label: "Notifications", href: "/notifications" },
    { icon: faEnvelope, label: "Messages", href: "/messages" },
    { icon: faChartBar, label: "Sondages", href: "/polls" },
    { icon: faTrophy, label: "Classement", href: "/classement" }, // Onglet Classement ici
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
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

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#1b1b1b] text-[#90EE90] p-2 rounded-lg border border-[#333] hover:bg-[#333] transition-colors"
      >
        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-lg" />
      </button>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        w-64 h-[calc(100vh-66px)] md:h-[calc(100vh-76px)] bg-[#1b1b1b] p-6 border-r border-[#333] z-40
        fixed left-0 top-[66px] md:top-[76px] transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <ul className="space-y-6 text-sm">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link 
                href={item.href} 
                className="flex items-center gap-3 hover:text-[#90EE90] cursor-pointer transition-all duration-300 text-gray-300"
                onClick={handleLinkClick}
              >
                <FontAwesomeIcon icon={item.icon} className="text-lg" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button 
              onClick={() => {
                onCreatePost();
                handleLinkClick();
              }}
              className="w-full mt-4 bg-[#90EE90] text-black py-2 rounded-full font-semibold hover:bg-[#7CD37C] flex items-center justify-center gap-2 transition-all duration-300"
            >
              <FontAwesomeIcon icon={faPlusCircle} />
              Poster
            </button>
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
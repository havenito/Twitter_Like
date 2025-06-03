"use client";

import React from 'react';
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
  faCalendarAlt, 
  faPlusCircle 
} from "@fortawesome/free-solid-svg-icons";

const Sidebar = ({ onCreatePost }) => {
  const { data: session } = useSession();
  
  // Items avec leurs liens
  const menuItems = [
    { icon: faUser, label: "Profil", href: session?.user?.pseudo ? `/${session.user.pseudo}` : "#" },
    { icon: faSearch, label: "Recherche", href: "/search" },
    { icon: faHistory, label: "Historique", href: "/history" },
    { icon: faStar, label: "Favoris", href: "/favorites" },
    { icon: faBell, label: "Notifications", href: "/notifications" },
    { icon: faEnvelope, label: "Messages", href: "/messages" },
    { icon: faChartBar, label: "Sondages", href: "/polls" },
    { icon: faCalendarAlt, label: "Événements", href: "/events" },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-76px)] bg-[#1b1b1b] p-6 fixed left-0 top-[96px] hidden md:block border-r border-[#333] z-10">
      <ul className="space-y-6 text-sm">
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link href={item.href} className="flex items-center gap-3 hover:text-[#90EE90] cursor-pointer transition-all duration-300 text-gray-300">
              <FontAwesomeIcon icon={item.icon} className="text-lg" />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
        <li>
          <button 
            onClick={onCreatePost}
            className="w-full mt-4 bg-[#90EE90] text-black py-2 rounded-full font-semibold hover:bg-[#7CD37C] flex items-center justify-center gap-2 transition-all duration-300"
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            Poster
          </button>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
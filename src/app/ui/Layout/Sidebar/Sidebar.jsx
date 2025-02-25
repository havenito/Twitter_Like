"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faClockRotateLeft, faSquarePollVertical, faChevronDown, faChevronUp, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { faBookmark, faBell, faMessage, faCalendar, faCompass, faComments } from "@fortawesome/free-regular-svg-icons";
import Image from 'next/image';
import Button from '../../../components/Button';

const Sidebar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="w-64 h-screen bg-[#333333] p-4 fixed left-0 top-0 border-r border-black z-10">
      <div className="flex flex-col items-center">
        <Image 
          src="/wallpaperflare.com_wallpaper (3).jpg" 
          alt="Profile Picture" 
          width={96} 
          height={96} 
          className="rounded-full mt-6 w-24 h-24 border border-[#90EE90] object-cover" 
        />
        <h2 className="mt-4 mb-4 text-xl text-[#90EE90]">Userxxxx</h2>
      </div>

      <div className="mt-8 ml-8 flex items-center cursor-pointer" onClick={toggleDropdown}>
        <FontAwesomeIcon icon={faCompass} className="text-black size-8" />
        <span className="ml-2 text-[#90EE90]">Explorer</span>
        <FontAwesomeIcon icon={isDropdownOpen ? faChevronUp : faChevronDown} className="ml-2 text-[#90EE90]" />
      </div>
      <div className={`ml-12 mt-2 transition-all duration-500 ease-in-out ${isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="flex items-center ml-6 mt-2">
            <FontAwesomeIcon icon={faGlobe} className="text-black size-8" />
            <span className="ml-2 text-[#90EE90]">Tout</span>
          </div>
          <div className="flex items-center ml-6 mt-4">
            <FontAwesomeIcon icon={faComments} className="text-black size-8" />
            <span className="ml-2 text-[#90EE90]">Tweets</span>
          </div>
          <div className="flex items-center ml-6 mt-4">
            <FontAwesomeIcon icon={faSquarePollVertical} className="text-black size-8" />
            <span className="ml-2 text-[#90EE90]">Sondages</span>
          </div>
          <div className="flex items-center ml-6 mt-4 mb-4">
            <FontAwesomeIcon icon={faCalendar} className="text-black size-8" />
            <span className="ml-2 text-[#90EE90]">Événements</span>
          </div>
        </div>
      </div>

      <div className="mt-2 ml-8 flex items-center mt-2">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-black size-8" />
        <span className="ml-2 text-[#90EE90]">Recherche</span>
      </div>
      <div className="mt-4 ml-8 flex items-center mt-4">
        <FontAwesomeIcon icon={faClockRotateLeft} className="text-black size-8" />
        <span className="ml-2 text-[#90EE90]">Historique</span>
      </div>
      <div className="mt-4 ml-8 flex items-center mt-4">
        <FontAwesomeIcon icon={faBookmark} className="text-black size-8" />
        <span className="ml-2 text-[#90EE90]">Favoris</span>
      </div>
      <div className="mt-4 ml-8 flex items-center mt-4">
        <FontAwesomeIcon icon={faBell} className="text-black size-8" />
        <span className="ml-2 text-[#90EE90]">Notifications</span>
      </div>
      <div className="mt-4 ml-8 flex items-center mt-4">
        <FontAwesomeIcon icon={faMessage} className="text-black size-8" />
        <span className="ml-2 text-[#90EE90]">Messages</span>
      </div>
      <Button className={`ml-12 px-6 py-3 rounded-full bg-[#90EE90] text-l text-black transition-all duration-500 hover:bg-[#7796B6]/20 hover:text-[#FFF] ${isDropdownOpen ? 'mt-4' : 'mt-8'}`}>Tweeter</Button>
    </div>
  );
};

export default Sidebar;
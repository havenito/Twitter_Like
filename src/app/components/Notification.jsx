"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function Notification({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
      } ${
        type === 'success' ? 'bg-[#90EE90] text-black' : 'bg-red-500/90 text-white'
      }`}
    >
      <FontAwesomeIcon 
        icon={type === 'success' ? faCheckCircle : faXmark} 
        className="mr-2" 
      />
      <span className="font-medium">{message}</span>
      <button 
        onClick={() => {
          setIsVisible(false);
          if (onClose) setTimeout(onClose, 300);
        }}
        className="ml-4 text-black/50 hover:text-black"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Main/Sidebar/Sidebar';


export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Loading state or unauthenticated
  if (isLoading) {
    // The layout structure isn't applied during loading/redirect, 
    // so we provide a full-screen loader here.
    return (
      <div className="flex items-center justify-center h-screen bg-[#222222]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90]"></div>
      </div>
    );
  }

  // Content for authenticated users, rendered within the HomeLayout
  return (
    <>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Central area for content with left margin to compensate for fixed sidebar */}
      <div className="ml-64 w-full"> 
        <section className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-[#90EE90]">Bienvenue sur votre fil d'actualités</h1>
            
            <div className="space-y-6">
              {/* Here you can add your posts or main content */}
              <p>Contenu du fil d'actualités sera affiché ici...</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
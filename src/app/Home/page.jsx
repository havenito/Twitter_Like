"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../ui/Layout/Sidebar/Sidebar';
import Header from '../ui/Layout/Header/Header';
import Footer from '../ui/Layout/Footer/Footer';

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('userToken');
        if (token) {
          setIsAuthenticated(true);
        } else {
          console.log("Utilisateur non authentifié tentant d'accéder à la page d'accueil. Redirection vers la page de connexion.");
          router.replace('/login');
        }
      } catch (error) {
        console.error("Erreur lors de l'accès au localStorage:", error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Loading state or unauthenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#222222]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90]"></div>
      </div>
    );
  }

  // Main layout with content for authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white flex flex-col">
      {/* Header fixed at the top */}
      <Header />
      
      {/* Main content with padding for the header */}
      <div className="flex flex-1 pt-[76px]">
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
      </div>
      
      {/* Footer displayed below the main content */}
      <Footer />
    </div>
  );
}
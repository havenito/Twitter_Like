"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './ui/Layout/Sidebar/Sidebar';
import Header from './ui/Layout/Header/Header';
import Footer from './ui/Layout/Footer/Footer';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Premier useEffect pour la vérification initiale de l'authentification
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('userToken');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("Erreur lors de l'accès au localStorage:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, []); // Exécuté uniquement au montage du composant

  // Second useEffect pour la redirection basée sur l'authentification
  useEffect(() => {
    if (!initialized) return;
    
    if (isAuthenticated && isAuthPage) {
      console.log("Utilisateur authentifié tentant d'accéder à une page d'authentification. Redirection vers la page d'accueil.");
      router.replace('/');
      return;
    }
    
    if (!isAuthenticated && !isPublicRoute) {
      console.log("Utilisateur non authentifié tentant d'accéder à une route protégée. Redirection vers la page de connexion.");
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, isAuthPage, isPublicRoute, initialized, pathname, router]);

  if (isAuthPage) {
    if (isAuthenticated) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#222222]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90]"></div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // Pour les routes protégées quand l'utilisateur n'est pas authentifié
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#222222]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90]"></div>
      </div>
    );
  }

  // Affichage normal avec layout pour les utilisateurs authentifiés
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 bg-[#222222] overflow-y-auto pt-16">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
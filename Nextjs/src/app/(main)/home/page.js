"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Main/Sidebar/Sidebar';

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();

        if (session && session.user) {
          setIsAuthenticated(true);
        } else {
          console.log("Pas de session trouvée, redirection vers /login");
          router.replace('/login');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#222222]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90]"></div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="ml-64 w-full">
        <section className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-[#90EE90]">
              Bienvenue sur votre fil d'actualités
            </h1>
            <div className="space-y-6">
              <p>Contenu du fil d'actualités sera affiché ici...</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

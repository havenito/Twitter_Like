"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '../../components/Main/Header/Header';
import Footer from '../../components/Footer';

export default function HomeLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white">
        <p>Chargement...</p> 
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white flex flex-col">
        <Header />
        <main className="flex flex-1 pt-[76px]"> 
          {children} 
        </main>
        <Footer />
      </div>
    );
  }

  return null; 
}
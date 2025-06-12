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

  useEffect(() => {
    if (session?.user) {
      console.group('🔍 INFORMATIONS UTILISATEUR CONNECTÉ');
      console.log('📧 Email:', session.user.email);
      console.log('👤 ID:', session.user.id);
      console.log('🏷️ Pseudo:', session.user.pseudo);
      console.log('👨‍💼 Prénom:', session.user.firstName);
      console.log('👨‍💼 Nom:', session.user.lastName);
      console.log('🖼️ Photo de profil:', session.user.profilePicture);
      console.log('🔒 Compte privé:', session.user.isPrivate);
      console.log('📝 Biographie:', session.user.biography);
      console.log('🎨 Bannière:', session.user.banner);
      console.log('💎 Abonnement:', session.user.subscription);
      console.log('⚡ Rôles:', session.user.roles);
      console.log('📱 Session complète:', session);
      console.groupEnd();
    } else if (status === 'loading') {
      console.log('⏳ Session en cours de chargement...');
    } else {
      console.log('❌ Aucun utilisateur connecté');
    }
  }, [session, status]);

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
        <main className="flex flex-1 pt-14 md:pt-[76px]"> 
          {children} 
        </main>
        <Footer />
      </div>
    );
  }

  return null; 
}
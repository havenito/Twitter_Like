"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from 'framer-motion'; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LandingHeader from "../components/Landing/LandingHeader";
import Footer from "../components/Footer";
import ParallaxIntro from "../components/Landing/ParallaxIntro";
import HeroSection from "../components/Landing/HeroSection";
import FeaturesSection from "../components/Landing/FeaturesSection";
import CTASection from "../components/Landing/CTASection";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { scrollY } = useScroll(); 
  const [windowHeight, setWindowHeight] = useState(0);

  // Rediriger si l'utilisateur est connecté
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowHeight(window.innerHeight);
      const handleResize = () => setWindowHeight(window.innerHeight);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const parallaxOpacity = useTransform(
    scrollY,
    [
      windowHeight * 0.95, // Commence à disparaître à 95vh
      windowHeight * 1   // Disparaît complètement à 100vh
    ],
    [1, 0] 
  );

  // opacité du fondu noir
  const fadeOpacity = useTransform(
    scrollY,
    [
      windowHeight * 0.30, // Début apparition fondu noir à 30vh
      windowHeight * 0.55, // Complètement noir à 55vh
      windowHeight * 1, // Reste noir jusqu'à 100vh
      windowHeight * 1.40  // Disparaît complètement à 140vh
    ],
    [0, 1, 1, 0] 
  );

  if (status === "loading" || windowHeight === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#222222]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90EE90]"></div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex items-center justify-center h-screen bg-[#222222]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90EE90] mb-4 mx-auto"></div>
          <p className="text-gray-400">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white">

      <motion.div style={{ opacity: parallaxOpacity, position: 'relative', zIndex: 1 }}>
         <ParallaxIntro />
      </motion.div>

      <motion.div
        className="fixed inset-0 bg-black z-50 pointer-events-none" 
        style={{ opacity: fadeOpacity }}
      />

      <div className="relative z-40"> 
        <LandingHeader />
        <main className="flex-1 flex flex-col items-center">
          <HeroSection />
          <FeaturesSection />
          <CTASection />
        </main>

        <Footer />
      </div>
    </div>
  );
}

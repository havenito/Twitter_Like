"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from 'framer-motion'; 
import LandingHeader from "../components/Landing/LandingHeader";
import Footer from "../components/Footer";
import ParallaxIntro from "../components/Landing/ParallaxIntro";
import HeroSection from "../components/Landing/HeroSection";
import FeaturesSection from "../components/Landing/FeaturesSection";
import FeedPreview from "../components/Landing/FeedPreview";
import TrendingSection from "../components/Landing/TrendingSection";
import CTASection from "../components/Landing/CTASection";

export default function Home() {
  const { scrollY } = useScroll(); 
  const [windowHeight, setWindowHeight] = useState(0);

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

  if (windowHeight === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#222222]">
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
          <section className="w-full max-w-7xl px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FeedPreview />
            <TrendingSection />
          </section>
          <CTASection />
        </main>

        <Footer />
      </div>
    </div>
  );
}

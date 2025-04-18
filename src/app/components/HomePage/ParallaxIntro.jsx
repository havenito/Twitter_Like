"use client";

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ParallaxIntro = () => {
  const { scrollYProgress } = useScroll();

  const yLayer1 = useTransform(scrollYProgress, [0, 0.2], ['0%', '100%']);
  const yLayer2 = useTransform(scrollYProgress, [0, 0.2], ['0%', '60%']);
  const yLayer3 = useTransform(scrollYProgress, [0, 0.2], ['0%', '30%']);

  const textAppearAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="relative h-[150vh] overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#1e1e1e] to-[#121212]">
      <div className="absolute inset-0 bg-[url('/night-city-city-6000x4000-9753.jpg')] bg-cover bg-center opacity-20"></div>

      <motion.div
        className="absolute top-[-35%] inset-0 flex items-center justify-center"
        style={{ y: yLayer1, zIndex: 10 }} 
      >
        <motion.h1 
          className="text-6xl md:text-8xl font-bold text-gray-600 opacity-50"
          initial={textAppearAnimation.initial}
          animate={textAppearAnimation.animate}
          transition={{ ...textAppearAnimation.transition, delay: 0.4 }} 
        >
          Minouverse
        </motion.h1>
      </motion.div>

      <motion.div
        className="absolute top-[-35%] inset-0 flex items-center justify-center"
        style={{ y: yLayer2, zIndex: 20 }} 
      >
        <motion.h2 
          className="text-4xl md:text-6xl font-semibold text-gray-400 opacity-70"
          initial={textAppearAnimation.initial}
          animate={textAppearAnimation.animate}
          transition={{ ...textAppearAnimation.transition, delay: 0.2 }}
        >
          Le réseau félin
        </motion.h2>
      </motion.div>

      <motion.div
        className="absolute top-[-37%] inset-0 flex items-center justify-center"
        style={{ y: yLayer3, zIndex: 30 }} 
      >
        <motion.h1 
          className="text-7xl md:text-9xl font-extrabold text-[#90EE90]"
          initial={textAppearAnimation.initial}
          animate={textAppearAnimation.animate}
          transition={{ ...textAppearAnimation.transition, delay: 0 }} 
        >
          Minouverse
        </motion.h1>
      </motion.div>

      <motion.div
        className="absolute top-[95vh] left-1/2 transform -translate-x-1/2 z-40 text-gray-400 animate-bounce"
        style={{ opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]) }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </motion.div>
    </div>
  );
};

export default ParallaxIntro;
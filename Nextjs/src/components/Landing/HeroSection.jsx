"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Carousel from "./Caroussel";

const HeroSection = () => {
  return (
    <section className="w-full max-w-7xl px-4 py-12 flex flex-col lg:flex-row items-center justify-between">
      <motion.div 
        className="lg:w-1/2 mb-10 lg:mb-0 lg:pr-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1 className="text-5xl font-bold text-[#90EE90] mb-4">
          Bienvenue sur Minouverse !
        </h1>
        <p className="text-xl text-gray-300 mb-8">
            Rejoignez une communauté dynamique où chaque voix compte. Minouverse est bien plus qu'un simple réseau social : c'est un espace où vous pouvez partager vos idées, découvrir des passions communes et vous connecter avec des personnes du monde entier.
        </p>
      </motion.div>
      
      <motion.div 
        className="lg:w-1/2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Carousel />
      </motion.div>
    </section>
  );
};

export default HeroSection;
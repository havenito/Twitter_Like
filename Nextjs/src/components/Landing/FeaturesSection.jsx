"use client";

import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faComment,
  faHandshake,
  faShieldAlt
} from "@fortawesome/free-solid-svg-icons";

const FeatureCard = ({ icon, title, description, variants }) => (
  <motion.div 
    className="bg-[#222222] p-6 rounded-lg flex flex-col items-center text-center"
    variants={variants}
  >
    <div className="w-16 h-16 bg-[#90EE90]/20 rounded-full flex items-center justify-center mb-4">
      <FontAwesomeIcon icon={icon} className="text-[#90EE90] text-2xl" />
    </div>
    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

const FeaturesSection = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: faComment,
      title: "Liberté d'expression",
      description: "Exprimez-vous librement et partagez vos pensées sans limites dans un espace sécurisé et respectueux."
    },
    {
      icon: faHandshake,
      title: "Interface intuitive",
      description: "Une expérience utilisateur fluide et agréable, conçue pour vous."
    },
    {
      icon: faShieldAlt,
      title: "Sécurité et confidentialité",
      description: "Vos données sont protégées. Nous respectons votre vie privée."
    }
  ];

  return (
    <section className="w-full bg-[#161616] py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2 
          className="text-3xl font-bold text-center text-[#90EE90] mb-12"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          Pourquoi rejoindre Minouverse ?
        </motion.h2>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              variants={fadeIn}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
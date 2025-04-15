"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const homeSlides = [
  {
    id: 1,
    title: "Fil d'actualité personnalisé",
    description: "Suivez les personnes et les sujets qui vous intéressent.",
    buttonText: "S'inscrire",
    link: "/register"
  },
  {
    id: 2,
    title: "Messages directs",
    description: "Communiquez en privé avec vos amis et vos abonnés.",
    buttonText: "Se connecter",
    link: "/login"
  },
  {
    id: 3,
    title: "Sondage et événements",
    description: "Créez des sondages et participez à des événements avec la communauté.",
    buttonText: "S'inscrire",
    link: "/register"
  }
];

export default function Carousel({ slides = homeSlides }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full max-w-5xl h-[500px]">
      <AnimatePresence>
        {slides.map((slide, index) =>
          index === currentSlide ? (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-lg p-12 text-center shadow-2xl flex flex-col items-center justify-center"
            >
              <h1 className="text-5xl font-extrabold text-[#90EE90] mb-6">
                {slide.title}
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                {slide.description}
              </p>
              <Link href={slide.link}>
                <button className="bg-[#90EE90] px-10 py-4 rounded-full text-black font-semibold hover:bg-[#7CD37C] shadow-lg transition-all duration-300">
                  {slide.buttonText}
                </button>
              </Link>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
      <div className="absolute top-1/2 left-6 transform -translate-y-1/2 cursor-pointer">
        <FontAwesomeIcon
          icon={faChevronLeft}
          className="text-[#90EE90] text-4xl"
          onClick={handlePrev}
        />
      </div>
      <div className="absolute top-1/2 right-6 transform -translate-y-1/2 cursor-pointer">
        <FontAwesomeIcon
          icon={faChevronRight}
          className="text-[#90EE90] text-4xl"
          onClick={handleNext}
        />
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSearch,
  faHistory,
  faStar,
  faBell,
  faEnvelope,
  faChartBar,
  faCalendarAlt,
  faPlusCircle,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const pathname = usePathname();

  // Gestion des slides
  const slides = [
    {
      id: 1,
      title: "Découvrez nos abonnements",
      description: "Choisissez un abonnement adapté à vos besoins et profitez de fonctionnalités exclusives.",
      buttonText: "Voir les abonnements",
      link: "/subscriptions",
    },
    {
      id: 2,
      title: "Participez à des événements",
      description: "Rejoignez des événements uniques et connectez-vous avec la communauté.",
      buttonText: "Voir les événements",
      link: "/events",
    },
    {
      id: 3,
      title: "Créez et répondez à des sondages",
      description: "Exprimez vos opinions et découvrez ce que pense la communauté.",
      buttonText: "Voir les sondages",
      link: "/polls",
    },
    {
      id: 4,
      title: "Partagez vos idées",
      description: "Publiez vos créations et inspirez les autres membres de la communauté.",
      buttonText: "Poster maintenant",
      link: "/create",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1e1e] to-[#121212] text-white flex flex-col">
      {/* Barre de navigation */}
      <header className="flex items-center justify-between px-8 py-6 bg-[#1b1b1b] shadow-lg">
        <div className="flex items-center space-x-6">
          <Image src="/minouverselogo.png" alt="Logo" width={50} height={50} className="rounded-full" />
          <nav className="flex gap-6">
            <Link href="/advantages">
              <button
                className={`text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 ${
                  pathname === "/advantages"
                    ? "text-[#90EE90] bg-[#333] shadow-md"
                    : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
                }`}
              >
                Avantages
              </button>
            </Link>
            <Link href="/foryou">
              <button
                className={`text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 ${
                  pathname === "/foryou"
                    ? "text-[#90EE90] bg-[#333] shadow-md"
                    : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
                }`}
              >
                Pour Vous
              </button>
            </Link>
            <Link href="/subscriptions">
              <button
                className={`text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 ${
                  pathname === "/subscriptions"
                    ? "text-[#90EE90] bg-[#333] shadow-md"
                    : "text-gray-300 hover:text-[#90EE90] hover:bg-[#333]"
                }`}
              >
                Abonnements
              </button>
            </Link>
          </nav>
        </div>
        <div className="flex gap-4">
          <Link href="/register">
            <button className="bg-[#333] text-gray-300 px-5 py-2 rounded-full hover:bg-[#444] hover:text-white transition-all duration-300">
              Inscription
            </button>
          </Link>
          <Link href="/login">
            <button className="bg-[#90EE90] text-black px-5 py-2 rounded-full hover:bg-[#7CD37C] transition-all duration-300">
              Connexion
            </button>
          </Link>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex flex-1">
        {/* Menu gauche */}
        <aside className="w-64 bg-[#1b1b1b] p-6 hidden md:block border-r border-[#333]">
          <ul className="space-y-6 text-sm">
            {[
              { icon: faUser, label: "Profil" },
              { icon: faSearch, label: "Recherche" },
              { icon: faHistory, label: "Historique" },
              { icon: faStar, label: "Favoris" },
              { icon: faBell, label: "Notifications" },
              { icon: faEnvelope, label: "Messages" },
              { icon: faChartBar, label: "Sondages" },
              { icon: faCalendarAlt, label: "Événements" },
            ].map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-3 hover:text-[#90EE90] cursor-pointer transition-all duration-300"
              >
                <FontAwesomeIcon icon={item.icon} className="text-lg" />
                <span>{item.label}</span>
              </li>
            ))}
            <li>
              <button className="w-full mt-4 bg-[#90EE90] text-black py-2 rounded-full font-semibold hover:bg-[#7CD37C] flex items-center justify-center gap-2 transition-all duration-300">
                <FontAwesomeIcon icon={faPlusCircle} />
                Poster
              </button>
            </li>
          </ul>
        </aside>

        {/* Zone centrale */}
        <section className="flex-1 flex flex-col items-center justify-center p-10">
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
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 bg-[#1b1b1b] border-t border-[#333]">
        Minouverse © 2025 - Tous droits réservés
      </footer>
    </div>
  );
}
"use client";

import React from "react";
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
import { motion } from "framer-motion";

export default function HomePage() {
  const pathname = usePathname();

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] rounded-lg p-8 text-center shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <FontAwesomeIcon icon={faChevronLeft} className="text-[#90EE90] text-2xl cursor-pointer" />
              <FontAwesomeIcon icon={faChevronRight} className="text-[#90EE90] text-2xl cursor-pointer" />
            </div>
            <h1 className="text-4xl font-extrabold text-[#90EE90] mb-4">
              Bienvenue sur Minouverse !
            </h1>
            <p className="text-lg text-gray-400 mb-6">
              Découvrez un univers unique et profitez de nos fonctionnalités exclusives.
            </p>
            <button className="bg-[#90EE90] px-8 py-3 rounded-full text-black font-semibold hover:bg-[#7CD37C] shadow-lg transition-all duration-300">
              Essai gratuit pendant 7 jours
            </button>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 bg-[#1b1b1b] border-t border-[#333]">
        Minouverse © 2025 - Tous droits réservés
      </footer>
    </div>
  );
}
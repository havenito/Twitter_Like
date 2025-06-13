"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function HomeCard({ icon, title, description, href, button, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#1b1b1b] rounded-2xl p-8 shadow-xl flex flex-col items-center border border-[#23272f] hover:scale-[1.025] transition"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#90EE90] shadow mb-4">
        <FontAwesomeIcon icon={icon} className="text-3xl text-black" />
      </div>
      <h2 className="text-2xl font-bold text-[#90EE90] mb-2 text-center">{title}</h2>
      <p className="text-gray-300 mb-6 text-center">{description}</p>
      <a
        href={href}
        className="px-6 py-3 bg-[#90EE90] text-black font-semibold rounded-xl shadow hover:scale-105 transition"
      >
        {button}
      </a>
    </motion.div>
  );
}
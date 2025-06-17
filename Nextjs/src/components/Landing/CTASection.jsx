import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'; 

const CTASection = () => {
  return (
    <section className="w-full bg-gradient-to-r from-[#90EE90] to-[#2a5e2a] py-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.h2 
          className="text-4xl font-bold mb-4 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Prêt à nous rejoindre ?
        </motion.h2>
        
        <motion.p 
          className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Créez un compte aujourd'hui et commencez à partager ce que vous voulez avec des milliers d'autres utilisateurs.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link href="/register">
            <button className="bg-white text-[#2a5e2a] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all duration-300">
              Créer un compte
            </button>
          </Link>
        </motion.div>

        <motion.div
          className="mt-6 text-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
            <p> 
              Vous avez déjà un compte ?{' '}
              <Link 
                href="/login" 
                className="text-white font-bold underline hover:text-gray-300 transition-colors duration-300 inline-flex items-center"
              >
                Se connecter
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-1 h-4 w-4" />
              </Link>
            </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
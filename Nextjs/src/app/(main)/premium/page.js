"use client";

import React, { useState } from 'react';
import Card from '../../../components/Main/Premium/Card';
import { motion } from 'framer-motion';
import Link from 'next/link'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'; 

const subscriptionPlans = [
  {
    id: 'free',
    name: 'Minouverse Free',
    description: 'Les fonctionnalités de base pour commencer.',
    price: '0€',
    features: [
        'Accès au fil d\'actualité',
        'Poster des "Miaous"',
        'Suivre d\'autres utilisateurs',
        'Messagerie directe',
        'Support basique',
        'Publicités',
    ],
  },
  {
    id: 'plus',
    name: 'Minouverse Plus',
    description: 'Plus de fonctionnalités pour une meilleure expérience.',
    price: '4.99€',
    features: [
      'Tout de Minouverse Free',
      'Badge "Plus" sur le profil',
      'Photo de profil et bannière animées',
      'Support prioritaire',
      'Moins de publicités',
    ],
  },
  {
    id: 'premium',
    name: 'Minouverse Premium✨',
    description: 'L\'expérience complète sans compromis.',
    price: '9.99€',
    features: [
      'Tout de Minouverse Plus',
      'Badge "Premium" exclusif',
      'Boost de vos "Miaous"',
      'Choix de thèmes personnalisés',
      'Support 24/7',
      'Aucune publicité',
    ],
  },
];

export default function PremiumPage() {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  // TODO: Remplacer 'free' par la logique pour récupérer l'abonnement actuel de l'utilisateur depuis la BDD
  const [currentPlanId] = useState('free');

  const handleCardClick = (planId) => {
    setSelectedPlanId(planId === selectedPlanId ? null : planId);
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] py-12 px-4 sm:px-6 lg:px-8 text-white w-full relative">

      <Link href="/home" passHref>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8 flex items-center px-4 py-2 bg-[#333] text-white rounded-full shadow-md hover:bg-[#444] transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
          Retour
        </motion.button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 pt-16"
      >
        <h1 className="text-4xl font-extrabold text-[#90EE90] mb-4">
          Choisissez votre abonnement Minouverse
        </h1>
        <p className="text-lg text-gray-400">
          Débloquez plus de fonctionnalités et soutenez la plateforme.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-12 items-stretch max-w-6xl mx-auto"
      >
        {subscriptionPlans.map((plan) => (
          <motion.div
            key={plan.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            className="flex"
          >
            <Card
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              isCurrent={currentPlanId === plan.id}
              onClick={() => handleCardClick(plan.id)}
              className="flex-1"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
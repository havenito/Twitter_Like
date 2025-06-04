"use client";

import React, { useState, useEffect } from 'react';
import Card from '../../../components/Main/Premium/Card';
import { motion } from 'framer-motion';
import Link from 'next/link'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'; 
import { useSession } from 'next-auth/react';

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
  const [currentPlanId, setCurrentPlanId] = useState('free');
  const [loading, setLoading] = useState(false);
  const { data: session, update } = useSession(); // Ajout de 'update'

  // AJOUT : Afficher les infos utilisateur dans la console spécifiquement pour la page Premium
  useEffect(() => {
    if (session?.user) {
      console.group('💎 INFORMATIONS UTILISATEUR - PAGE PREMIUM');
      console.log('📧 Email:', session.user.email);
      console.log('👤 ID:', session.user.id);
      console.log('🏷️ Pseudo:', session.user.pseudo);
      console.log('💰 Abonnement actuel:', session.user.subscription);
      console.log('💳 Type d\'abonnement détecté:', currentPlanId);
      console.log('🔍 Session complète:', session);
      console.groupEnd();
    }
  }, [session, currentPlanId]);

  useEffect(() => {
    // Récupérer l'abonnement actuel de l'utilisateur depuis la session
    if (session?.user?.subscription) {
      setCurrentPlanId(session.user.subscription);
      console.log('Abonnement actuel de l\'utilisateur:', session.user.subscription);
    } else {
      // Si pas d'abonnement dans la session, récupérer depuis l'API
      const fetchUserSubscription = async () => {
        if (session?.user?.id) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/user/${session.user.id}/subscription`);
            const data = await response.json();
            setCurrentPlanId(data.plan || 'free');
          } catch (error) {
            console.error('Erreur lors de la récupération de l\'abonnement:', error);
            setCurrentPlanId('free');
          }
        }
      };

      fetchUserSubscription();
    }
  }, [session]);

  // Gérer les paramètres de retour de Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success) {
      // Afficher l'alerte une seule fois
      alert('Paiement réussi ! Votre abonnement a été activé.');
      
      // Nettoyer l'URL pour éviter de redéclencher l'alerte
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // SOLUTION 1 : Forcer la mise à jour de la session
      const updateSession = async () => {
        try {
          // Récupérer les nouvelles données utilisateur
          const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/user/${session.user.id}/subscription`);
          const data = await response.json();
          
          // Mettre à jour la session avec les nouvelles données
          await update({
            subscription: data.plan || 'free'
          });
          
          // Mettre à jour l'état local
          setCurrentPlanId(data.plan || 'free');
          console.log('Session mise à jour avec le nouvel abonnement:', data.plan);
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la session:', error);
        }
      };

      if (session?.user?.id) {
        updateSession();
      }
    } else if (canceled) {
      alert('Paiement annulé.');
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [session?.user?.id, update]); // Ajout des dépendances

  const handleCardClick = (planId) => {
    setSelectedPlanId(planId === selectedPlanId ? null : planId);
  };

  const handleSubscribe = async (planId) => {
    if (!session?.user?.id) {
      alert('Vous devez être connecté pour vous abonner');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId,
          userId: session.user.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erreur lors de la création de la session de paiement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la session de paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] py-12 px-4 sm:px-6 lg:px-8 text-white w-full relative">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-black">Redirection vers le paiement...</p>
          </div>
        </div>
      )}

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
              onSubscribe={handleSubscribe}
              className="flex-1"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
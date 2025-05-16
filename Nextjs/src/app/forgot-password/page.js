"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Notification from '../../components/Notification';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [fieldError, setFieldError] = useState(''); 
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setShowNotification(false);
    setFieldError(''); 

    try {
      const res = await fetch('http://localhost:5000/api/request-password-reset', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Vérifier si l'erreur est celle spécifique aux comptes OAuth
        if (data.error && data.error.includes("fournisseur externe")) {
          setFieldError(data.error);
        } else {
          setError(data.error || data.message || 'Erreur lors de la demande de réinitialisation.');
          setShowNotification(true);
        }
        return; 
      }
      setMessage(data.message || 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.');
      setShowNotification(true);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Une erreur inattendue est survenue.');
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.4, ease: 'easeIn' } },
  };

  const notificationVariants = {
    initial: { opacity: 0, y: -20, scale: 0.95, x: '-50%' },
    animate: { opacity: 1, y: 0, scale: 1, x: '-50%' },
    exit: { opacity: 0, y: -10, scale: 0.95, x: '-50%', transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#222222] px-4">
      {showNotification && !fieldError && (
        <Notification
          message={message || error}
          type={message ? 'success' : 'error'}
          onClose={() => setShowNotification(false)}
          variants={notificationVariants}
        />
      )}

      <motion.div
        key="forgot-password"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="w-full max-w-md bg-[#333333] p-8 rounded-lg shadow-lg"
      >
        <div className="flex justify-center mb-6">
          <Image
            src="/minouverselogo.png"
            alt="Minouverse Logo"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-[#90EE90] mb-6">
          Mot de passe oublié
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            >
            {fieldError && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 rounded mb-2">
                {fieldError}
              </div>
            )}
            <label htmlFor="email" className="block text-[#90EE90] mb-1">
              Adresse e-mail
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre adresse e-mail"
                className="w-full pl-10 pr-3 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#90EE90] text-black font-medium rounded-full hover:bg-[#7CD37C] transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </motion.button>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-[#90EE90] hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
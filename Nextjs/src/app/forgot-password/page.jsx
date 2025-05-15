"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Notification from '../../components/Notification';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Si le backend renvoie une erreur explicite
        if (data.error && data.error.toLowerCase().includes('email')) {
          setError("Adresse email non reconnue.");
        } else {
          setError(data.error || "Erreur lors de l'envoi du mail.");
        }
        setShowNotification(true);
        return;
      }

      // Cas où le backend répond toujours OK même si l'email n'existe pas
      if (data.message && data.message.toLowerCase().includes('si un compte existe')) {
        setMessage("Si un compte existe pour cette adresse, un email a été envoyé.");
      } else {
        setMessage(data.message || "Lien envoyé !");
      }
      setShowNotification(true);
    } catch (err) {
      setError("Erreur lors de l'envoi du mail.");
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit:    { opacity: 0, y: -50, transition: { duration: 0.4, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#120e0e] px-4">
      {showNotification && (
        <Notification
          message={error ? error : message}
          type={error ? "error" : "success"}
          onClose={() => setShowNotification(false)}
          variants={{ initial:{opacity:0}, animate:{opacity:1}, exit:{opacity:0} }}
        />
      )}

      <motion.div
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

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <label htmlFor="email" className="block text-[#90EE90] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Entrez votre email"
              className="w-full px-3 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
              required
            />
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
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
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
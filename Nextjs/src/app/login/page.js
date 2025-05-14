"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Notification from '../../components/Notification';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Échec de la connexion');
      }

      localStorage.setItem('userToken', data.token);

      setShowNotification(true);
      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (error) {
      setPassword('');
      setError(error.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#222222] px-4">
      {showNotification && (
        <Notification 
          message="Connexion réussie" 
          type="success" 
          onClose={() => setShowNotification(false)} 
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }}
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
          Connexion à Minouverse
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[#90EE90] mb-1">Email</label>
            <div className="relative">
              <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                className="w-full pl-10 pr-3 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[#90EE90] mb-1">Mot de passe</label>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                className="w-full pl-10 pr-10 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#90EE90] focus:outline-none"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[#90EE90] text-black font-medium rounded-full hover:bg-[#7CD37C] transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white-500 text-white font-medium rounded hover:bg-blue-600 transition-colors"
          >
            {/* Logo Google SVG */}

          <svg className="mr-2" width="20" height="20" viewBox="0 0 20 20">
              <g>
                <path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.48c-.24 1.29-.97 2.39-2.07 3.13v2.6h3.34c1.95-1.8 3.08-4.45 3.08-7.52z"/>
                <path fill="#34A853" d="M10 20c2.7 0 4.97-.9 6.62-2.44l-3.34-2.6c-.93.62-2.12.99-3.28.99-2.52 0-4.66-1.7-5.42-3.99H1.1v2.5C2.82 17.98 6.13 20 10 20z"/>
                <path fill="#FBBC05" d="M4.58 12.96A5.98 5.98 0 014 10c0-.99.18-1.94.5-2.96V4.54H1.1A9.98 9.98 0 000 10c0 1.64.39 3.19 1.1 4.54l3.48-2.58z"/>
                <path fill="#EA4335" d="M10 4c1.47 0 2.8.51 3.85 1.51l2.89-2.89C14.97 1.1 12.7 0 10 0 6.13 0 2.82 2.02 1.1 5.46l3.48 2.58C5.34 5.7 7.48 4 10 4z"/>
              </g>
            </svg>
            Connexion avec Google
          </button>
          <button
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white font-medium rounded mt-4 hover:bg-gray-900 transition-colors"
          >
            {/* Logo GitHub SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="mr-2">
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 013.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.625-5.475 5.921.43.371.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Connexion avec GitHub
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-[#90EE90] hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
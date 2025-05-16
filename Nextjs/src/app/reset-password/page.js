"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Notification from '../../components/Notification';
import { useSearchParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faCheckCircle, faTimesCircle, faLock } from "@fortawesome/free-solid-svg-icons";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // New state for confirm password visibility
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (!token) setError('Token manquant dans l’URL');
  }, [token]);

  const checkMinLength = (pass) => pass.length >= 8;
  const checkHasUppercase = (pass) => /[A-Z]/.test(pass);
  const checkHasNumber = (pass) => /\d/.test(pass);
  const checkHasSpecialChar = (pass) => /[!@#$%^&*(),.=?":{}|<>_-]/.test(pass);

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordCriteria({
      minLength: checkMinLength(newPassword),
      hasUppercase: checkHasUppercase(newPassword),
      hasNumber: checkHasNumber(newPassword),
      hasSpecialChar: checkHasSpecialChar(newPassword),
    });
  };

  const validatePassword = (pass) => {
    if (!checkMinLength(pass)) {
      return "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (!checkHasUppercase(pass)) {
      return "Le mot de passe doit contenir au moins une lettre majuscule.";
    }
    if (!checkHasNumber(pass)) {
      return "Le mot de passe doit contenir au moins un chiffre.";
    }
    if (!checkHasSpecialChar(pass)) {
      return "Le mot de passe doit contenir au moins un caractère spécial.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setError(passwordValidationError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      setMessage(data.message);
      setShowNotification(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.4, ease: 'easeIn' } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#222222] px-4">
      {showNotification && (
        <Notification
          message={message}
          type={message ? 'success' : 'error'}
          onClose={() => setShowNotification(false)}
          variants={{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}
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
          Réinitialiser le mot de passe
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
            <label htmlFor="password" className="block text-[#90EE90] mb-1">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Entrez votre nouveau mot de passe"
                className="w-full pl-10 pr-10 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#90EE90] focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <div className="mt-2 space-y-1 pt-1 text-xs">
              <p className={`flex items-center ${passwordCriteria.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={passwordCriteria.minLength ? faCheckCircle : faTimesCircle} className="mr-2" />
                Au moins 8 caractères.
              </p>
              <p className={`flex items-center ${passwordCriteria.hasUppercase ? 'text-green-400' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={passwordCriteria.hasUppercase ? faCheckCircle : faTimesCircle} className="mr-2" />
                Au moins une lettre majuscule (A-Z).
              </p>
              <p className={`flex items-center ${passwordCriteria.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={passwordCriteria.hasNumber ? faCheckCircle : faTimesCircle} className="mr-2" />
                Au moins un chiffre (0-9).
              </p>
              <p className={`flex items-center ${passwordCriteria.hasSpecialChar ? 'text-green-400' : 'text-gray-400'}`}>
                <FontAwesomeIcon icon={passwordCriteria.hasSpecialChar ? faCheckCircle : faTimesCircle} className="mr-2" />
                Au moins un caractère spécial (!@#$...).
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <label htmlFor="confirmPassword" className="block text-[#90EE90] mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"} // Use new state here
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                className="w-full pl-10 pr-10 py-2 bg-[#444444] text-white rounded border border-[#555555] focus:outline-none focus:ring-2 focus:ring-[#90EE90]"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#90EE90] focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle new state
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            type="submit"
            disabled={loading || !token}
            className="w-full px-4 py-2 bg-[#90EE90] text-black font-medium rounded-full hover:bg-[#7CD37C] transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? 'Mise à jour…' : 'Valider'}
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
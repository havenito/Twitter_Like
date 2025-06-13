"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faUser, faTag, faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef();
  const router = useRouter();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (value.trim().length === 0) {
      setUserResults([]);
      setCategoryResults([]);
      setShowDropdown(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/search?q=${encodeURIComponent(value)}`
        );
        const userData = await userRes.json();

        const catRes = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories/search?q=${encodeURIComponent(value)}`
        );
        const catData = await catRes.json();

        setUserResults(userData.users || []);
        setCategoryResults(catData.categories || []);
        setShowDropdown(true);
      } catch {
        setUserResults([]);
        setCategoryResults([]);
        setShowDropdown(false);
      }
      setLoading(false);
    }, 300);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleCategoryClick = (catId) => {
    setShowDropdown(false);
    router.push(`search/categories/${catId}`);
  };

  const handleUserClick = (pseudo) => {
    setShowDropdown(false);
    router.push(`/${pseudo}`);
  };

  const renderSubscriptionBadge = (user) => {
    const subscription = user?.subscription || 'free';
    
    if (subscription === 'plus') {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
          <Image
            src="/plusbadge.png"
            alt="Badge Plus"
            width={12}
            height={12}
            className="w-full h-full object-contain"
          />
        </div>
      );
    } else if (subscription === 'premium') {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
          <Image
            src="/premiumbadge.png"
            alt="Badge Premium"
            width={12}
            height={12}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    
    return null;
  };

  const renderProfilePicture = (user) => {
    const profilePicture = user?.profile_picture || user?.profilePicture;
    
    if (!profilePicture) {
      return (
        <div className="relative">
          <Image
            src="/defaultuserpfp.png"
            alt={`Photo de profil de ${user?.pseudo || 'Utilisateur'}`}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border border-[#555]"
          />
          {renderSubscriptionBadge(user)}
        </div>
      );
    }

    return (
      <div className="relative">
        <Image
          src={profilePicture}
          alt={`Photo de profil de ${user?.pseudo || 'Utilisateur'}`}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border border-[#555]"
          onError={(e) => {
            e.target.src = '/defaultuserpfp.png';
          }}
        />
        {renderSubscriptionBadge(user)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-[#90EE90] bg-opacity-20 rounded-full mb-4"
          >
            <FontAwesomeIcon icon={faSearch} className="text-2xl text-[#90EE90]" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#90EE90] mb-2">
            Recherche
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Trouvez des utilisateurs et explorez les catégories
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <FontAwesomeIcon 
                icon={loading ? faSpinner : faSearch} 
                className={`text-gray-400 ${loading ? 'animate-spin' : ''}`}
              />
            </div>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => query && setShowDropdown(true)}
              onBlur={handleBlur}
              placeholder="Rechercher un utilisateur ou une catégorie..."
              className="w-full pl-12 pr-4 py-4 bg-[#1e1e1e] text-white placeholder-gray-400 border border-[#333] rounded-xl focus:outline-none focus:border-[#90EE90] focus:ring-2 focus:ring-[#90EE90] focus:ring-opacity-20 transition-all duration-200 text-lg"
            />
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 mt-2 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
              >
                <div className="max-h-96 overflow-y-auto scrollbar-hide">
                  {loading ? (
                    <div className="p-6 text-center">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-[#90EE90] text-xl mb-2" />
                      <p className="text-gray-400">Recherche en cours...</p>
                    </div>
                  ) : (
                    <>
                      {userResults.length > 0 && (
                        <div className="border-b border-[#333]">
                          <div className="px-4 py-3 bg-[#252525] border-b border-[#333]">
                            <div className="flex items-center space-x-2">
                              <FontAwesomeIcon icon={faUser} className="text-[#90EE90] text-sm" />
                              <span className="text-[#90EE90] font-semibold text-sm">
                                Utilisateurs ({userResults.length})
                              </span>
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {userResults.map((user) => (
                              <motion.button
                                key={"user-" + user.id}
                                onMouseDown={() => handleUserClick(user.pseudo)}
                                whileHover={{ backgroundColor: '#252525' }}
                                className="flex items-center space-x-3 px-4 py-3 w-full text-left transition-colors duration-200"
                                tabIndex={-1}
                                type="button"
                              >
                                <div className="flex-shrink-0">
                                  {renderProfilePicture(user)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-white truncate">
                                      {user.first_name && user.last_name 
                                        ? `${user.first_name} ${user.last_name}`
                                        : user.pseudo}
                                    </span>
                                    {user.private && (
                                      <div className="w-3 h-3 bg-yellow-500 rounded-full" title="Compte privé" />
                                    )}
                                  </div>
                                  <p className="text-gray-400 text-sm truncate">@{user.pseudo}</p>
                                  {user.biography && (
                                    <p className="text-gray-500 text-xs truncate mt-1">{user.biography}</p>
                                  )}
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {categoryResults.length > 0 && (
                        <div>
                          <div className="px-4 py-3 bg-[#252525] border-b border-[#333]">
                            <div className="flex items-center space-x-2">
                              <FontAwesomeIcon icon={faTag} className="text-[#90EE90] text-sm" />
                              <span className="text-[#90EE90] font-semibold text-sm">
                                Catégories ({categoryResults.length})
                              </span>
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {categoryResults.map((cat) => (
                              <motion.button
                                key={"cat-" + cat.id}
                                onMouseDown={() => handleCategoryClick(cat.id)}
                                whileHover={{ backgroundColor: '#252525' }}
                                className="flex items-center space-x-3 px-4 py-3 w-full text-left transition-colors duration-200"
                                tabIndex={-1}
                                type="button"
                              >
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#90EE90] bg-opacity-20 border border-[#90EE90] flex-shrink-0">
                                  <FontAwesomeIcon icon={faTag} className="text-[#90EE90] text-sm" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-white block truncate">{cat.name}</span>
                                  <span className="text-gray-400 text-sm">Catégorie</span>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!loading && userResults.length === 0 && categoryResults.length === 0 && query.trim() && (
                        <div className="p-6 text-center">
                          <div className="w-12 h-12 bg-gray-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-lg" />
                          </div>
                          <p className="text-gray-400 font-medium">Aucun résultat trouvé</p>
                          <p className="text-gray-500 text-sm mt-1">
                            Essayez avec d'autres termes de recherche
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {!query && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1e1e1e] rounded-xl p-6 border border-[#333]">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-[#90EE90] bg-opacity-20 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-[#90EE90]" />
                  </div>
                  <h3 className="text-white font-semibold">Utilisateurs</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Recherchez des utilisateurs par leur pseudo ou leur nom pour découvrir leurs profils et publications.
                </p>
              </div>

              <div className="bg-[#1e1e1e] rounded-xl p-6 border border-[#333]">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-[#90EE90] bg-opacity-20 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faTag} className="text-[#90EE90]" />
                  </div>
                  <h3 className="text-white font-semibold">Catégories</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Explorez les différentes catégories de contenu pour trouver des publications sur vos sujets favoris.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
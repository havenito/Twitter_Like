"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef();
  const router = useRouter();

  // Appel API à chaque frappe (avec debounce)
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
        // Recherche utilisateurs
        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/search?q=${encodeURIComponent(value)}`
        );
        const userData = await userRes.json();

        // Recherche catégories
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
    }, 300); // debounce 300ms
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200); // laisse le temps de cliquer
  };

  // Redirection Next.js pour les catégories
  const handleCategoryClick = (catId) => {
    setShowDropdown(false);
    router.push(`search/categories/${catId}`);
  };

  // Redirection Next.js pour les utilisateurs
  const handleUserClick = (pseudo) => {
    setShowDropdown(false);
    router.push(`/${pseudo}`);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[60vh] pt-12 bg-[#181c24]">
      <div className="w-full max-w-lg relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query && setShowDropdown(true)}
          onBlur={handleBlur}
          placeholder="Rechercher un utilisateur ou une catégorie..."
          className="w-full px-5 py-3 rounded-2xl bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2 focus:ring-green-400 text-lg shadow transition"
        />
        {showDropdown && (
          <div className="absolute left-0 right-0 mt-2 bg-[#181c24] border border-[#333] rounded-2xl shadow-lg z-10 max-h-96 overflow-y-auto animate-fade-in-modal">
            {loading ? (
              <div className="p-4 text-gray-400 text-center">Recherche...</div>
            ) : (
              <>
                {/* Utilisateurs */}
                <div>
                  <div className="px-4 pt-3 pb-1 text-green-400 font-bold text-sm">Utilisateurs</div>
                  {userResults.length === 0 ? (
                    <div className="p-4 text-gray-400 text-center">Aucun utilisateur trouvé</div>
                  ) : (
                    userResults.map((user) => (
                      <button
                        key={"user-" + user.id}
                        onMouseDown={() => handleUserClick(user.pseudo)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#23272f] transition rounded-xl w-full text-left"
                        tabIndex={-1}
                        type="button"
                        style={{ background: "none", border: "none" }}
                      >
                        <img
                          src={user.profile_picture || "/default-avatar.png"}
                          alt={user.pseudo}
                          className="w-10 h-10 rounded-full object-cover border border-[#333]"
                        />
                        <div>
                          <div className="font-semibold text-green-400">@{user.pseudo}</div>
                          {user.first_name && (
                            <div className="text-gray-300 text-sm">{user.first_name} {user.last_name}</div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {/* Catégories */}
                <div>
                  <div className="px-4 pt-3 pb-1 text-blue-400 font-bold text-sm">Catégories</div>
                  {categoryResults.length === 0 ? (
                    <div className="p-4 text-gray-400 text-center">Aucune catégorie trouvée</div>
                  ) : (
                    categoryResults.map((cat) => (
                      <button
                        key={"cat-" + cat.id}
                        onMouseDown={() => handleCategoryClick(cat.id)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#23272f] transition rounded-xl w-full text-left"
                        tabIndex={-1}
                        type="button"
                        style={{ background: "none", border: "none" }}
                      >
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-900 text-blue-300 font-bold text-lg border border-[#333]">
                          #
                        </div>
                        <div>
                          <div className="font-semibold text-blue-300">{cat.name}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
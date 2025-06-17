"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown } from "@fortawesome/free-solid-svg-icons";

export default function ClassementPage() {
  const { data: session, status } = useSession();
  const [topUsers, setTopUsers] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000';

  useEffect(() => {
    async function fetchClassement() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/classement/top10`);
        const data = await res.json();
        setTopUsers(data.top10 || []);

        if (session?.user?.id) {
          const resRank = await fetch(`${API_URL}/api/classement/user/${session.user.id}`);
          const dataRank = await resRank.json();
          setUserRank(dataRank.rank);
        }
      } catch (e) {
        console.error('Erreur lors du fetch du classement:', e);
        setTopUsers([]);
        setUserRank(null);
      }
      setLoading(false);
    }
    if (status === "authenticated") fetchClassement();
  }, [session, status, API_URL]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#90EE90]"></div>
      </div>
    );
  }

  const gold = "#FFD700";
  const silver = "#C0C0C0";
  const bronze = "#CD7F32";
  const green = "#90EE90";
  const podium = topUsers.slice(0, 3);
  const others = topUsers.slice(3);

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col items-center">
      <main className="w-full max-w-2xl px-2 sm:px-4 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#90EE90] mb-8 text-center tracking-tight">
          🏆 Classement des utilisateurs
        </h1>
        <section className="bg-[#1b1b1b] bg-opacity-80 rounded-2xl shadow-xl p-4 sm:p-8 mb-10 w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-[#90EE90] mb-6 text-center">Top 10 des plus suivis</h2>
          <div className="flex justify-center items-end gap-2 sm:gap-8 mb-12 w-full relative">
            {podium[1] && (
              <div className="flex flex-col items-center w-20 sm:w-28 z-10 relative">
                {session?.user?.id === podium[1].id && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#90EE90] text-[#181c24] text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    Vous
                  </span>
                )}
                <div className="relative mb-2">
                  <img
                    src={podium[1].profile_picture || "/default-avatar.png"}
                    alt={podium[1].pseudo}
                    className="w-14 sm:w-20 h-14 sm:h-20 rounded-full object-cover border-4"
                    style={{ borderColor: silver, background: "#23272f" }}
                  />
                </div>
                <div
                  className="w-10 sm:w-14 h-16 sm:h-24 rounded-t-md flex items-end justify-center border-b-4 shadow-md relative"
                  style={{
                    background: silver,
                    borderBottomColor: "#a8a8a8"
                  }}
                />
                <span
                  className="font-semibold mt-2 truncate max-w-[80px] text-center"
                  style={{
                    color: session?.user?.id === podium[1].id ? green : undefined,
                  }}
                >
                  {podium[1].pseudo}
                </span>
                <span className="text-xs text-gray-400">{podium[1].followers_count} followers</span>
              </div>
            )}
            {podium[0] && (
              <div className="flex flex-col items-center w-24 sm:w-36 z-20 relative">
                {session?.user?.id === podium[0].id && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#90EE90] text-[#181c24] text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    Vous
                  </span>
                )}
                <FontAwesomeIcon icon={faCrown} className="mb-2" style={{ color: gold, fontSize: "2rem" }} />
                <div className="relative mb-2">
                  <img
                    src={podium[0].profile_picture || "/default-avatar.png"}
                    alt={podium[0].pseudo}
                    className="w-20 sm:w-28 h-20 sm:h-28 rounded-full object-cover border-4"
                    style={{ borderColor: gold, background: "#23272f" }}
                  />
                </div>
                <div
                  className="w-12 sm:w-20 h-24 sm:h-36 rounded-t-md flex items-end justify-center border-b-4 shadow-lg relative"
                  style={{
                    background: gold,
                    borderBottomColor: "#bfa900"
                  }}
                />
                <span
                  className="font-semibold mt-2 truncate max-w-[100px] text-center"
                  style={{
                    color: session?.user?.id === podium[0].id ? green : gold,
                  }}
                >
                  {podium[0].pseudo}
                </span>
                <span className="text-xs text-gray-400">{podium[0].followers_count} followers</span>
              </div>
            )}
            {podium[2] && (
              <div className="flex flex-col items-center w-16 sm:w-24 z-10 relative">
                {session?.user?.id === podium[2].id && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#90EE90] text-[#181c24] text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    Vous
                  </span>
                )}
                <div className="relative mb-2">
                  <img
                    src={podium[2].profile_picture || "/default-avatar.png"}
                    alt={podium[2].pseudo}
                    className="w-12 sm:w-16 h-12 sm:h-16 rounded-full object-cover border-4"
                    style={{ borderColor: bronze, background: "#23272f" }}
                  />
                </div>
                <div
                  className="w-8 sm:w-12 h-12 sm:h-20 rounded-t-md flex items-end justify-center border-b-4 shadow-md relative"
                  style={{
                    background: bronze,
                    borderBottomColor: "#8c5a2b"
                  }}
                />
                <span
                  className="font-semibold mt-2 truncate max-w-[60px] text-center"
                  style={{
                    color: session?.user?.id === podium[2].id ? green : bronze,
                  }}
                >
                  {podium[2].pseudo}
                </span>
                <span className="text-xs text-gray-400">{podium[2].followers_count} followers</span>
              </div>
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-16 bg-[#90EE90]/10 rounded-full blur-2xl z-0" />
          </div>

          <ol className="space-y-2 sm:space-y-4">
            {others.map((user, idx) => (
              <li
                key={user.id}
                className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-xl ${
                  session?.user?.id === user.id
                    ? "bg-[#90EE90]/20 border border-[#90EE90]"
                    : "bg-[#333]/50"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-2xl font-bold text-[#90EE90] w-6 sm:w-8 text-center">{idx + 4}</span>
                  <img
                    src={user.profile_picture || "/default-avatar.png"}
                    alt={user.pseudo}
                    className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover border border-[#90EE90]"
                  />
                  <span
                    className="font-semibold truncate max-w-[100px]"
                    style={{
                      color: session?.user?.id === user.id ? green : undefined,
                    }}
                  >
                    {user.pseudo}
                  </span>
                </div>
                <span className="text-[#90EE90] font-bold text-xs sm:text-base">{user.followers_count} followers</span>
              </li>
            ))}
          </ol>
        </section>

        {userRank && userRank.rank > 10 && (
          <section className="bg-[#181c24] rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col items-center border border-[#90EE90] w-full">
            <h3 className="text-lg sm:text-xl font-bold text-[#90EE90] mb-2">Votre classement</h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-lg sm:text-2xl font-bold text-[#90EE90]">{userRank.rank}</span>
              <img
                src={userRank.profile_picture || "/default-avatar.png"}
                alt={userRank.pseudo}
                className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover border border-[#90EE90]"
              />
              <span className="font-semibold" style={{ color: green }}>{userRank.pseudo}</span>
            </div>
            <span className="text-[#90EE90] font-bold mt-2 text-xs sm:text-base">{userRank.followers_count} followers</span>
          </section>
        )}
      </main>
    </div>
  );
}
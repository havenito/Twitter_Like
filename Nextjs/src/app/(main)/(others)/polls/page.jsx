"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";
const PAGE_SIZE = 3;

const getUserId = () => parseInt(localStorage.getItem("user_id"), 10);

export default function PollsPage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem("user_id", session.user.id);
    }
  }, [session]);

  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPolls = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/polls?page=${pageNum}&limit=${PAGE_SIZE}`);
      const data = await res.json();
      setPolls(data.polls || []);
      setTotalPages(data.total_pages || 1);
    } catch {
      setPolls([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolls(page);
  }, [page]);

  const handleVote = async (pollId, optionIdx) => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option: optionIdx, user_id: getUserId() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors du vote");
        return;
      }
      setSelectedPoll(data.poll);
    } catch (err) {
      setError("Erreur lors du vote");
    }
  };

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const handleOptionChange = (i, value) => {
    const newOptions = [...options];
    newOptions[i] = value;
    setOptions(newOptions);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userId = getUserId();
      if (!userId) {
        setError("Utilisateur non connecté.");
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/api/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          options: options.filter(o => o.trim()),
          user_id: userId,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création du sondage");
      setQuestion("");
      setOptions(["", ""]);
      setShowCreate(false);
      fetchPolls(1);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Styles personnalisés ---
  const mainBg = "bg-[#1f1f1f]";
  const cardBg = "bg-[#23272f]";
  const accent = "#90EE90";
  const border = "border-[#23272f]/60";
  const shadow = "shadow-2xl";
  const textAccent = { color: accent };
  const btnBase = "rounded-full font-bold transition-all duration-200";
  const btnAccent = `${btnBase} bg-[#90EE90] text-[#181c24] hover:bg-[#b6ffc7]`;
  const btnOutline = `${btnBase} border border-[#90EE90] text-[#90EE90] hover:bg-[#23272f] hover:text-[#b6ffc7]`;

  return (
    <div className={`${mainBg} min-h-screen py-10 px-2`}>
      <h2 className="text-4xl font-extrabold mb-10 text-center" style={textAccent}>
        <span className="tracking-tight drop-shadow-lg">Sondages Minouverse</span>
      </h2>
      {!selectedPoll && !showCreate && (
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setShowCreate(true)}
            className={`${btnAccent} px-8 py-3 text-lg shadow-lg`}
          >
            + Créer un sondage
          </button>
        </div>
      )}
      {showCreate ? (
        <form onSubmit={handleCreate} className={`${cardBg} ${shadow} border ${border} p-10 rounded-3xl max-w-xl mx-auto`}>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className={`${btnOutline} mb-8 px-6 py-2`}
          >
            ← Retour à la liste
          </button>
          <label className="block text-xl mb-2 font-semibold" style={textAccent}>Question</label>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full mb-6 px-5 py-3 rounded-2xl bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#90EE90]/40"
            style={{ borderColor: "#333" }}
            required
          />
          <label className="block text-xl mb-2 font-semibold" style={textAccent}>Options</label>
          {options.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={e => handleOptionChange(i, e.target.value)}
              className="w-full mb-3 px-5 py-3 rounded-2xl bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#90EE90]/40"
              style={{ borderColor: "#333" }}
              required
              placeholder={`Option ${i + 1}`}
            />
          ))}
          {options.length < 6 && (
            <button type="button" onClick={addOption} className={`${btnAccent} mb-6 px-4 py-2`}>
              + Ajouter une option
            </button>
          )}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <button type="submit" disabled={loading} className={`${btnAccent} w-full py-3 text-lg`}>
            {loading ? "Création..." : "Créer le sondage"}
          </button>
        </form>
      ) : !selectedPoll ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-center">
            {polls.map((poll) => (
              <div key={poll.id} className={`${cardBg} ${shadow} rounded-3xl p-6 flex flex-col items-center hover:scale-[1.03] transition-transform duration-200`}>
                <div className="w-full h-32 bg-[#181c24] rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-5xl">🐾</span>
                </div>
                <div className="font-bold text-lg mb-2 text-center" style={textAccent}>{poll.question}</div>
                <div className="text-xs text-gray-400 mb-4">{poll.options.length} options</div>
                <button
                  onClick={() => setSelectedPoll(poll)}
                  className={`${btnAccent} w-full py-2 mt-auto`}
                >
                  Voir Sondage
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`${btnOutline} px-6 py-2`}
            >
              Précédent
            </button>
            <span className="text-[#90EE90] font-semibold text-lg">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`${btnOutline} px-6 py-2`}
            >
              Suivant
            </button>
          </div>
        </>
      ) : (
        <div className={`${cardBg} ${shadow} rounded-3xl p-8 flex flex-col items-center w-full max-w-lg mx-auto`}>
          <button
            onClick={() => setSelectedPoll(null)}
            className={`${btnOutline} mb-8 px-6 py-2 self-start`}
          >
            ← Retour à la liste
          </button>
          <div className="font-bold text-2xl mb-6 text-center" style={textAccent}>{selectedPoll.question}</div>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="flex flex-wrap gap-4 justify-center mb-8 w-full">
            {selectedPoll.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200
                  ${selectedOption === idx
                    ? "shadow-lg bg-[#90EE90] text-[#181c24] scale-105"
                    : "border border-[#90EE90] bg-[#181c24] text-[#90EE90] hover:bg-[#23272f] hover:text-[#b6ffc7]"}
                `}
                style={{ borderColor: "#90EE90" }}
              >
                {opt}
              </button>
            ))}
          </div>
          <button
            disabled={selectedOption === null}
            onClick={() => handleVote(selectedPoll.id, selectedOption)}
            className={`${btnAccent} w-full py-3 text-lg mb-8`}
            style={{
              opacity: selectedOption === null ? 0.6 : 1,
              cursor: selectedOption === null ? "not-allowed" : "pointer"
            }}
          >
            Valider
          </button>
          <div className="flex flex-col items-center w-full">
            <div className="flex gap-4 justify-center w-full mb-4">
              {selectedPoll.options.map((opt, idx) => {
                const totalVotes = selectedPoll.votes.reduce((a, b) => a + b, 0) || 1;
                const percent = Math.round((selectedPoll.votes[idx] / totalVotes) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center w-20">
                    <div
                      className="relative flex items-end justify-center h-32 w-full bg-[#181c24] rounded-t-xl overflow-hidden"
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-500"
                        style={{
                          background: accent,
                          height: `${percent}%`,
                          minHeight: 8,
                          boxShadow: selectedOption === idx ? "0 0 12px #90EE90" : undefined
                        }}
                      />
                      {selectedOption === idx && (
                        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full shadow">
                          Votre choix
                        </span>
                      )}
                    </div>
                    <span className="mt-2 font-semibold text-sm text-center" style={textAccent}>{opt}</span>
                    <span className="text-xs text-gray-300">{selectedPoll.votes[idx]} vote(s)</span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-400">{selectedPoll.votes.reduce((a, b) => a + b, 0)} vote(s) au total</div>
          </div>
        </div>
      )}
    </div>
  );
}
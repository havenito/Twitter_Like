"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";
const PAGE_SIZE = 3;

const getUserId = () => {
  return parseInt(localStorage.getItem("user_id"), 10);
};

export default function PollsPage() {
  const { data: session } = useSession();

  // Synchronise le user_id du localStorage avec la session NextAuth
  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem("user_id", session.user.id);
    }
    // Si NextAuth stocke l'id dans sub, utilise session.user.sub à la place
    // if (session?.user?.sub) {
    //   localStorage.setItem("user_id", session.user.sub);
    // }
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
    setError(""); // reset error
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
      // Met à jour le sondage sélectionné
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

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h2 className="text-3xl font-extrabold" style={{ color: "#90EE90" }}>Sondages</h2>
      {!selectedPoll && !showCreate && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 rounded-full"
            style={{ background: "#90EE90", color: "#181c24", fontWeight: "bold" }}
          >
            + Créer un sondage
          </button>
        </div>
      )}
      {showCreate ? (
        <form onSubmit={handleCreate} className="bg-[#23272f] p-8 rounded-2xl shadow-2xl mb-12 border border-[#23272f]/60 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="mb-6 px-4 py-2 rounded-full bg-gray-700"
            style={{ color: "#90EE90", fontWeight: "bold" }}
          >
            ← Retour à la liste
          </button>
          <label className="block text-lg mb-2 font-semibold" style={{ color: "#90EE90" }}>Question</label>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full mb-4 px-4 py-2 rounded-xl bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2"
            style={{ borderColor: "#333" }}
            required
          />
          <label className="block text-lg mb-2 font-semibold" style={{ color: "#90EE90" }}>Options</label>
          {options.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={e => handleOptionChange(i, e.target.value)}
              className="w-full mb-2 px-4 py-2 rounded-xl bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2"
              style={{ borderColor: "#333" }}
              required
              placeholder={`Option ${i + 1}`}
            />
          ))}
          {options.length < 6 && (
            <button type="button" onClick={addOption} className="mb-4 px-4 py-2 rounded-xl font-bold"
              style={{ background: "#90EE90", color: "#181c24" }}>
              + Ajouter une option
            </button>
          )}
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-2 rounded-xl font-bold"
            style={{ background: "#90EE90", color: "#181c24" }}>
            {loading ? "Création..." : "Créer le sondage"}
          </button>
        </form>
      ) : !selectedPoll ? (
        <>
          <div className="flex flex-wrap gap-8 justify-center">
            {polls.map((poll) => (
              <div key={poll.id} className="bg-[#23272f] rounded-2xl shadow-xl p-4 w-80 flex flex-col items-center">
                <div className="w-full h-32 bg-[#181c24] rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-5xl">🐾</span>
                </div>
                <div className="font-bold text-lg mb-2 text-center" style={{ color: "#90EE90" }}>{poll.question}</div>
                <div className="text-xs text-gray-400 mb-4">{poll.options.length} options</div>
                <button
                  onClick={() => setSelectedPoll(poll)}
                  className="w-full py-2 rounded-full font-bold"
                  style={{ background: "#90EE90", color: "#181c24" }}
                >
                  Voir Sondage
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded bg-[#23272f] border border-[#90EE90] text-[#90EE90] font-bold disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-[#90EE90] font-semibold">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded bg-[#23272f] border border-[#90EE90] text-[#90EE90] font-bold disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </>
      ) : (
        <div className="bg-[#23272f] rounded-2xl shadow-xl p-6 flex flex-col items-center w-full max-w-md mx-auto">
          <button
            onClick={() => setSelectedPoll(null)}
            className="mb-6 px-4 py-2 rounded-full bg-gray-700 self-start"
            style={{ color: "#90EE90", fontWeight: "bold" }}
          >
            ← Retour à la liste
          </button>
          <div className="font-bold text-lg mb-4 text-center" style={{ color: "#90EE90" }}>{selectedPoll.question}</div>
          {error && <div className="text-red-400 mb-2">{error}</div>}
          <div className="flex flex-wrap gap-4 justify-center mb-6 w-full">
            {selectedPoll.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={`px-6 py-2 rounded-full font-semibold transition
                  ${selectedOption === idx
                    ? "shadow-lg"
                    : "border border-[#90EE90] hover:bg-[#90EE90] hover:text-[#181c24]"}
                `}
                style={{
                  background: selectedOption === idx ? "#90EE90" : "#181c24",
                  color: selectedOption === idx ? "#181c24" : "#90EE90",
                  borderColor: "#90EE90"
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          <button
            disabled={selectedOption === null}
            onClick={() => handleVote(selectedPoll.id, selectedOption)}
            className="w-full py-3 rounded-full font-bold text-lg transition"
            style={{
              background: selectedOption !== null ? "#90EE90" : "#23272f",
              color: selectedOption !== null ? "#181c24" : "#90EE90",
              cursor: selectedOption !== null ? "pointer" : "not-allowed"
            }}
          >
            Valider
          </button>
          <div className="flex flex-col items-center w-full mt-6">
            <div className="flex gap-4 justify-center w-full mb-4">
              {selectedPoll.options.map((opt, idx) => {
                const totalVotes = selectedPoll.votes.reduce((a, b) => a + b, 0) || 1;
                const percent = Math.round((selectedPoll.votes[idx] / totalVotes) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center w-16">
                    <div
                      className="relative flex items-end justify-center h-32 w-full bg-[#181c24] rounded-t-xl"
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-xl transition-all"
                        style={{ background: "#90EE90", height: `${percent}%`, minHeight: 8 }}
                      />
                    </div>
                    <span className="mt-2 font-semibold text-sm text-center" style={{ color: "#90EE90" }}>{opt}</span>
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
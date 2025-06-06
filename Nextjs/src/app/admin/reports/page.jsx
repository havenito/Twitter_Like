"use client";
import React, { useState, useEffect, useCallback } from "react";
import ReportsTable from "@/components/Admin/ReportsTable";
import Pagination from "@/components/Admin/Pagination";
import BanModal from "@/components/Admin/BanModal";

const ITEMS_PER_PAGE = 7;

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // Pour le ban modal
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banUserId, setBanUserId] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/signalement`);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    let filtered = reports;
    if (filter === "En attente") filtered = reports.filter(r => r.statut === false);
    else if (filter === "Traités") filtered = reports.filter(r => r.statut === true);
    else if (filter === "Bannis") filtered = reports.filter(r => r.reported_user_is_banned);
    setFilteredReports(filtered);
    setPage(1);
  }, [reports, filter]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleUpdateStatus = async (reportId, newStatus) => {
    const statutBool = newStatus === "Traité";
    try {
      const response = await fetch(`${API_URL}/api/signalement/${reportId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: statutBool }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut");
      fetchReports();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleWarnUser = async (userId) => {
    if (!userId) {
      alert("ID utilisateur non défini pour cet avertissement.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir ajouter un avertissement à cet utilisateur ?")) return;
    try {
      const response = await fetch(`${API_URL}/api/warn/${userId}`, { method: "POST" });
      if (!response.ok) throw new Error("Erreur lors de l'avertissement de l'utilisateur");
      fetchReports();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // Ouvre le modal de ban avec l'id utilisateur
  const openBanModal = (userId) => {
    setBanUserId(userId);
    setBanModalOpen(true);
  };

  // Ban avec durée
  const handleBanUser = async (userId, duration) => {
    setBanModalOpen(false);
    if (!userId) {
      alert("ID utilisateur non défini pour ce bannissement.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/ban/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration }), // durée en jours, 0 = à vie
      });
      if (!response.ok) throw new Error("Erreur lors du bannissement de l'utilisateur");
      fetchReports();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // Déban
  const handleUnbanUser = async (userId) => {
    if (!userId) return;
    if (!window.confirm("Débannir cet utilisateur ?")) return;
    try {
      const response = await fetch(`${API_URL}/api/unban/${userId}`, { method: "POST" });
      if (!response.ok) throw new Error("Erreur lors du débannissement");
      fetchReports();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Chargement des signalements...</div>;
  if (error) return <div className="p-8 text-center text-red-400">Erreur: {error}</div>;

  return (
    <div className="min-h-screen bg-[#181c24] text-gray-200 p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center mb-6">
          <a href="/" className="p-2 rounded-full hover:bg-gray-700 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </a>
          <h1 className="text-3xl font-extrabold text-green-400 drop-shadow-lg">Gestion des signalements</h1>
        </div>
        <div className="flex space-x-3">
          {["Tous", "En attente", "Traités", "Bannis"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors
                ${filter === f ? "bg-green-500 text-white shadow-lg" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <ReportsTable
        reports={paginatedReports}
        handleUpdateStatus={handleUpdateStatus}
        handleWarnUser={handleWarnUser}
        handleBanUser={openBanModal}
        handleUnbanUser={handleUnbanUser}
        filter={filter}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />

      <BanModal
        isOpen={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        onConfirm={(duration) => handleBanUser(banUserId, duration)}
      />

      <footer className="mt-8 text-sm text-gray-500 text-center">
        {reports.filter(r => r.statut === false).length} signalement(s) en attente.
      </footer>
    </div>
  );
}
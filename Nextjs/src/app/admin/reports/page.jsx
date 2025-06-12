"use client";
import React, { useState, useEffect, useCallback } from "react";
import ReportsTable from "@/components/Admin/ReportsTable";
import Pagination from "@/components/Admin/Pagination";
import BanModal from "@/components/Admin/BanModal";
import AdminCategoriesPanel from "@/components/Admin/AdminCategoriesPanel";

const ITEMS_PER_PAGE = 7;

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // Onglet actif : "reports" ou "categories"
  const [adminTab, setAdminTab] = useState("reports");

  // Pour le ban modal
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banUserId, setBanUserId] = useState(null);

  // Pour le modal moderne d'alerte
  const [alert, setAlert] = useState({ message: "", type: "info", isConfirm: false, onConfirm: null });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Inject animation CSS (une seule fois)
  if (typeof window !== "undefined" && !document.getElementById("fade-in-keyframes")) {
    const style = document.createElement("style");
    style.id = "fade-in-keyframes";
    style.innerHTML = `
      @keyframes fade-in-modal {
        from { opacity: 0; transform: scale(0.95);}
        to   { opacity: 1; transform: scale(1);}
      }
      .animate-fade-in-modal { animation: fade-in-modal 0.25s; }
    `;
    document.head.appendChild(style);
  }

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

  // Ajout du nom de l'utilisateur signalé dans une propriété dédiée pour l'affichage
  const reportsWithUserName = paginatedReports.map(report => {
    let reportedUserName = "";
    if (report.reported_user && report.reported_user.pseudo) {
      reportedUserName = report.reported_user.pseudo;
    } else if (report.reported_user_pseudo) {
      reportedUserName = report.reported_user_pseudo;
    }
    if (report.reported_user_id && !report.post_id) {
      return {
        ...report,
        reported_user_display: reportedUserName || report.reported_user_id
      };
    }
    return report;
  });

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
      setAlert({ message: `Erreur: ${err.message}`, type: "error", isConfirm: false });
    }
  };

  // MODAL MODERNE
  const ModernModal = () => (
    alert.message && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div
          className={`relative px-8 py-7 rounded-2xl shadow-2xl text-white font-semibold flex flex-col items-center gap-6 text-lg
            ${alert.type === "success"
              ? "bg-green-600"
              : alert.type === "error"
              ? "bg-[#23272f]"
              : "bg-blue-600"
            } animate-fade-in-modal`}
          style={{ minWidth: 340, maxWidth: "90vw" }}
        >
          <div className="w-full text-center font-bold">{alert.message}</div>
          {alert.isConfirm ? (
            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={alert.onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-bold shadow transition"
              >
                Confirmer
              </button>
              <button
                onClick={() => setAlert({ message: "", type: "info", isConfirm: false })}
                className="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-xl font-bold shadow transition"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAlert({ message: "", type: "info", isConfirm: false })}
              className="absolute top-3 right-5 text-white/80 hover:text-white text-2xl font-bold"
              aria-label="Fermer"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    )
  );

  // WARN avec confirmation moderne
  const handleWarnUser = async (userId) => {
    if (!userId) {
      setAlert({ message: "ID utilisateur non défini pour cet avertissement.", type: "error", isConfirm: false });
      return;
    }
    setAlert({
      message: "Êtes-vous sûr de vouloir ajouter un avertissement à cet utilisateur ?",
      type: "error",
      isConfirm: true,
      onConfirm: async () => {
        setAlert({ message: "", type: "info", isConfirm: false });
        try {
          const response = await fetch(`${API_URL}/api/warn/${userId}`, { method: "POST" });
          if (!response.ok) throw new Error("Erreur lors de l'avertissement de l'utilisateur");
          setAlert({ message: "Avertissement ajouté avec succès.", type: "success", isConfirm: false });
          fetchReports();
        } catch (err) {
          setAlert({ message: `Erreur: ${err.message}`, type: "error", isConfirm: false });
        }
      }
    });
  };

  // Ouvre le modal de ban avec l'id utilisateur
  const openBanModal = (userId) => {
    setBanUserId(userId);
    setBanModalOpen(true);
  };

  // Ban avec confirmation moderne
  const handleBanUser = async (userId, duration) => {
    setBanModalOpen(false);
    if (!userId) {
      setAlert({ message: "ID utilisateur non défini pour ce bannissement.", type: "error", isConfirm: false });
      return;
    }
    setAlert({
      message: `Êtes-vous sûr de vouloir bannir cet utilisateur${duration === 0 ? " à vie" : ` pour ${duration} jour(s)`} ?`,
      type: "error",
      isConfirm: true,
      onConfirm: async () => {
        setAlert({ message: "", type: "info", isConfirm: false });
        try {
          const response = await fetch(`${API_URL}/api/ban/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duration }),
          });
          if (!response.ok) throw new Error("Erreur lors du bannissement de l'utilisateur");
          fetchReports();
        } catch (err) {
          setAlert({ message: `Erreur: ${err.message}`, type: "error", isConfirm: false });
        }
      }
    });
  };

  // Déban avec confirmation moderne
  const handleUnbanUser = async (userId) => {
    if (!userId) return;
    setAlert({
      message: "Débannir cet utilisateur ?",
      type: "error",
      isConfirm: true,
      onConfirm: async () => {
        setAlert({ message: "", type: "info", isConfirm: false });
        try {
          const response = await fetch(`${API_URL}/api/unban/${userId}`, { method: "POST" });
          if (!response.ok) throw new Error("Erreur lors du débannissement");
          fetchReports();
        } catch (err) {
          setAlert({ message: `Erreur: ${err.message}`, type: "error", isConfirm: false });
        }
      }
    });
  };

  // Fermeture auto de l'alerte après 3s si ce n'est pas une confirmation
  useEffect(() => {
    if (
      alert.message &&
      typeof alert.message === "string" &&
      !alert.isConfirm
    ) {
      const timer = setTimeout(() => setAlert({ message: "", type: "info", isConfirm: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (loading) return <div className="p-8 text-center text-white">Chargement des signalements...</div>;
  if (error) return <div className="p-8 text-center text-red-400">Erreur: {error}</div>;

  return (
    <div className="min-h-screen bg-[#181c24] text-gray-200 p-4 md:p-8">
      <ModernModal />
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
              onClick={() => {
                setFilter(f);
                setAdminTab("reports");
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors
                ${filter === f && adminTab === "reports"
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setAdminTab("categories")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors
              ${adminTab === "categories" ? "bg-green-500 text-white shadow-lg" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}`}
          >
            Catégories
          </button>
        </div>
      </header>

      {adminTab === "reports" && (
        <>
          <ReportsTable
            reports={reportsWithUserName}
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
        </>
      )}

      {adminTab === "categories" && (
        <AdminCategoriesPanel />
      )}
    </div>
  );
}
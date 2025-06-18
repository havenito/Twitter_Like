"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ReportsTable from '../../../components/Admin/ReportsTable';
import AdminCategoriesPanel from '../../../components/Admin/AdminCategoriesPanel';
import BanModal from '../../../components/Admin/BanModal';
import Pagination from '../../../components/Admin/Pagination';

const ITEMS_PER_PAGE = 7;

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filter, setFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const [adminTab, setAdminTab] = useState("reports");

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banUserId, setBanUserId] = useState(null);

  const [alert, setAlert] = useState({ message: "", type: "info", isConfirm: false, onConfirm: null });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.roles !== 'admin') {
      router.push('/home');
      return;
    }
  }, [session, status, router]);

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
      const response = await fetch(`${API_URL}/api/signalements`);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const data = await response.json();
      console.log("Données reçues:", data);
      
      const reportsWithUserInfo = data.map(report => {
        let contenu_signale_preview = "";
        
        if (report.post_id) {
          contenu_signale_preview = "Post signalé";
        } else if (report.comment_id) {
          contenu_signale_preview = "Commentaire signalé";
        } else if (report.reported_user_id) {
          contenu_signale_preview = "Utilisateur signalé";
        }

        return {
          ...report,
          contenu_signale_preview,
          reported_user: report.reported_user_pseudo ? {
            pseudo: report.reported_user_pseudo
          } : null
        };
      });
      
      setReports(reportsWithUserInfo);
    } catch (err) {
      console.error("Erreur lors de la récupération des signalements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => { 
    if (session?.user?.roles === 'admin') {
      fetchReports(); 
    }
  }, [fetchReports, session]);

  useEffect(() => {
    let filtered = reports;
    if (filter === "En attente") filtered = reports.filter(r => r.statut === false);
    else if (filter === "Traités") filtered = reports.filter(r => r.statut === true);
    else if (filter === "Bannis") filtered = reports.filter(r => r.reported_user_is_banned === true);
    setFilteredReports(filtered);
    setPage(1);
  }, [reports, filter]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const reportsWithUserName = paginatedReports.map(report => {
    let reportedUserName = "";
    if (report.reported_user && report.reported_user.pseudo) {
      reportedUserName = `@${report.reported_user.pseudo}`;
    } else if (report.reported_user_pseudo) {
      reportedUserName = `@${report.reported_user_pseudo}`;
    }
    if (report.reported_user_id && !report.post_id) {
      reportedUserName = reportedUserName || `Utilisateur ID: ${report.reported_user_id}`;
    }

    let reporterUserName = "";
    if (report.reporter_pseudo) {
      reporterUserName = `@${report.reporter_pseudo}`;
    } else if (report.reporter_id) {
      reporterUserName = `Utilisateur ID: ${report.reporter_id}`;
    } else {
      reporterUserName = "N/A";
    }

    return {
      ...report,
      reported_user_display: reportedUserName,
      reporter_display: reporterUserName, 
    };
  });

  const handleUpdateStatus = async (reportId, newStatus) => {
    const statutBool = newStatus === "Traité";
    try {
      const response = await fetch(`${API_URL}/api/signalement/${reportId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: statutBool })
      });
      if (response.ok) {
        setAlert({ message: `Statut mis à jour: ${newStatus}`, type: "success", isConfirm: false });
        fetchReports();
      } else {
        throw new Error("Échec de la mise à jour");
      }
    } catch (error) {
      setAlert({ message: `Erreur: ${error.message}`, type: "error", isConfirm: false });
    }
  };

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

  const handleWarnUser = async (userId) => {
    setAlert({
      message: "Êtes-vous sûr de vouloir donner un avertissement à cet utilisateur ?",
      type: "info",
      isConfirm: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/api/warn/${userId}`, { method: "POST" });
          if (response.ok) {
            const data = await response.json();
            setAlert({ 
              message: `Avertissement donné. Total: ${data.warn_count}/3${data.is_banned ? " (Utilisateur banni automatiquement)" : ""}`, 
              type: "success", 
              isConfirm: false 
            });
            fetchReports();
          } else {
            throw new Error("Échec de l'avertissement");
          }
        } catch (error) {
          setAlert({ message: `Erreur: ${error.message}`, type: "error", isConfirm: false });
        }
      }
    });
  };

  const openBanModal = (userId) => {
    setBanUserId(userId);
    setBanModalOpen(true);
  };

  const handleBanUser = async (userId, duration) => {
    setBanModalOpen(false);
    try {
      const response = await fetch(`${API_URL}/api/ban/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration })
      });
      if (response.ok) {
        setAlert({ 
          message: duration === 0 ? "Utilisateur banni définitivement" : `Utilisateur banni pour ${duration} jour(s)`, 
          type: "success", 
          isConfirm: false 
        });
        fetchReports();
      } else {
        throw new Error("Échec du bannissement");
      }
    } catch (error) {
      setAlert({ message: `Erreur: ${error.message}`, type: "error", isConfirm: false });
    }
  };

  const handleUnbanUser = async (userId) => {
    setAlert({
      message: "Êtes-vous sûr de vouloir débannir cet utilisateur ?",
      type: "info",
      isConfirm: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/api/unban/${userId}`, { method: "POST" });
          if (response.ok) {
            setAlert({ message: "Utilisateur débanni avec succès", type: "success", isConfirm: false });
            fetchReports();
          } else {
            throw new Error("Échec du débannissement");
          }
        } catch (error) {
          setAlert({ message: `Erreur: ${error.message}`, type: "error", isConfirm: false });
        }
      }
    });
  };

  useEffect(() => {
    if (alert.message && !alert.isConfirm) {
      const timer = setTimeout(() => {
        setAlert({ message: "", type: "info", isConfirm: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#181c24] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-400 mb-4 mx-auto"></div>
          <p className="text-gray-400 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.roles !== 'admin') {
    return null;
  }

  if (loading) return <div className="min-h-screen bg-[#181c24] flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-400 mb-4 mx-auto"></div><p className="text-gray-400 text-lg">Chargement des signalements...</p></div></div>;
  if (error) return <div className="min-h-screen bg-[#181c24] flex items-center justify-center text-red-400"><div className="text-center"><p className="text-2xl font-bold mb-4">Erreur</p><p>{error}</p></div></div>;

  return (
    <div className="min-h-screen bg-[#181c24] text-gray-200 p-4 md:p-8">
      <ModernModal />
      <header className="mb-8">
        <div className="flex items-center mb-6">
          <a href="/home" className="p-2 rounded-full hover:bg-gray-700 mr-4">
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
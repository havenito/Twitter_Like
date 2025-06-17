"use client";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/proxy/history");
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        setHistory([]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#181c24] text-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-6">Mon historique</h1>
        {loading ? (
          <div className="text-gray-400">Chargement...</div>
        ) : history.length === 0 ? (
          <div className="text-gray-400">Aucune activité récente.</div>
        ) : (
          <ul className="space-y-4">
            {history.map(item => (
              <li key={item.id} className="bg-[#23272f] rounded-xl p-4 shadow">
                <div className="font-semibold">{item.action} {item.target_type} {item.target_id}</div>
                <div className="text-gray-400 text-sm">{item.timestamp}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
// Nouveau composant BanModal.jsx
import React, { useState } from "react";

const DURATIONS = [
  { label: "1 jour", value: 1 },
  { label: "1 semaine", value: 7 },
  { label: "2 semaines", value: 14 },
  { label: "1 mois", value: 30 },
  { label: "1 an", value: 365 },
  { label: "À vie", value: 0 },
];

export default function BanModal({ isOpen, onClose, onConfirm }) {
  const [duration, setDuration] = useState(1);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-[#23272f] p-8 rounded-2xl shadow-2xl w-full max-w-xs">
        <h2 className="text-lg font-bold mb-4 text-[#90EE90]">Choisir la durée du ban</h2>
        <select
          className="w-full mb-6 px-4 py-2 rounded-xl bg-[#181c24] text-white border border-[#333]"
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        >
          {DURATIONS.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(duration)}
            className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold hover:bg-red-700"
          >
            Bannir
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-2 rounded-xl font-bold hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
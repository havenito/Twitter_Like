"use client";
import React, { useState, useEffect } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function AdminCategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "info", isConfirm: false, onConfirm: null });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/categories`);
    setCategories(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await fetch(`${API_URL}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory, description: newDescription })
    });
    setNewCategory("");
    setNewDescription("");

    fetchCategories();
  };

  const deleteCategory = (id) => {
    setAlert({
      message: "Voulez-vous vraiment supprimer cette catégorie ?",
      type: "error",
      isConfirm: true,
      onConfirm: async () => {
        setAlert({ message: "", type: "info", isConfirm: false });
        await fetch(`${API_URL}/api/categories/${id}`, { method: "DELETE" });
        fetchCategories();
      }
    });
  };

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = async () => {
    await fetch(`${API_URL}/api/categories/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDescription })
    });
    setEditId(null);
    setEditName("");
    setEditDescription("");
    setAlert({ message: "Catégorie modifiée avec succès.", type: "success", isConfirm: false });
    fetchCategories();
  };

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

  return (
    <div className="max-w-3xl mx-auto bg-[#23272f] p-6 rounded-2xl shadow-2xl border border-[#23272f]/60">
      {alert.message && (
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
                  Supprimer
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
      )}

      <h2 className="text-2xl font-extrabold mb-8 text-green-400 drop-shadow-lg flex items-center gap-2">
        <PlusIcon className="w-7 h-7 text-green-400" /> Gestion des catégories
      </h2>
      <div className="mb-8 flex flex-col md:flex-row gap-3 items-stretch">
        <input
          type="text"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          placeholder="Nom de la catégorie"
          className="flex-1 px-4 py-2 rounded-lg bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        />
        <input
          type="text"
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          className="flex-1 px-4 py-2 rounded-lg bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        />
        <button
          onClick={addCategory}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 font-bold text-white shadow-lg transition"
        >
          <PlusIcon className="w-5 h-5" /> Ajouter
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl shadow border border-[#333] bg-[#23272f]">
        <table className="w-full min-w-[600px] text-sm text-left">
          <thead className="bg-[#23272f] text-xs uppercase tracking-wider border-b border-[#333]">
            <tr>
              <th className="py-3 px-4">Nom</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400">Chargement...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400">Aucune catégorie.</td>
              </tr>
            ) : categories.map(cat => (
              <tr
                key={cat.id}
                className="border-b border-[#333] hover:bg-[#1a1d22]/60 transition-colors"
              >
                <td className="py-3 px-4 font-semibold">
                  {editId === cat.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="px-2 py-1 rounded bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td className="py-3 px-4">
                  {editId === cat.id ? (
                    <input
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="px-2 py-1 rounded bg-[#181c24] text-white border border-[#333] focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  ) : (
                    <span className={cat.description ? "" : "text-gray-400 italic"}>
                      {cat.description || "Aucune"}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 flex gap-2 justify-center">
                  {editId === cat.id ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="flex items-center gap-1 bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-lg text-white font-semibold shadow transition"
                        title="Enregistrer"
                      >
                        <CheckIcon className="w-4 h-4" /> Enregistrer
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-lg text-white font-semibold shadow transition"
                        title="Annuler"
                      >
                        <XMarkIcon className="w-4 h-4" /> Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(cat)}
                        className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-400 px-3 py-1 rounded-lg text-white font-semibold shadow transition"
                        title="Modifier"
                      >
                        <PencilSquareIcon className="w-4 h-4" /> Modifier
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="flex items-center gap-1 bg-red-500 hover:bg-red-400 px-3 py-1 rounded-lg text-white font-semibold shadow transition"
                        title="Supprimer"
                      >
                        <TrashIcon className="w-4 h-4" /> Supprimer
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
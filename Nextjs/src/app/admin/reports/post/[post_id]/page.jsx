"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';

export default function PostSignalementPage() {
  const { post_id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérification des autorisations admin
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

  useEffect(() => {
    if (session?.user?.roles === 'admin' && post_id) {
      fetch(`http://localhost:5000/api/posts/${post_id}`)
        .then(res => res.json())
        .then(data => {
          setPost(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Erreur lors du chargement du post:', error);
          setLoading(false);
        });
    }
  }, [post_id, session]);

  // Ne pas afficher le contenu si l'utilisateur n'est pas admin
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
    return null; // Le layout s'occupe de la redirection
  }

  if (loading) return <div className="p-8 text-center text-white">Chargement du post...</div>;
  if (!post || post.error) return <div className="p-8 text-center text-red-400">Post introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#181c24] text-gray-200 p-8">
      <button
        className="mb-6 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
        onClick={() => router.push('/admin/reports')}
      >
        Retour
      </button>
      <div className="bg-[#23272f] rounded-xl shadow-xl p-8 max-w-2xl mx-auto border border-[#23272f]/60">
        <h2 className="text-2xl font-bold mb-4 text-green-400">Post signalé #{post.id}</h2>
        <div className="mb-2">
          <span className="font-semibold">Auteur :</span> {post.user_pseudo || "N/A"}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Date :</span> {post.published_at || post.created_at}
        </div>
        {post.title && (
          <div className="mb-2">
            <span className="font-semibold">Titre :</span> {post.title}
          </div>
        )}
        <div className="mb-2">
          <span className="font-semibold">Contenu :</span>
          <div className="mt-2 p-4 bg-gray-800 rounded">{post.content}</div>
        </div>
        {post.media && post.media.length > 0 && (
          <div className="mb-2">
            <span className="font-semibold">Médias :</span>
            <div className="flex flex-wrap gap-3 mt-2">
              {post.media.map((m) => (
                <div key={m.id} className="rounded overflow-hidden border border-gray-700 bg-gray-900 p-2">
                  {m.type.startsWith("image") ? (
                    <img src={m.url} alt="media" className="max-w-[200px] max-h-[200px]" />
                  ) : (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                      Voir le média
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 text-xs text-gray-500">ID du post : {post.id}</div>
      </div>
    </div>
  );
}
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CategoryPostsPage() {
  const params = useParams();
  const categoryId = params.categoryId;
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryAndPosts = async () => {
      setLoading(true);
      try {
        // Récupérer la catégorie
        const catRes = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories/${categoryId}`);
        const catData = await catRes.json();
        setCategory(catData);

        // Récupérer les posts de la catégorie
        const postsRes = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories/${categoryId}/posts`);
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      } catch (err) {
        setCategory(null);
        setPosts([]);
      }
      setLoading(false);
    };
    if (categoryId) fetchCategoryAndPosts();
  }, [categoryId]);

  return (
    <div className="min-h-screen bg-[#181c24] text-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/search" className="text-green-400 hover:underline mb-4 inline-block">&larr; Retour à la recherche</Link>
        {loading ? (
          <div className="text-gray-400 py-12 text-center">Chargement...</div>
        ) : !category ? (
          <div className="text-red-400 py-12 text-center">Catégorie introuvable</div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-green-400 mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-gray-300 mb-6">{category.description}</p>
            )}
            <h2 className="text-xl font-semibold mb-4">Posts dans cette catégorie</h2>
            {posts.length === 0 ? (
              <div className="text-gray-400">Aucun post dans cette catégorie.</div>
            ) : (
              <ul className="space-y-4">
                {posts.map(post => (
                  <li key={post.id} className="bg-[#23272f] rounded-xl p-4 shadow">
                    <Link href={`/${post.user_pseudo || post.user?.pseudo || "user"}/post/${post.id}`}>
                      <div className="font-bold text-lg text-green-300 hover:underline">{post.title}</div>
                    </Link>
                    <div className="text-gray-300 mt-1">{post.content?.slice(0, 120)}{post.content?.length > 120 ? "..." : ""}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Par @{post.user_pseudo || post.user?.pseudo || "?"} • {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
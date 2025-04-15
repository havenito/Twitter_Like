"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PostCard from "./PostCard";

// Sample posts data
const samplePosts = [
  {
    id: 1,
    username: "CatLover123",
    handle: "@catlover123",
    avatar: "/defaultuserpfp.png",
    time: "2h",
    content: "Mon chat adore son nouveau jouet ! #ChatsMignons",
    image: "/wallpaperflare.com_wallpaper (3).jpg",
    likes: 123,
    comments: 14,
    reposts: 7,
  },
  {
    id: 2,
    username: "FélinFan",
    handle: "@felinfan",
    avatar: "/defaultuserpfp.png",
    time: "5h",
    content: "Conseils pour les nouveaux propriétaires de chats : n'oubliez pas de les faire vacciner régulièrement ! #ConseilsVéto",
    likes: 89,
    comments: 27,
    reposts: 32,
  }
];

const FeedPreview = () => {
  return (
    <motion.div 
      className="lg:col-span-2 bg-[#1a1a1a] rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="border-b border-[#333] p-4">
        <h3 className="text-xl font-bold">Fil d'actualités</h3>
      </div>
      
      {/* Sample posts */}
      {samplePosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      
      <div className="p-4 text-center">
        <Link href="/register">
          <button className="text-[#90EE90] hover:underline">
            Inscrivez-vous pour voir plus de contenu
          </button>
        </Link>
      </div>
    </motion.div>
  );
};

export default FeedPreview;
import React from "react";
import { motion } from "framer-motion";
import TrendingTopic from "./TrendingTopic";
import StatsCard from "./StatsCard";

// Mock trending topics
const trendingTopics = [
  { id: 1, tag: "#ChatsMignons", posts: "12.3K posts" },
  { id: 2, tag: "#PhotosDuJour", posts: "8.7K posts" },
  { id: 3, tag: "#AdoptionResponsable", posts: "5.2K posts" },
  { id: 4, tag: "#ConseilsVéto", posts: "3.1K posts" },
  { id: 5, tag: "#MinouverseContest", posts: "2.9K posts" },
];

const TrendingSection = () => {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {/* Trending section */}
      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="border-b border-[#333] p-4">
          <h3 className="text-xl font-bold">Tendances</h3>
        </div>
        
        {trendingTopics.map(topic => (
          <TrendingTopic key={topic.id} topic={topic} />
        ))}
      </div>
      
      {/* Stats section */}
      <StatsCard />
    </motion.div>
  );
};

export default TrendingSection;
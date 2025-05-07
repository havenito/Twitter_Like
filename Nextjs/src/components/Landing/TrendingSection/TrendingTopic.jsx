import React from "react";

const TrendingTopic = ({ topic }) => {
  return (
    <div className="p-4 border-b border-[#333] hover:bg-[#222] transition-colors duration-200">
      <p className="font-bold text-[#90EE90]">{topic.tag}</p>
      <p className="text-sm text-gray-500">{topic.posts}</p>
    </div>
  );
};

export default TrendingTopic;
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";

const StatItem = ({ count, label }) => (
  <div>
    <p className="text-3xl font-bold text-[#90EE90]">{count}</p>
    <p className="text-gray-400">{label}</p>
  </div>
);

const StatsCard = () => {
  const stats = [
    { count: "1M+", label: "Utilisateurs" },
    { count: "5M+", label: "Publications" },
    { count: "50K+", label: "Discussions quotidiennes" }
  ];

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <FontAwesomeIcon icon={faChartLine} className="text-[#90EE90] mr-2" />
        Statistiques
      </h3>
      
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <StatItem key={index} count={stat.count} label={stat.label} />
        ))}
      </div>
    </div>
  );
};

export default StatsCard;
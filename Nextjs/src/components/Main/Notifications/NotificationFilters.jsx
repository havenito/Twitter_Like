"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const NotificationFilters = ({ filters, activeFilter, onFilterChange }) => {
  return (
    <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm sm:text-base flex items-center">
          <FontAwesomeIcon icon={filters.find(f => f.id === 'all')?.icon} className="mr-2 text-[#90EE90] text-xs sm:text-sm" />
          Filtrer les notifications
        </h3>
        <span className="text-xs text-gray-500">
          {filters.find(f => f.id === activeFilter)?.count || 0} notification{(filters.find(f => f.id === activeFilter)?.count || 0) !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2.5 font-medium text-xs sm:text-sm rounded-lg transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 ${
              activeFilter === filter.id 
                ? 'bg-[#90EE90] bg-opacity-20 text-[#90EE90] border border-[#90EE90] border-opacity-50' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2a2a] border border-transparent'
            }`}
          >
            <FontAwesomeIcon icon={filter.icon} className="text-xs" />
            <span className="hidden sm:block">{filter.label}</span>
            <span className="block sm:hidden">{filter.label.slice(0, 3)}</span>
            {filter.count > 0 && (
              <span className="bg-gray-600 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[20px] text-center">
                {filter.count > 99 ? '99+' : filter.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default NotificationFilters;
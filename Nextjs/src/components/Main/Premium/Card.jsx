import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faLock } from '@fortawesome/free-solid-svg-icons';

const Card = ({ 
  plan, 
  isSelected, 
  isCurrent, 
  onClick, 
  onSubscribe, 
  className = '', 
  isDisabled = false 
}) => {
  const cardVariants = {
    normal: { scale: 1, zIndex: 1 },
    selected: { scale: 1.05, zIndex: 10 },
  };

  return (
    <motion.div
      variants={cardVariants}
      animate={isSelected ? 'selected' : 'normal'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onClick={!isCurrent && !isDisabled ? onClick : undefined}
      className={`relative flex flex-col p-6 rounded-xl shadow-lg transition-colors duration-300 ${
        isCurrent 
          ? 'bg-[#3a3a3a] border-2 border-[#90EE90] cursor-default' 
          : isDisabled 
            ? 'bg-[#1a1a1a] border border-[#333] cursor-not-allowed opacity-60'
            : isSelected 
              ? 'bg-[#3a3a3a] border-2 border-[#90EE90] cursor-pointer' 
              : 'bg-[#2a2a2a] border border-[#444] cursor-pointer hover:bg-[#333]'
      } ${className}`}
    >
      {isCurrent && (
        <div className="absolute top-2 right-2 bg-[#90EE90] text-black text-sm font-bold px-2 py-1 rounded-full">
          Actuel
        </div>
      )}
      
      {isDisabled && !isCurrent && (
        <div className="absolute top-2 right-2 bg-[#666] text-gray-300 text-sm font-bold px-2 py-1 rounded-full flex items-center">
          <FontAwesomeIcon icon={faLock} className="mr-1" />
          Bloqué
        </div>
      )}

      <h3 className={`text-2xl font-bold mb-4 ${
        isSelected || isCurrent ? 'text-[#90EE90]' : isDisabled ? 'text-gray-500' : 'text-white'
      }`}>
        {plan.name}
      </h3>
      
      <p className={`mb-4 ${isDisabled ? 'text-gray-500' : 'text-gray-400'}`}>
        {plan.description}
      </p>
      
      <div className="mb-6">
        <span className={`text-4xl font-extrabold ${isDisabled ? 'text-gray-500' : 'text-white'}`}>
          {plan.price}
        </span>
        <span className={`${isDisabled ? 'text-gray-600' : 'text-gray-500'}`}>/mois</span>
      </div>
      
      <ul className={`space-y-2 mb-6 flex-grow ${isDisabled ? 'text-gray-500' : 'text-gray-300'}`}>
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <FontAwesomeIcon 
              icon={faCheckCircle} 
              className={`mr-2 ${isDisabled ? 'text-gray-600' : 'text-[#90EE90]'}`} 
            />
            {feature}
          </li>
        ))}
      </ul>
      
      {!isCurrent && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (plan.id === 'free') {
              console.log('Plan gratuit - pas d\'abonnement nécessaire');
            } else if (onSubscribe && !isDisabled) {
              onSubscribe(plan.id);
            } else if (isDisabled) {
              console.log('Abonnement bloqué - résiliez d\'abord votre abonnement actuel');
            } else {
              console.log(`Souscription à ${plan.name}`);
            }
          }}
          className={`w-full py-2 mt-auto rounded-full font-semibold transition-all duration-300 ${
            isDisabled
              ? 'bg-[#333] text-gray-500 cursor-not-allowed opacity-50'
              : plan.id === 'free'
                ? 'bg-[#444] text-gray-300 cursor-not-allowed opacity-50'
                : isSelected
                  ? 'bg-[#90EE90] text-black hover:bg-[#7CD37C]'
                  : 'bg-[#444] text-gray-300 hover:bg-[#555] hover:text-white'
          }`}
          disabled={plan.id === 'free' || isDisabled}
        >
          {isDisabled 
            ? 'Résilier d\'abord votre abonnement' 
            : plan.id === 'free' 
              ? 'Gratuit' 
              : 'Souscrire à l\'abonnement'
          }
        </button>
      )}
    </motion.div>
  );
};

export default Card;
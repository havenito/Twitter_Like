import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const Card = ({ plan, isSelected, isCurrent, onClick, onSubscribe, className = '' }) => {
  const cardVariants = {
    normal: { scale: 1, zIndex: 1 },
    selected: { scale: 1.05, zIndex: 10 },
  };

  return (
    <motion.div
      variants={cardVariants}
      animate={isSelected ? 'selected' : 'normal'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onClick={!isCurrent ? onClick : undefined} // Désactiver le clic sur cette carte si c'est le plan actuel
      className={`relative flex flex-col p-6 rounded-xl shadow-lg transition-colors duration-300 ${
        isCurrent ? 'bg-[#3a3a3a] border-2 border-[#90EE90] cursor-default' :
        isSelected ? 'bg-[#3a3a3a] border-2 border-[#90EE90] cursor-pointer' : 'bg-[#2a2a2a] border border-[#444] cursor-pointer hover:bg-[#333]'
      } ${className}`}
    >
      {isCurrent && (
        <div className="absolute top-2 right-2 bg-[#90EE90] text-black text-sm font-bold px-2 py-1 rounded-full">
          Actuel
        </div>
      )}
      <h3 className={`text-2xl font-bold mb-4 ${isSelected || isCurrent ? 'text-[#90EE90]' : 'text-white'}`}>
        {plan.name}
      </h3>
      <p className="text-gray-400 mb-4">{plan.description}</p>
      <div className="mb-6">
        <span className="text-4xl font-extrabold text-white">{plan.price}</span>
        <span className="text-gray-500">/mois</span>
      </div>
      <ul className="space-y-2 mb-6 text-gray-300 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="text-[#90EE90] mr-2" />
            {feature}
          </li>
        ))}
      </ul>
      {!isCurrent && ( // Afficher le bouton seulement si ce n'est pas le plan actuel
        <button
          onClick={(e) => {
            e.stopPropagation(); // Empêche le clic sur le bouton de déclencher le onClick de la carte
            if (plan.id === 'free') {
              console.log('Plan gratuit - pas d\'abonnement nécessaire');
            } else if (onSubscribe) {
              onSubscribe(plan.id);
            } else {
              console.log(`Souscription à ${plan.name}`);
            }
          }}
          className={`w-full py-2 mt-auto rounded-full font-semibold transition-all duration-300 ${
            isSelected
              ? 'bg-[#90EE90] text-black hover:bg-[#7CD37C]'
              : 'bg-[#444] text-gray-300 hover:bg-[#555] hover:text-white'
          } ${plan.id === 'free' ? 'cursor-not-allowed opacity-50' : ''}`}
          disabled={plan.id === 'free'}
        >
          {plan.id === 'free' ? 'Gratuit' : 'Souscrire à l\'abonnement'}
        </button>
      )}
    </motion.div>
  );
};

export default Card;
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faGlobe } from '@fortawesome/free-solid-svg-icons';

const UserCard = ({ user }) => {
  const displayName = user.first_name 
    ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`
    : user.pseudo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333] hover:border-[#555] transition-all duration-200"
    >
      <Link href={`/${user.pseudo}`} className="flex items-center">
        <div className="relative">
          <Image
            src={user.profile_picture || '/defaultuserpfp.png'}
            alt={`Photo de profil de ${user.pseudo}`}
            width={50}
            height={50}
            className="rounded-full object-cover"
          />
          <div className="absolute -bottom-1 -right-1 bg-[#1e1e1e] rounded-full p-1 max-h-[20px] max-w-[20px] flex items-center justify-center">
            <FontAwesomeIcon 
              icon={user.private ? faLock : faGlobe} 
              className={`text-xs ${user.private ? 'text-orange-400' : 'text-[#90EE90]'}`}
            />
          </div>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-white font-semibold hover:text-[#90EE90] transition-colors">
            {displayName}
          </h3>
          <p className="text-gray-400 text-sm">@{user.pseudo}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default UserCard;
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faComment, 
  faReply,
  faCheck,
  faTimes,
  faTrash,
  faUserCheck
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';

const NotificationItem = ({ notification, currentUser, onDelete, onFollowRequest }) => {
  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return { icon: faUserCheck, color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'follow_request':
        return { icon: faUserPlus, color: 'text-blue-400', bg: 'bg-blue-500/20' };
      case 'follow_request_accepted':
        return { icon: faUserCheck, color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'comment':
        return { icon: faComment, color: 'text-purple-400', bg: 'bg-purple-500/20' };
      case 'reply':
      case 'reply_to_reply':
        return { icon: faReply, color: 'text-orange-400', bg: 'bg-orange-500/20' };
      default:
        return { icon: faComment, color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }
  };

  const getNotificationText = (notification) => {
    const actor = notification.actor_user;
    const actorName = actor ? 
      (actor.first_name && actor.last_name ? 
        `${actor.first_name} ${actor.last_name}` : 
        actor.pseudo || actor.email) : 
      'Un utilisateur';

    switch (notification.type) {
      case 'follow':
        return `${actorName} a commencé à vous suivre`;
      case 'follow_request':
        return `${actorName} souhaite vous suivre`;
      case 'follow_request_accepted':
        return `${actorName} a accepté votre demande d'abonnement`;
      case 'comment':
        return `${actorName} a commenté votre post`;
      case 'reply':
        return `${actorName} a répondu à votre commentaire`;
      case 'reply_to_reply':
        return `${actorName} a répondu à votre réponse`;
      default:
        return 'Nouvelle notification';
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.post_id && notification.post_data?.user_pseudo) {
      return `/${notification.post_data.user_pseudo}/post/${notification.post_id}`;
    }
    if (notification.actor_user?.pseudo) {
      return `/${notification.actor_user.pseudo}`;
    }
    return null;
  };

  const renderProfilePicture = (user) => {
    if (!user) {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <FontAwesomeIcon icon={faUserPlus} className="text-gray-400" />
        </div>
      );
    }

    const profilePicture = user.profile_picture || user.profilePicture;
    
    if (!profilePicture) {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {(user.first_name?.[0] || user.pseudo?.[0] || '?').toUpperCase()}
          </span>
        </div>
      );
    }

    return (
      <Image
        src={profilePicture}
        alt={`Photo de profil de ${user.first_name || user.pseudo || 'Utilisateur'}`}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover border border-[#555]"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  };

  const renderSubscriptionBadge = (user) => {
    const subscription = user?.subscription || 'free';
    
    if (subscription === 'plus') {
      return (
        <div className="absolute -top-1 -right-1">
          <Image
            src="/plusbadge.png"
            alt="Badge Plus"
            width={16}
            height={16}
            className="w-4 h-4 object-contain"
          />
        </div>
      );
    } else if (subscription === 'premium') {
      return (
        <div className="absolute -top-1 -right-1">
          <Image
            src="/premiumbadge.png"
            alt="Badge Premium"
            width={16}
            height={16}
            className="w-4 h-4 object-contain"
          />
        </div>
      );
    }
    
    return null;
  };

  const handleFollowAction = async (action) => {
    if (!notification.follow_id) return;
    
    setActionLoading(true);
    try {
      await onFollowRequest(notification.follow_id, action);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    onDelete(notification.id);
  };

  const iconData = getNotificationIcon(notification.type);
  const notificationText = getNotificationText(notification);
  const notificationLink = getNotificationLink(notification);

  const content = (
    <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333] hover:bg-[#252525] transition-all duration-200 group">
      <div className="flex items-start space-x-3">
        {/* Icône de type de notification */}
        <div className={`w-10 h-10 ${iconData.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
          <FontAwesomeIcon icon={iconData.icon} className={`${iconData.color}`} />
        </div>

        {/* Photo de profil de l'acteur */}
        <div className="relative flex-shrink-0">
          {renderProfilePicture(notification.actor_user)}
          {renderSubscriptionBadge(notification.actor_user)}
        </div>

        {/* Contenu de la notification */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium leading-relaxed">
                {notificationText}
              </p>
              
              {notification.comment_data?.content && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-1">
                  "{notification.comment_data.content}"
                </p>
              )}
              
              <p className="text-gray-500 text-xs mt-2">
                {formatDate(notification.date)}
              </p>
            </div>

            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
              title="Supprimer la notification"
            >
              <FontAwesomeIcon icon={faTrash} className="text-red-400 text-sm" />
            </button>
          </div>

          {/* Actions pour les demandes de suivi */}
          {notification.type === 'follow_request' && (
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => handleFollowAction('accept')}
                disabled={actionLoading}
                className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-full transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                Accepter
              </button>
              <button
                onClick={() => handleFollowAction('reject')}
                disabled={actionLoading}
                className="flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-full transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTimes} className="mr-1" />
                Refuser
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Si il y a un lien, on wrap dans un Link
  if (notificationLink && notification.type !== 'follow_request') {
    return (
      <Link href={notificationLink}>
        {content}
      </Link>
    );
  }

  return content;
};

export default NotificationItem;
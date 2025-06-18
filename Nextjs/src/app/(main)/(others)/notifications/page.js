"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUserPlus, faComment, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import NotificationFilters from '@/components/Main/Notifications/NotificationFilters';
import NotificationItem from '@/components/Main/Notifications/NotificationItem';
import EmptyNotifications from '@/components/Main/Notifications/EmptyNotifications';
import Notification from '@/components/Notification';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/user_notifications/${session.user.id}`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des notifications');
      }
      
      const data = await response.json();
            
      // Filtrer pour ne garder que les types autorisés
      const allowedTypes = ['follow', 'follow_request', 'follow_request_accepted', 'comment', 'reply', 'reply_to_reply'];
      const filteredData = data.filter(notification => 
        allowedTypes.includes(notification.type)
      );
      
      setNotifications(filteredData);
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, status, router, fetchNotifications]);

  useEffect(() => {
    const filtered = notifications.filter(notification => {
      switch (activeFilter) {
        case 'follows':
          return ['follow', 'follow_request', 'follow_request_accepted'].includes(notification.type);
        case 'comments':
          return ['comment', 'reply', 'reply_to_reply'].includes(notification.type);
        case 'all':
        default:
          return true;
      }
    });
    setFilteredNotifications(filtered);
  }, [notifications, activeFilter]);

  const handleDeleteAll = async () => {
    if (!session?.user?.id || deleteLoading) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/user_notifications/${session.user.id}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        setNotifications([]);
        setNotificationMessage('Toutes les notifications ont été supprimées');
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/user_notifications/${session.user.id}/${notificationId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };

  const handleFollowRequest = async (followId, action) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/follows/${followId}/${action}`,
        { method: 'PUT' }
      );
      
      if (response.ok) {
        // Supprimer la notification de demande de suivi après action
        setNotifications(prev => prev.filter(n => n.follow_id !== followId));
        
        const message = action === 'accept' ? 'Demande acceptée' : 'Demande rejetée';
        setNotificationMessage(message);
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la demande:', error);
    }
  };

  const filters = [
    { id: 'all', label: 'Toutes', icon: faBell, count: notifications.length },
    { 
      id: 'follows', 
      label: 'Suivis', 
      icon: faUserPlus, 
      count: notifications.filter(n => 
        ['follow', 'follow_request', 'follow_request_accepted'].includes(n.type)
      ).length 
    },
    { 
      id: 'comments', 
      label: 'Commentaires', 
      icon: faComment, 
      count: notifications.filter(n => 
        ['comment', 'reply', 'reply_to_reply'].includes(n.type)
      ).length 
    }
  ];

  const centeredNotificationVariants = {
    initial: { opacity: 0, x: -100, y: -50, scale: 0.3 },
    animate: { opacity: 1, x: -100, y: 0, scale: 1 },
    exit: { opacity: 0, x: -100, y: -20, scale: 0.5, transition: { duration: 0.4 } }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90] mb-4 mx-auto"></div>
          <p className="text-gray-400">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#90EE90] bg-opacity-20 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faBell} className="text-[#90EE90] text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-gray-400 text-sm">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <motion.button
              onClick={handleDeleteAll}
              disabled={deleteLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTrashAlt} className="mr-2" />
              {deleteLoading ? 'Suppression...' : 'Tout supprimer'}
            </motion.button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <NotificationFilters 
            filters={filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90EE90] mx-auto mb-4"></div>
              <p className="text-gray-400">Chargement des notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Erreur: {error}</p>
              <button 
                onClick={fetchNotifications}
                className="px-4 py-2 bg-[#90EE90] text-black rounded-full font-semibold hover:bg-[#7CD37C] transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyNotifications activeFilter={activeFilter} />
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NotificationItem
                      notification={notification}
                      currentUser={session?.user}
                      onDelete={handleDeleteNotification}
                      onFollowRequest={handleFollowRequest}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {showNotification && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          <Notification 
            message={notificationMessage}
            type="success"
            onClose={() => setShowNotification(false)}
            variants={centeredNotificationVariants}
          />
        </div>
      )}
    </div>
  );
}
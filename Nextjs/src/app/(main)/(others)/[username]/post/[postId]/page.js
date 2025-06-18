"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import PostCardDetail from '@/components/Main/Post/PostCardDetail';
import CommentForm from '@/components/Main/Post/CommentForm';
import CommentsList from '@/components/Main/Post/CommentsList';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const postId = params?.postId;
  const username = params?.username;
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${postId}`);
        
        if (!response.ok) {
          throw new Error('Post introuvable');
        }
        
        const postData = await response.json();
        
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/profile/${username}`);
        let userData = null;
        
        if (userResponse.ok) {
          userData = await userResponse.json();
        }

        let likesCount = 0;
        try {
          const likesResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${postId}/likes`);
          if (likesResponse.ok) {
            const likesData = await likesResponse.json();
            likesCount = likesData.likes_count || 0;
          }
        } catch (likesError) {
          console.error('Erreur lors de la récupération des likes:', likesError);
        }

        let commentsCount = 0;
        try {
          const commentsResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${postId}/comments`);
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            commentsCount = commentsData.comments?.length || 0;
            setComments(commentsData.comments || []);
          }
        } catch (commentsError) {
          console.error('Erreur lors de la récupération des commentaires:', commentsError);
        }

        let categoryData = null;
        if (postData.category_id != null) {
          try {
            const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories/${postData.category_id}`);
            if (categoryResponse.ok) {
              categoryData = await categoryResponse.json();
            }
          } catch (categoryError) {
            console.error('Erreur lors de la récupération de la catégorie:', categoryError);
          }
        }

        const formattedPost = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          publishedAt: postData.published_at,
          media: postData.media || [],
          likes: likesCount,
          comments: commentsCount,
          user: userData ? {
            id: userData.id,
            pseudo: userData.pseudo,
            firstName: userData.first_name,
            lastName: userData.last_name,
            profilePicture: userData.profile_picture
          } : null,
          category: categoryData ? {
            id: categoryData.id,
            name: categoryData.name,
            description: categoryData.description
          } : null
        };

        setPost(formattedPost);
      } catch (err) {
        console.error('Erreur lors du chargement du post:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, username]);

  const handleCommentAdded = (newComment) => {
    setComments(prev => [newComment, ...prev]);
    setPost(prev => ({
      ...prev,
      comments: (prev?.comments || 0) + 1
    }));
  };

  const handleBackClick = () => {
    const previousPageType = sessionStorage.getItem('previousPageType');
    
    if (previousPageType === 'comment' || previousPageType === 'reply') {
      sessionStorage.removeItem('previousPageType');
      window.location.href = '/home';    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90] mb-4 mx-auto"></div>
          <p className="text-gray-400">Chargement du post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#111] text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <motion.button
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors mb-6"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Retour
          </motion.button>
          
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">Post introuvable</h1>
            <p className="text-gray-400">{error || "Ce post n'existe pas ou a été supprimé."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.button
          onClick={handleBackClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Retour
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PostCardDetail post={post} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {session && (
            <div>
              <h2 className="text-white font-semibold text-lg mb-4">
                Ajouter un commentaire
              </h2>
              <CommentForm 
                postId={postId}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          )}

          <div>
            <CommentsList 
              comments={comments}
              loading={commentsLoading}
              postId={postId}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
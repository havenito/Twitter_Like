"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import PostCardDetail from '@/components/Post/PostCardDetail';
import CommentCardDetail from '@/components/Post/CommentCardDetail';
import ReplyForm from '@/components/Post/ReplyForm';
import RepliesList from '@/components/Post/RepliesList';

export default function CommentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const commentId = params?.commentId;
  const username = params?.username ? decodeURIComponent(params.username) : null;
  
  const [comment, setComment] = useState(null);
  const [originalPost, setOriginalPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasScrolledToComment, setHasScrolledToComment] = useState(false); 

  const commentRef = useRef(null);

  useEffect(() => {
    if (!commentId || !username) return;

    const fetchCommentAndPost = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const commentResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/comments/${commentId}`);
        
        if (!commentResponse.ok) {
          if (commentResponse.status === 404) {
            throw new Error('Commentaire introuvable');
          }
          throw new Error('Erreur lors du chargement du commentaire');
        }
        
        const commentData = await commentResponse.json();
        const foundComment = commentData.comment;
        
        if (!foundComment) {
          throw new Error('Commentaire introuvable');
        }

        if (foundComment.user?.pseudo !== username) {
          throw new Error(`Commentaire introuvable pour cet utilisateur. Attendu: ${username}, Reçu: ${foundComment.user?.pseudo}`);
        }

        setComment(foundComment);
        setReplies(foundComment.replies || []);

        if (foundComment.post_id) {
          try {
            const postResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${foundComment.post_id}`);
            
            if (postResponse.ok) {
              const postData = await postResponse.json();
              
              let postUser = null;
              if (postData.user_id) {
                try {
                  const userResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${postData.user_id}`);
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    postUser = {
                      id: userData.id,
                      pseudo: userData.pseudo,
                      firstName: userData.first_name,
                      lastName: userData.last_name,
                      profilePicture: userData.profile_picture
                    };
                  }
                } catch (userError) {
                  console.error('Erreur lors du chargement de l\'utilisateur du post:', userError);
                }
              }

              let categoryData = null;
              if (postData.category_id) {
                try {
                  const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories/${postData.category_id}`);
                  if (categoryResponse.ok) {
                    categoryData = await categoryResponse.json();
                  }
                } catch (categoryError) {
                  console.error('Erreur lors du chargement de la catégorie:', categoryError);
                }
              }

              let likesCount = 0;
              try {
                const likesResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${postData.id}/likes`);
                if (likesResponse.ok) {
                  const likesData = await likesResponse.json();
                  likesCount = likesData.likes_count || 0;
                }
              } catch (likesError) {
                console.error('Erreur lors du chargement des likes:', likesError);
              }

              let commentsCount = 0;
              try {
                const commentsResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${postData.id}/comments`);
                if (commentsResponse.ok) {
                  const commentsData = await commentsResponse.json();
                  commentsCount = commentsData.comments?.length || 0;
                }
              } catch (commentsError) {
                console.error('Erreur lors du chargement des commentaires:', commentsError);
              }

              const formattedPost = {
                id: postData.id,
                title: postData.title,
                content: postData.content,
                publishedAt: postData.published_at,
                media: postData.media || [],
                likes: likesCount,
                comments: commentsCount,
                user: postUser,
                category: categoryData ? {
                  id: categoryData.id,
                  name: categoryData.name,
                  description: categoryData.description
                } : null
              };

              setOriginalPost(formattedPost);
            }
          } catch (postError) {
            console.error('Erreur lors du chargement du post d\'origine:', postError);
          }
        }

      } catch (err) {
        console.error('Erreur lors du chargement du commentaire:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommentAndPost();
  }, [commentId, username]);

  useEffect(() => {
    if (!loading && comment && commentRef.current && !hasScrolledToComment) {
      const timer = setTimeout(() => {
        const element = commentRef.current;
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetTop = elementTop - 70;

        window.scrollTo({
          top: offsetTop,
          behavior: 'auto'
        });

        setHasScrolledToComment(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loading, comment, hasScrolledToComment]);

  const handleReplyAdded = (newReply) => {
    setReplies(prev => [...prev, newReply]);
    setComment(prev => ({
      ...prev,
      replies_count: (prev?.replies_count || 0) + 1
    }));
  };

  const handleBackClick = () => {
    const previousPageType = sessionStorage.getItem('previousPageType');
    
    if (previousPageType === 'profile') {
      sessionStorage.removeItem('previousPageType');
      router.push(`/${username}`);
    } else if (originalPost) {
      router.push(`/${originalPost.user.pseudo}/post/${originalPost.id}`);
    } else {
      router.back();
    }
  };

  const handlePostClick = (e) => {
    if (
      e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('[data-interactive]')
    ) {
      return;
    }
    
    if (originalPost?.user?.pseudo) {
      sessionStorage.setItem('previousPageType', 'comment');
      router.push(`/${originalPost.user.pseudo}/post/${originalPost.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90] mb-4 mx-auto"></div>
          <p className="text-gray-400">Chargement du commentaire...</p>
        </div>
      </div>
    );
  }

  if (error || !comment) {
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
            <h1 className="text-2xl font-bold text-white mb-4">Commentaire introuvable</h1>
            <p className="text-gray-400">{error || "Ce commentaire n'existe pas ou a été supprimé."}</p>
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

        {originalPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 cursor-pointer"
            onClick={handlePostClick}
          >
            <div className="hover:bg-[#252525] transition-colors rounded-xl">
              <PostCardDetail post={originalPost} />
            </div>
            <div className="mt-4">
              <h2 className="text-gray-400 text-sm font-medium">Post d'origine</h2>
            </div>
          </motion.div>
        )}

        {originalPost && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center justify-start mb-6"
          >
            <div className="relative flex flex-col items-center">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-gradient-to-b from-[#333] via-[#90EE90] to-[#333] h-20 z-0"></div>           
                <div className="w-0.5 h-7 opacity-0"></div>         
                <div className="relative z-10 w-10 h-10 bg-[#1e1e1e] border-2 border-[#90EE90] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <FontAwesomeIcon icon={faArrowDown} className="text-[#90EE90] text-sm" />
                </div>
            </div>
          </motion.div>
        )}

        <motion.div
          ref={commentRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: originalPost ? 0.2 : 0 }}
          className="mb-8"
        >
          <div className="mb-4">
            <h2 className="text-gray-400 text-sm font-medium">
                Commentaire
            </h2>
          </div>
          <CommentCardDetail comment={comment} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: originalPost ? 0.3 : 0.1 }}
          className="space-y-6"
        >
          {session && (
            <div>
              <h2 className="text-white font-semibold text-lg mb-4">
                Ajouter une réponse
              </h2>
              <ReplyForm 
                commentId={commentId}
                onReplyAdded={handleReplyAdded}
              />
            </div>
          )}

          <div>
            <RepliesList 
              replies={replies}
              loading={false}
              commentId={commentId}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
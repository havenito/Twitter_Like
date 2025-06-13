"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import PostCardDetail from '@/components/Main/Post/PostCardDetail';
import CommentCardDetail from '@/components/Post/CommentCardDetail';
import ReplyCardDetail from '@/components/Main/Post/ReplyCardDetail';
import SubReplyForm from '@/components/Main/Post/SubReplyForm';
import SubRepliesList from '@/components/Main/Post/SubRepliesList';

export default function ReplyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const replyId = params?.replyId;
  const username = params?.username ? decodeURIComponent(params.username) : null;
  
  const [reply, setReply] = useState(null);
  const [parentReplies, setParentReplies] = useState([]);
  const [originalComment, setOriginalComment] = useState(null);
  const [originalPost, setOriginalPost] = useState(null);
  const [subReplies, setSubReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasScrolledToReply, setHasScrolledToReply] = useState(false);

  const replyRef = useRef(null);

  useEffect(() => {
    if (!replyId || !username) return;

    const fetchReplyThread = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/replies/${replyId}/thread`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Réponse introuvable');
          }
          throw new Error('Erreur lors du chargement de la réponse');
        }
        
        const thread = await response.json();
        
        if (thread.reply?.user?.pseudo !== username) {
          throw new Error(`Réponse introuvable pour cet utilisateur. Attendu: ${username}, Reçu: ${thread.reply?.user?.pseudo}`);
        }

        setReply(thread.reply);
        setParentReplies(thread.parent_replies || []);
        setOriginalComment(thread.comment);
        setSubReplies(thread.reply?.sub_replies || []);

        if (thread.post) {
          try {
            let postUser = null;
            if (thread.post.user_id) {
              const userResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${thread.post.user_id}`);
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
            }

            if (!postUser && thread.post.user?.pseudo) {
              const userResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/profile/${thread.post.user.pseudo}`);
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
            }

            let categoryData = null;
            if (thread.post.category_id) {
              const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories/${thread.post.category_id}`);
              if (categoryResponse.ok) {
                categoryData = await categoryResponse.json();
              }
            }

            let likesCount = 0;
            try {
              const likesResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${thread.post.id}/likes`);
              if (likesResponse.ok) {
                const likesData = await likesResponse.json();
                likesCount = likesData.likes_count || 0;
              }
            } catch (likesError) {
              console.error('Erreur lors du chargement des likes:', likesError);
            }

            let commentsCount = 0;
            try {
              const commentsResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${thread.post.id}/comments`);
              if (commentsResponse.ok) {
                const commentsData = await commentsResponse.json();
                commentsCount = commentsData.comments?.length || 0;
              }
            } catch (commentsError) {
              console.error('Erreur lors du chargement des commentaires:', commentsError);
            }

            const enrichedPost = {
              id: thread.post.id,
              title: thread.post.title,
              content: thread.post.content,
              publishedAt: thread.post.published_at,
              media: thread.post.media || [],
              likes: likesCount,
              comments: commentsCount,
              user: postUser || {
                id: null,
                pseudo: 'utilisateur_inconnu',
                firstName: null,
                lastName: null,
                profilePicture: null
              },
              category: categoryData ? {
                id: categoryData.id,
                name: categoryData.name,
                description: categoryData.description
              } : null
            };

            setOriginalPost(enrichedPost);
          } catch (postError) {
            console.error('Erreur lors de l\'enrichissement du post:', postError);
            setOriginalPost({
              id: thread.post.id,
              title: thread.post.title,
              content: thread.post.content,
              publishedAt: thread.post.published_at,
              media: thread.post.media || [],
              likes: 0,
              comments: 0,
              user: {
                id: null,
                pseudo: 'utilisateur_inconnu',
                firstName: null,
                lastName: null,
                profilePicture: null
              },
              category: null
            });
          }
        }

      } catch (err) {
        console.error('Erreur lors du chargement de la réponse:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReplyThread();
  }, [replyId, username]);

  useEffect(() => {
    if (!loading && reply && replyRef.current && !hasScrolledToReply) {
      const timer = setTimeout(() => {
        const element = replyRef.current;
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetTop = elementTop - 70;

        window.scrollTo({
          top: offsetTop,
          behavior: 'auto'
        });

        setHasScrolledToReply(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loading, reply, hasScrolledToReply]);

  const handleSubReplyAdded = (newSubReply) => {
    setSubReplies(prev => [...prev, newSubReply]);
    setReply(prev => ({
      ...prev,
      sub_replies_count: (prev?.sub_replies_count || 0) + 1
    }));
  };

  const handleBackClick = () => {
    const previousPageType = sessionStorage.getItem('previousPageType');

    if (previousPageType === 'profile') {
        sessionStorage.removeItem('previousPageType');
        router.push(`/${username}`);
    } else if (parentReplies.length > 0) {
      const directParent = parentReplies[parentReplies.length - 1];
      router.push(`/${directParent.user.pseudo}/reply/${directParent.id}`);
    } else if (originalComment) {
      router.push(`/${originalComment.user.pseudo}/comment/${originalComment.id}`);
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
      sessionStorage.setItem('previousPageType', 'reply');
      router.push(`/${originalPost.user.pseudo}/post/${originalPost.id}`);
    }
  };

  const handleCommentClick = (e) => {
    if (
      e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('[data-interactive]')
    ) {
      return;
    }
    
    if (originalComment?.user?.pseudo) {
      sessionStorage.setItem('previousPageType', 'reply');
      router.push(`/${originalComment.user.pseudo}/comment/${originalComment.id}`);
    }
  };

  const handleParentReplyClick = (parentReply, e) => {
    if (
      e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('[data-interactive]')
    ) {
      return;
    }
    
    if (parentReply?.user?.pseudo) {
      sessionStorage.setItem('previousPageType', 'reply');
      router.push(`/${parentReply.user.pseudo}/reply/${parentReply.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#90EE90] mb-4 mx-auto"></div>
          <p className="text-gray-400">Chargement de la réponse...</p>
        </div>
      </div>
    );
  }

  if (error || !reply) {
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
            <h1 className="text-2xl font-bold text-white mb-4">Réponse introuvable</h1>
            <p className="text-gray-400">{error || "Cette réponse n'existe pas ou a été supprimée."}</p>
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
            key="original-post"
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

        {originalPost && originalComment && (
          <motion.div
            key="arrow-post-comment"
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

        {originalComment && (
          <motion.div
            key="original-comment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: originalPost ? 0.2 : 0 }}
            className="mb-6 cursor-pointer"
            onClick={handleCommentClick}
          >
            <div className="hover:bg-[#252525] transition-colors rounded-xl">
              <CommentCardDetail comment={originalComment} />
            </div>
            <div className="mt-4">
              <h2 className="text-gray-400 text-sm font-medium">Commentaire d'origine</h2>
            </div>
          </motion.div>
        )}

        {parentReplies.length > 0 && parentReplies.map((parentReply, index) => (
          <React.Fragment key={`parent-reply-fragment-${index}`}>
            {/* Flèche de transition */}
            <motion.div
              key={`arrow-parent-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + (index * 0.1), duration: 0.4 }}
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

            <motion.div
              key={`parent-reply-${parentReply.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (index * 0.1) }}
              className="mb-6 cursor-pointer"
              onClick={(e) => handleParentReplyClick(parentReply, e)}
            >
              <div className="hover:bg-[#252525] transition-colors rounded-xl">
                <ReplyCardDetail reply={parentReply} />
              </div>
              <div className="mt-4">
                <h2 className="text-gray-400 text-sm font-medium">
                  {index === 0 ? 'Réponse' : `Sous-réponse niveau ${index + 1}`}
                </h2>
              </div>
            </motion.div>
          </React.Fragment>
        ))}

        {(originalComment || parentReplies.length > 0) && (
          <motion.div
            key="arrow-to-current"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.3 + ((parentReplies.length + (originalComment ? 1 : 0)) * 0.1), 
              duration: 0.4 
            }}
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
          key="current-reply"
          ref={replyRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.4 + ((parentReplies.length + (originalComment ? 1 : 0)) * 0.1)
          }}
          className="mb-8"
        >
          <div className="mb-4">
            <h2 className="text-gray-400 text-sm font-medium">
              {parentReplies.length > 0 ? `Sous-réponse niveau ${parentReplies.length + 1}` : 'Réponse'}
            </h2>
          </div>
          <ReplyCardDetail reply={reply} />
        </motion.div>

        <motion.div
          key="form-and-subreplies"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.5 + ((parentReplies.length + (originalComment ? 1 : 0)) * 0.1)
          }}
          className="space-y-6"
        >
          {session && (
            <div>
              <h2 className="text-white font-semibold text-lg mb-4">
                {parentReplies.length > 0 ? 'Répondre à cette sous-réponse' : 'Répondre à cette réponse'}
              </h2>
              <SubReplyForm 
                parentReplyId={replyId}
                onSubReplyAdded={handleSubReplyAdded}
              />
            </div>
          )}

          <div>
            <SubRepliesList 
              subReplies={subReplies}
              loading={false}
              parentReplyId={replyId}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
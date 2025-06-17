"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faTag, 
  faUser, 
  faCalendarAlt, 
  faSpinner,
  faFileText,
  faExclamationTriangle,
  faComment,
  faHeart
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import LikeButton from "../../../../../../components/Main/Post/LikeButton";

export default function CategoryPostsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId;
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersData, setUsersData] = useState({});
  const [postsStats, setPostsStats] = useState({});

  useEffect(() => {
    const fetchCategoryAndPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Vérifier que categoryId existe et est un nombre valide (y compris 0)
        if (categoryId === undefined || categoryId === null || categoryId === '' || isNaN(Number(categoryId))) {
          throw new Error('ID de catégorie invalide');
        }

        // Récupérer la catégorie
        const catRes = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories/${categoryId}`);
        if (!catRes.ok) {
          throw new Error('Catégorie non trouvée');
        }
        const catData = await catRes.json();
        setCategory(catData);

        // Récupérer les posts de la catégorie
        const postsRes = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/categories/${categoryId}/posts`);
        if (!postsRes.ok) {
          throw new Error('Erreur lors de la récupération des posts');
        }
        const postsData = await postsRes.json();
        const postsArray = postsData.posts || [];
        setPosts(postsArray);

        // Récupérer les données des utilisateurs pour chaque post
        const userDataMap = {};
        const uniqueUserPseudos = [...new Set(postsArray.map(post => post.user_pseudo).filter(Boolean))];
        
        await Promise.all(
          uniqueUserPseudos.map(async (pseudo) => {
            try {
              const userRes = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/profile/${pseudo}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                userDataMap[pseudo] = userData;
              }
            } catch (userError) {
              console.error(`Erreur lors de la récupération des données de l'utilisateur ${pseudo}:`, userError);
            }
          })
        );
        
        setUsersData(userDataMap);

        // Récupérer les statistiques (likes et commentaires) pour chaque post
        const statsMap = {};
        await Promise.all(
          postsArray.map(async (post) => {
            try {
              // Récupérer le nombre de likes
              const likesRes = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${post.id}/likes`);
              let likesCount = 0;
              if (likesRes.ok) {
                const likesData = await likesRes.json();
                likesCount = likesData.likes_count || 0;
              }

              // Récupérer le nombre de commentaires
              const commentsRes = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/posts/${post.id}/comments`);
              let commentsCount = 0;
              if (commentsRes.ok) {
                const commentsData = await commentsRes.json();
                commentsCount = commentsData.comments?.length || 0;
              }

              statsMap[post.id] = {
                likes: likesCount,
                comments: commentsCount
              };
            } catch (statsError) {
              console.error(`Erreur lors de la récupération des stats du post ${post.id}:`, statsError);
              statsMap[post.id] = {
                likes: 0,
                comments: 0
              };
            }
          })
        );

        setPostsStats(statsMap);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
        setCategory(null);
        setPosts([]);
      }
      setLoading(false);
    };
    
    if (categoryId !== undefined) {
      fetchCategoryAndPosts();
    }
  }, [categoryId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  const renderSubscriptionBadge = (user) => {
    const subscription = user?.subscription || 'free';
    
    if (subscription === 'plus') {
      return (
        <div className="w-4 h-4 flex-shrink-0">
          <Image
            src="/plusbadge.png"
            alt="Badge Plus"
            width={16}
            height={16}
            className="w-full h-full object-contain"
          />
        </div>
      );
    } else if (subscription === 'premium') {
      return (
        <div className="w-4 h-4 flex-shrink-0">
          <Image
            src="/premiumbadge.png"
            alt="Badge Premium"
            width={16}
            height={16}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    
    return null;
  };

  const renderProfilePicture = (post) => {
    const userPseudo = post.user_pseudo || post.user?.pseudo;
    const userData = usersData[userPseudo];
    const profilePicture = userData?.profile_picture;
    
    if (!profilePicture) {
      return (
        <div className="relative">
          <Image
            src="/defaultuserpfp.png"
            alt={`Photo de profil de ${userPseudo || 'Utilisateur'}`}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border border-[#555]"
          />
        </div>
      );
    }

    return (
      <div className="relative">
        <Image
          src={profilePicture}
          alt={`Photo de profil de ${userPseudo || 'Utilisateur'}`}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border border-[#555]"
          onError={(e) => {
            e.target.src = '/defaultuserpfp.png';
          }}
        />
      </div>
    );
  };

  const getDisplayName = (post) => {
    const userPseudo = post.user_pseudo || post.user?.pseudo;
    const userData = usersData[userPseudo];
    
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    
    if (userData?.first_name) {
      return userData.first_name;
    }
    
    return userPseudo || 'Utilisateur';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] text-white">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between py-6 sm:py-8">
            <div className="w-24 h-10 bg-[#333] rounded-full animate-pulse"></div>
            <div className="flex-1 text-center">
              <div className="h-8 bg-[#333] rounded-lg mx-auto mb-2 w-48 animate-pulse"></div>
              <div className="h-4 bg-[#333] rounded-lg mx-auto w-32 animate-pulse"></div>
            </div>
            <div className="w-24"></div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-4 sm:space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#1e1e1e] p-4 sm:p-6 rounded-xl border border-[#333] animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#333] rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-[#333] rounded w-3/4"></div>
                    <div className="h-4 bg-[#333] rounded w-1/2"></div>
                    <div className="h-20 bg-[#333] rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-[#111] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.button
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors mb-6"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Retour
          </motion.button>

          <div className="text-center py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-red-500 bg-opacity-20 rounded-full mb-4"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-2xl" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Catégorie introuvable</h1>
            <p className="text-gray-400">{error || "Cette catégorie n'existe pas ou a été supprimée."}</p>
            <p className="text-gray-500 text-sm mt-2">ID de catégorie: {categoryId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header avec bouton retour */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-4 py-2 bg-[#333] rounded-full hover:bg-[#444] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            <span className="hidden sm:inline">Retour à la recherche</span>
            <span className="sm:hidden">Retour</span>
          </motion.button>
        </motion.div>

        {/* Informations de la catégorie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1e1e1e] rounded-xl p-6 sm:p-8 border border-[#333] mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-[#90EE90] bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faTag} className="text-[#90EE90] text-2xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#90EE90] mb-2 break-words">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-gray-300 text-lg leading-relaxed break-words">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#333]">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faFileText} className="text-[#90EE90]" />
              <span className="text-white font-semibold">
                {posts.length} publication{posts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              ID: {categoryId}
            </div>
          </div>
        </motion.div>

        {/* Liste des posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gray-600 bg-opacity-20 rounded-full mb-4"
              >
                <FontAwesomeIcon icon={faFileText} className="text-gray-500 text-2xl" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">Aucune publication</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Il n'y a pas encore de publications dans cette catégorie. 
                Soyez le premier à publier quelque chose !
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="space-y-6"
            >
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="bg-[#1e1e1e] rounded-xl p-6 border border-[#333] hover:border-[#555] transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Link href={`/${post.user_pseudo || post.user?.pseudo || "user"}`}>
                        {renderProfilePicture(post)}
                      </Link>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        <Link 
                          href={`/${post.user_pseudo || post.user?.pseudo || "user"}`}
                          className="text-white font-medium hover:text-[#90EE90] transition-colors"
                        >
                          {getDisplayName(post)}
                        </Link>
                        <Link 
                          href={`/${post.user_pseudo || post.user?.pseudo || "user"}`}
                          className="text-[#90EE90] font-medium hover:text-[#7CD37C] transition-colors"
                        >
                          @{post.user_pseudo || post.user?.pseudo || "utilisateur"}
                        </Link>
                        
                        {/* Badge d'abonnement entre le pseudo et la date */}
                        {(() => {
                          const userPseudo = post.user_pseudo || post.user?.pseudo;
                          const userData = usersData[userPseudo];
                          const badge = renderSubscriptionBadge(userData);
                          return badge ? (
                            <>
                              <span className="text-gray-500">•</span>
                              {badge}
                            </>
                          ) : null;
                        })()}
                        
                        <span className="text-gray-500">•</span>
                        <div className="flex items-center space-x-1 text-gray-500 text-sm">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                          <span>{formatDate(post.published_at)}</span>
                        </div>
                      </div>

                      <Link 
                        href={`/${post.user_pseudo || post.user?.pseudo || "user"}/post/${post.id}`}
                        className="block group"
                      >
                        {post.title && (
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#90EE90] transition-colors break-words">
                            {post.title}
                          </h3>
                        )}
                        
                        <p className="text-gray-300 leading-relaxed mb-4 break-words">
                          {post.content?.length > 200 
                            ? `${post.content.slice(0, 200)}...` 
                            : post.content}
                        </p>
                      </Link>

                      {/* Section des statistiques et actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#333]">
                        <div className="flex items-center space-x-4">
                          {/* Bouton Like interactif */}
                          <LikeButton 
                            postId={post.id}
                            initialLikes={postsStats[post.id]?.likes || 0}
                            className="text-sm"
                          />
                          
                          {/* Bouton Commentaires (non-interactif avec hover) */}
                          <button 
                            type="button"
                            className="flex items-center space-x-1 text-gray-400 hover:text-[#90EE90] transition-colors cursor-pointer disabled:cursor-default"
                            disabled
                          >
                            <FontAwesomeIcon icon={faComment} className="text-sm" />
                            <span className="text-xs">
                              {postsStats[post.id]?.comments || 0}
                            </span>
                          </button>
                        </div>

                        <Link 
                          href={`/${post.user_pseudo || post.user?.pseudo || "user"}/post/${post.id}`}
                          className="inline-flex items-center text-[#90EE90] hover:text-[#7CD37C] transition-colors text-sm font-medium"
                        >
                          Voir en détail →
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
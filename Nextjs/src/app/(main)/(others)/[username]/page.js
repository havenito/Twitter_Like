"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import ProfileHeader from '@/components/Profile/ProfileHeader';
import ProfileContent from '@/components/Profile/ProfileContent';
import LoadingProfile from '@/components/Profile/LoadingProfile';
import ProfileNotFound from '@/components/Profile/ProfileNotFound';

export default function UserProfilePage() {
  const params = useParams();
  const usernameFromParams = params?.username; 
  const username = Array.isArray(usernameFromParams) ? usernameFromParams[0] : usernameFromParams;

  const { data: session, status: sessionStatus } = useSession();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const isOwnProfile = session?.user?.pseudo === username;

  useEffect(() => {
    if (!username || sessionStatus === 'loading') {
      if (!username && sessionStatus !== 'loading') setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        let fetchedData = null;

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/profile/${username}`);
          
          if (!response.ok) {
            throw new Error("Profil introuvable ou erreur serveur");
          }
          
          fetchedData = await response.json();
          
          if (session?.user?.id && fetchedData.id && !isOwnProfile) {
            setFollowingLoading(true);
            try {
              const followResponse = await fetch(
                `${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${session.user.id}/follows/${fetchedData.id}`
              );
              if (followResponse.ok) {
                const followData = await followResponse.json();
                setIsFollowing(followData.status);
              }
            } catch (followError) {
              console.error('Erreur lors de la vérification du statut de suivi:', followError);
            } finally {
              setFollowingLoading(false);
            }
          }
          
          let userPosts = [];
          let userMedia = [];
          let userLikes = [];
          let userPolls = [];
          let userCommentsAndReplies = [];
          
          if (fetchedData.id) {
            try {
              const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${fetchedData.id}/posts`);
              
              if (postsResponse.ok) {
                const postsData = await postsResponse.json();
                userPosts = postsData.posts.map(post => ({
                  id: post.id,
                  title: post.title,
                  content: post.content,
                  createdAt: post.published_at,
                  publishedAt: post.published_at,
                  media: post.media || [],
                  user: post.user, 
                  userId: post.user_id,
                  category: post.category,
                  categoryId: post.category_id,
                  likes: post.likes || 0,
                  comments: post.comments || 0
                }));
                
                userMedia = userPosts.reduce((allMedia, post) => {
                  if (post.media && Array.isArray(post.media)) {
                    return [...allMedia, ...post.media];
                  }
                  return allMedia;
                }, []);
              } else {
                console.warn('Impossible de récupérer les posts de l\'utilisateur');
              }
            } catch (postsError) {
              console.error('Erreur lors de la récupération des posts:', postsError);
            }

            if (isOwnProfile || (!fetchedData.private || isFollowing)) {
              try {
                const commentsResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${fetchedData.id}/comments-replies`);
                
                if (commentsResponse.ok) {
                  const commentsData = await commentsResponse.json();
                  userCommentsAndReplies = commentsData.commentsAndReplies || [];
                }
              } catch (commentsError) {
                console.error('Erreur lors de la récupération des commentaires et réponses:', commentsError);
              }

              try {
                const likesResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${fetchedData.id}/likes`);
                
                if (likesResponse.ok) {
                  const likesData = await likesResponse.json();
                  userLikes = likesData.likes || [];
                }
              } catch (likesError) {
                console.error('Erreur lors de la récupération des likes:', likesError);
              }

              try {
                const pollsResponse = await fetch(`${process.env.NEXT_PUBLIC_FLASK_API_URL}/api/users/${fetchedData.id}/polls`);
                
                if (pollsResponse.ok) {
                  const pollsData = await pollsResponse.json();
                  userPolls = pollsData.polls || [];
                }
              } catch (pollsError) {
                console.error('Erreur lors de la récupération des sondages:', pollsError);
              }
            }
          }
          
          fetchedData = {
            id: fetchedData.id,
            pseudo: fetchedData.pseudo,
            firstName: fetchedData.first_name,
            lastName: fetchedData.last_name,
            bio: fetchedData.biography,
            profilePicture: fetchedData.profile_picture || '/defaultuserpfp.png',
            bannerImage: fetchedData.banner,
            joinDate: fetchedData.created_at,
            isPublic: !fetchedData.private,
            followers: fetchedData.followers_count || 0,
            following: fetchedData.following_count || 0,
            subscription: fetchedData.subscription || 'free',
            posts: userPosts,
            media: userMedia,
            likes: userLikes,
            polls: userPolls,
            commentsAndReplies: userCommentsAndReplies,
          };
          
        } catch (err) {
          console.error("Erreur API:", err);
          
          if (isOwnProfile && session?.user) {
            fetchedData = {
              id: session.user.id,
              pseudo: session.user.pseudo,
              firstName: session.user.firstName || '',
              lastName: session.user.lastName || '',
              bio: session.user.biography,
              profilePicture: session.user.profilePicture || session.user.image || '/defaultuserpfp.png',
              bannerImage: session.user.banner,
              joinDate: session.user.createdAt || new Date().toISOString(),
              isPublic: session.user.isPrivate !== undefined ? !session.user.isPrivate : true,
              subscription: session.user.subscription || 'free',
              followers: 0,
              following: 0,
              posts: [],
              media: [],
              likes: [],
              polls: [],
              commentsAndReplies: [],
            };
          } else {
            setError("Profil introuvable.");
          }
        }
        
        setProfileData(fetchedData);

      } catch (err) {
        console.error("Erreur lors du chargement du profil:", err);
        setError("Une erreur est survenue lors du chargement du profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();

  }, [username, sessionStatus, session, isOwnProfile]); 

  const isFirstLoad = !profileData && (loading || sessionStatus === 'loading');
  if (isFirstLoad) {
    return <LoadingProfile />;
  }

  if (error || !profileData) {
    return <ProfileNotFound error={error || "Le profil demandé n'a pas pu être chargé."} />;
  }
  
  if (!profileData.isPublic && !isOwnProfile && !isFollowing) {
    return (
        <div className="min-h-screen bg-[#111] text-white pb-10">
            <ProfileHeader 
              profileData={{
                id: profileData.id,
                pseudo: profileData.pseudo,
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                profilePicture: profileData.profilePicture,
                bannerImage: profileData.bannerImage,
                isPublic: profileData.isPublic,
                joinDate: profileData.joinDate,
                following: profileData.following, 
                followers: profileData.followers,
                subscription: profileData.subscription 
              }} 
              isOwnProfile={isOwnProfile}
              isFollowing={isFollowing}
              setIsFollowing={setIsFollowing}
            />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 text-center text-gray-400 py-10">
                <FontAwesomeIcon icon={faLock} className="text-5xl mb-4 text-[#90EE90]" />
                <p className="text-xl font-semibold text-white">Ce compte est privé</p>
                <p>Suivez cette personne pour voir ses publications si elle vous accepte.</p>
                {followingLoading && (
                  <p className="text-sm mt-2 text-gray-500">Vérification du statut de suivi...</p>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white pb-10">
      <ProfileHeader 
        profileData={profileData} 
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        setIsFollowing={setIsFollowing}
      />
      <ProfileContent 
        profileData={profileData}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
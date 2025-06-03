"use client";

import Sidebar from "@/components/Main/Sidebar/Sidebar";
import CreatePostModal from "@/components/Main/Post/CreatePostModal";
import FloatingCreateButton from "@/components/Main/Post/FloatingCreateButton";
import { useCreatePost } from "@/hooks/useCreatePost";

export default function HomeLayout2 ({ children }) {
  const { isCreatePostOpen, openCreatePost, closeCreatePost } = useCreatePost();

  const handlePostCreated = (newPost) => {
    // Émettre un événement pour rafraîchir les feeds
    window.dispatchEvent(new CustomEvent('postCreated', { detail: newPost }));
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <>
      <Sidebar onCreatePost={openCreatePost} />
      
      <div className="ml-64 w-full"> 
        <section className="flex-1 flex flex-col">
          <div className="w-full">
            {children}
          </div>
        </section>
      </div>

      {/* Bouton flottant pour mobile */}
      <FloatingCreateButton onClick={openCreatePost} />

      {/* Modal de création de post */}
      <CreatePostModal 
        isOpen={isCreatePostOpen}
        onClose={closeCreatePost}
        onPostCreated={handlePostCreated}
      />
    </>
  );
}
"use client";

import Sidebar from "@/components/Main/Sidebar/Sidebar";
import CreatePostModal from "@/components/Main/Post/CreatePostModal";
import { useCreatePost } from "@/hooks/useCreatePost";

export default function HomeLayout2 ({ children }) {
  const { isCreatePostOpen, openCreatePost, closeCreatePost } = useCreatePost();

  const handlePostCreated = (newPost) => {
    window.dispatchEvent(new CustomEvent('postCreated', { detail: newPost }));
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <>
      <Sidebar onCreatePost={openCreatePost} />
      
      <div className="w-full md:ml-64"> 
        <section className="flex-1 flex flex-col">
          <div className="w-full md:px-0">
            {children}
          </div>
        </section>
      </div>

      <CreatePostModal 
        isOpen={isCreatePostOpen}
        onClose={closeCreatePost}
        onPostCreated={handlePostCreated}
      />
    </>
  );
}
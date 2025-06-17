"use client";

import { useState } from 'react';

export const useCreatePost = () => {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const openCreatePost = () => setIsCreatePostOpen(true);
  const closeCreatePost = () => setIsCreatePostOpen(false);

  return {
    isCreatePostOpen,
    openCreatePost,
    closeCreatePost
  };
};
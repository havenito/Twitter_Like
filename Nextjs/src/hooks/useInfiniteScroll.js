"use client";

import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (fetchMore) => {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isFetching) return;
    fetchMoreData();
  }, [isFetching]);

  const handleScroll = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;
    
    const threshold = 100;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    if (nearBottom && !isFetching) {
      setIsFetching(true);
    }
  };

  const fetchMoreData = useCallback(async () => {
    try {
      await fetchMore();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsFetching(false);
    }
  }, [fetchMore]);

  return [isFetching, setIsFetching];
};
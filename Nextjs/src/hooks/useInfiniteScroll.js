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
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isFetching) return;
    setIsFetching(true);
  };

  const fetchMoreData = useCallback(async () => {
    await fetchMore();
    setIsFetching(false);
  }, [fetchMore]);

  return [isFetching, setIsFetching];
};
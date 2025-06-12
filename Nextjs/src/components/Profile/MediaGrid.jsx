import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faVideo, faPlay } from '@fortawesome/free-solid-svg-icons';
import MediaModal from '../MediaModal';

const MediaGrid = ({ posts, userPseudo, isOwnProfile }) => {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  
  const allMedia = [];
  
  if (Array.isArray(posts)) {
    posts.forEach(post => {
      if (Array.isArray(post.media) && post.media.length > 0) {
        post.media.forEach((media, index) => {
          allMedia.push({
            id: media.id || `${post.id}-${index}`,
            url: media.url,
            type: media.type || 'image',
            postId: post.id,
            postTitle: post.title
          });
        });
      }
    });
  }

  const handleMediaClick = (index) => {
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  if (allMedia.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-10 text-center text-gray-400"
      >
        <FontAwesomeIcon icon={faImage} className="text-3xl mb-3 text-gray-500" />
        <p className="text-lg">
          {isOwnProfile 
            ? "Vous n'avez pas encore partagé de médias." 
            : `@${userPseudo} n'a pas encore partagé de médias.`}
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2"
      >
        {allMedia.map((media, index) => {
          const isVideo = media.type === 'video' || media.url.match(/\.(mp4|webm|ogg)$/i);
          const mediaUrl = media.url.startsWith('http') 
            ? media.url 
            : media.url.startsWith('/') 
              ? media.url 
              : `/${media.url}`;

          return (
            <motion.div
              key={media.id}
              variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
              className="aspect-square relative rounded-md overflow-hidden bg-gray-800 group cursor-pointer"
              title={media.postTitle}
              onClick={() => handleMediaClick(index)}
            >
              {isVideo ? (
                <div className="relative w-full h-full">
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-colors">
                    <FontAwesomeIcon icon={faPlay} className="text-white text-2xl" />
                  </div>
                  <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                    <FontAwesomeIcon icon={faVideo} />
                  </div>
                </div>
              ) : (
                <Image
                  src={mediaUrl}
                  alt={`Média du post ${media.postId}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-colors flex items-end">
                <div className="p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="truncate">{media.postTitle}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        media={allMedia}
        currentIndex={selectedMediaIndex}
        onNavigate={setSelectedMediaIndex}
      />
    </>
  );
};

export default MediaGrid;
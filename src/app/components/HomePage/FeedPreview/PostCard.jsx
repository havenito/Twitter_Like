import React from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faComment, 
  faRetweet, 
  faHeart
} from "@fortawesome/free-solid-svg-icons";

const PostCard = ({ post }) => {
  return (
    <div className="border-b border-[#333] p-4 hover:bg-[#222] transition-colors duration-200">
      <div className="flex">
        <div className="mr-3">
          <Image 
            src={post.avatar} 
            alt={post.username} 
            width={48} 
            height={48} 
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-bold">{post.username}</span>
            <span className="text-gray-500 ml-2">{post.handle}</span>
            <span className="text-gray-500 ml-2">· {post.time}</span>
          </div>
          <p className="my-2">{post.content}</p>
          
          {post.image && (
            <div className="mt-2 mb-3 rounded-xl overflow-hidden">
              <Image 
                src={post.image} 
                alt="Post image"
                width={500}
                height={300}
                className="w-full object-cover"
              />
            </div>
          )}
          
          <div className="flex justify-between mt-2 text-gray-500">
            <button className="flex items-center hover:text-[#90EE90] transition-colors">
              <FontAwesomeIcon icon={faComment} className="mr-2" />
              {post.comments}
            </button>
            <button className="flex items-center hover:text-green-400 transition-colors">
              <FontAwesomeIcon icon={faRetweet} className="mr-2" />
              {post.reposts}
            </button>
            <button className="flex items-center hover:text-red-400 transition-colors">
              <FontAwesomeIcon icon={faHeart} className="mr-2" />
              {post.likes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
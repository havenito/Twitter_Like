import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessageInput({ onSendMessage, onTypingStart, onTypingStop, currentUser }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Gestion du typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
      }
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Arrêter l'indicateur de frappe
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-[#333] bg-[#1b1b1b] p-4"
    >
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <motion.div
            animate={{
              borderColor: isFocused ? '#90EE90' : '#333',
              boxShadow: isFocused ? '0 0 0 2px rgba(144, 238, 144, 0.1)' : 'none'
            }}
            transition={{ duration: 0.2 }}
            className="relative bg-[#2a2a2a] rounded-2xl border border-[#333] overflow-hidden"
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Tapez votre message..."
              className="w-full resize-none bg-transparent text-white placeholder-gray-500 px-4 py-3 focus:outline-none"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            
            <AnimatePresence>
              {message.length > 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-2 right-2 text-xs text-gray-500 bg-[#1b1b1b] px-2 py-1 rounded-full"
                >
                  {message.length}/500
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        
        <motion.button
          type="submit"
          disabled={!message.trim()}
          whileHover={message.trim() ? { scale: 1.05 } : {}}
          whileTap={message.trim() ? { scale: 0.95 } : {}}
          animate={{
            backgroundColor: message.trim() ? '#90EE90' : '#333',
            color: message.trim() ? '#000' : '#666'
          }}
          transition={{ duration: 0.2 }}
          className="p-3 rounded-full font-semibold transition-all duration-200 shadow-lg disabled:cursor-not-allowed flex items-center justify-center"
        >
          <motion.svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            animate={{ 
              rotate: message.trim() ? 0 : -45,
              scale: message.trim() ? 1 : 0.9 
            }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </motion.svg>
        </motion.button>
      </form>
      
      <div className="flex items-center justify-end mt-2">
        {message.trim() && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-500"
          >
            Appuyez sur Entrée pour envoyer
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
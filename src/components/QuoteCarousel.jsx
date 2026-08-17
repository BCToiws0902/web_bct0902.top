import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';

const QuoteCarousel = () => {
  const { config } = useConfig();
  const quotes = (config?.content?.quotes && config.content.quotes.length > 0)
    ? config.content.quotes
    : ["Không có gì quý hơn độc lập, tự do. - Hồ Chí Minh"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  return (
    <div style={{ height: '80px', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ 
            fontSize: '1.2rem', 
            color: 'var(--text-muted)', 
            fontStyle: 'italic',
            lineHeight: 1.6,
            maxWidth: '600px',
            position: 'absolute'
          }}
        >
          "{quotes[index]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export default QuoteCarousel;

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

const FOOD_EMOJIS = ['🍅', '🍳', '🥩', '🥦', '🍕', '🥗', '🥢', '🍷', '🥖', '🥕', '🥔'];

const FoodItem = memo(({ delay }) => {
  const randomXInit = useMemo(() => Math.random() * 100, []);
  const randomDuration = useMemo(() => 10 + Math.random() * 20, []);
  const randomScale = useMemo(() => 0.8 + Math.random() * 1.5, []);
  const food = useMemo(() => FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)], []);

  return (
    <motion.div
      initial={{ 
        top: '-10%', 
        left: `${randomXInit}%`, 
        opacity: 0, 
        rotate: 0,
        scale: randomScale 
      }}
      animate={{ 
        top: '110%', 
        left: [`${randomXInit}%`, `${randomXInit + (Math.random() > 0.5 ? 15 : -15)}%`, `${randomXInit}%`],
        opacity: [0, 0.5, 0.5, 0],
        rotate: [0, 180, 360, 540, 720],
      }}
      transition={{ 
        duration: randomDuration, 
        repeat: Infinity, 
        delay: delay,
        ease: "linear"
      }}
      style={{
        position: 'absolute',
        fontSize: '2rem',
        filter: 'blur(1px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      {food}
    </motion.div>
  );
});

const FallingFood = memo(() => {
  const foodCount = 20;
  const foods = useMemo(() => Array.from({ length: foodCount }), []);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden'
    }}>
      {foods.map((_, i) => (
        <FoodItem key={i} delay={i * 1.5} />
      ))}
    </div>
  );
});

export default FallingFood;

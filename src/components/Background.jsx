import React from 'react';
import { motion } from 'framer-motion';
import FallingPetals from './FallingPetals';

const Background = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      <FallingPetals />
      
      {}
      <motion.div
        animate={{
          x: [0, 400, 200, -100, 0],
          y: [0, 200, 500, 200, 0],
          scale: [1, 1.2, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, var(--accent-main), transparent 70%)',
          opacity: 0.12,
          filter: 'blur(50px)',
          borderRadius: '50%',
          willChange: 'transform'
        }}
      />

      {}
      <motion.div
        animate={{
          x: [0, -300, -500, -200, 0],
          y: [0, 400, 100, 300, 0],
          scale: [1, 1.1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, var(--accent-secondary), transparent 70%)',
          opacity: 0.12,
          filter: 'blur(60px)',
          borderRadius: '50%',
          willChange: 'transform'
        }}
      />

      {}
      <motion.div
        animate={{
          x: [0, 200, -200, 0],
          y: [0, -300, 0, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          top: '40%',
          left: '40%',
          width: '30vw',
          height: '30vw',
          background: 'radial-gradient(circle, var(--success), transparent 70%)',
          opacity: 0.08,
          filter: 'blur(50px)',
          borderRadius: '50%',
          willChange: 'transform'
        }}
      />
    </div>
  );
};

export default Background;

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem'
    }}>
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '4rem 2rem',
          borderRadius: '40px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
          zIndex: 10
        }}
      >
        <motion.div
           animate={{ 
             y: [0, 8, 0],
             rotate: [0, -1, 1, 0]
           }}
           transition={{ 
             duration: 6, 
             repeat: Infinity, 
             ease: "easeInOut" 
           }}
           style={{ marginBottom: '2rem', display: 'inline-block' }}
        >
          <div style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.3)',
            position: 'relative'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8" />
              <rect width="16" height="12" x="4" y="8" rx="2" />
              <path d="M9 13h.01" />
              <path d="M15 13h.01" />
              <path d="M9 17c1 0 2-1 3-1s2 1 3 1" />
            </svg>
            
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '4px',
              height: '4px',
              background: '#ff4b4b',
              borderRadius: '50%',
              boxShadow: '0 0 10px #ff4b4b'
            }} />
          </div>
        </motion.div>

        <h1 style={{
          fontSize: 'clamp(5rem, 12vw, 8rem)',
          fontWeight: 900,
          margin: '0',
          lineHeight: '1',
          fontFamily: "'Chakra Petch', sans-serif",
          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '1.2rem',
          color: '#fff',
          fontFamily: "'Chakra Petch', sans-serif",
          margin: '1.5rem 0 1rem',
          letterSpacing: '1px'
        }}>
          {t('common.page_not_found', 'PAGE NOT FOUND')}
        </h2>

        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.95rem',
          lineHeight: '1.8',
          marginBottom: '3rem',
          maxWidth: '450px',
          marginInline: 'auto'
        }}>
          {t('common.page_not_found_desc', 'The page you requested might have been moved, removed, or is temporarily unavailable.')}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              padding: '1rem 1.8rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ArrowLeft size={18} /> {t('common.back', 'BACK')}
          </button>

          <button 
            onClick={() => navigate('/')}
            style={{
              padding: '1rem 1.8rem',
              borderRadius: '16px',
              border: 'none',
              background: 'var(--accent-main, #0068ff)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              transition: 'all 0.3s',
              boxShadow: '0 10px 20px -5px rgba(0, 104, 255, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(0, 104, 255, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 104, 255, 0.3)';
            }}
          >
            <Home size={18} /> {t('nav.home', 'HOME')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

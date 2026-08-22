import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Home, ArrowLeft, Construction, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Maintenance = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="maintenance-container" style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem'
    }}>
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        opacity: 0.15,
        filter: 'blur(50px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
        opacity: 0.1,
        filter: 'blur(60px)',
        zIndex: 0
      }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
        style={{
          maxWidth: '600px',
          width: '100%',
          padding: '4rem 2rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          border: '1px solid var(--bg-glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem'
        }}
      >
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ 
              width: '100px', 
              height: '100px', 
              background: 'rgba(255, 176, 0, 0.1)', 
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 176, 0, 0.2)',
              boxShadow: '0 0 30px rgba(255, 176, 0, 0.1)'
            }}
          >
            <Lock size={48} color="var(--accent-gold)" />
          </motion.div>
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              background: 'var(--danger)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              color: '#fff',
              letterSpacing: '1px'
            }}
          >
            RESTRICTED
          </motion.div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h1 style={{ 
            fontFamily: "'Chakra Petch', sans-serif", 
            fontSize: '2.5rem',
            margin: 0,
            lineHeight: 1.2
          }}>
            <span className="text-gradient">IRIS SYSTEM LOCK</span>
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            maxWidth: '550px', 
            margin: '0 auto',
            fontSize: '1.1rem',
            lineHeight: 1.6
          }}>
            {t('common.maintenance_desc', 'This feature is currently undergoing maintenance. Please check back later.')}
          </p>
        </div>

        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          padding: '1.5rem', 
          borderRadius: '16px', 
          width: '100%',
          borderLeft: '4px solid var(--accent-gold)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'left'
        }}>
          <Construction size={24} color="var(--accent-gold)" />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {t('common.under_maintenance', 'Under Maintenance')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('common.maintenance_desc', 'System will be restored shortly.')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
          <button 
            className="btn-secondary"
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} /> {t('common.back', 'BACK')}
          </button>
          <button 
            className="btn-primary"
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Home size={18} /> {t('nav.home', 'HOME')}
          </button>
        </div>
      </motion.div>

      <div style={{ 
        position: 'absolute', 
        bottom: '2rem', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }}>
        BCT CORE ENGINE v3.0 
      </div>
    </div>
  );
};

export default Maintenance;

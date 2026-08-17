import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import { APP_PRESET_LOGOS, renderAppLogo } from '../constants/appLogos';

const TrustedApps = () => {
  const { t } = useTranslation();
  const { config } = useConfig();

  const displayApps = (config?.apps && config.apps.length > 0) ? config.apps : APP_PRESET_LOGOS;
  const marqueeApps = [...displayApps, ...displayApps];

  return (
    <section id="trusted-apps" style={{ padding: '1rem 0', overflow: 'hidden', position: 'relative' }}>
      <div className="container" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1.5rem',
            fontFamily: "'Chakra Petch', sans-serif"
          }}
          className="text-gradient"
        >
          {t('trusted.title')}
        </motion.h2>
        <div style={{ width: '60px', height: '4px', background: 'var(--accent-main)', margin: '0 auto' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '150px', height: '100%',
          background: 'linear-gradient(to right, var(--bg-main), transparent)',
          zIndex: 2, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '150px', height: '100%',
          background: 'linear-gradient(to left, var(--bg-main), transparent)',
          zIndex: 2, pointerEvents: 'none'
        }} />

        <motion.div 
          style={{ 
            display: 'flex', 
            gap: '3rem',
            padding: '2rem 0',
          }}
          animate={{ x: [0, -1920] }} 
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {marqueeApps.map((app, idx) => (
            <motion.div
              key={idx}
              whileHover={{ 
                scale: 1.1, 
                y: -5,
                boxShadow: `0 10px 25px -5px ${app.color || '#5e6ad2'}40`,
                borderColor: app.color || 'var(--accent-main)'
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '140px',
                height: '140px',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                {renderAppLogo(app, { width: '100%', height: '100%' })}
              </div>
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: '500',
                color: 'var(--text-muted)',
                letterSpacing: '0.5px'
              }}>
                {app.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedApps;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import './FilmStrip.css';
import { useConfig } from '../context/ConfigContext';

const FilmStrip = () => {
  const { t } = useTranslation();
  const { config } = useConfig();
  const images = config?.content?.filmStripImages || [];
  const speed = config?.content?.filmStripSpeed || 45;
  
  if (images.length === 0) return null;
  
  const duplicatedImages = [...images, ...images, ...images];

  return (
    <section className="film-strip-container" style={{ padding: '8rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ 
            fontFamily: "'Chakra Petch', sans-serif", 
            fontSize: 'var(--section-title-size, 3rem)', 
            letterSpacing: '2px', 
            color: 'var(--accent-main)' 
          }}
        >
          {t('sections.memories_title', '< Digital_Memories />')}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.2rem' }}
        >
          {t('sections.memories_subtitle', 'Lenses through time capturing the technical journey.')}
        </motion.p>
      </div>
      <div className="film-marquee-wrapper">
        <div className="film-marquee" style={{ animationDuration: `${speed}s` }}>
          {duplicatedImages.map((src, index) => {
            const isVideo = src?.match(/\.(mp4|webm|ogg|mov)$|^data:video/i);
            return (
              <div className="film-frame" key={index}>
                {isVideo ? (
                  <video src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={src} alt={`Ký ức ${index}`} loading="lazy" decoding="async" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FilmStrip;

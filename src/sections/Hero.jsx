import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TechSphere from '../components/TechSphere';
import QuoteCarousel from '../components/QuoteCarousel';
import { MessageSquare, Globe } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import SocialIcon from '../components/SocialIcon';

const RandomCounter = () => {
  const [count, setCount] = useState(10977846);

  useEffect(() => {
    
    const schedule = () => {
      const delay = 2000 + Math.random() * 2000; 
      return setTimeout(() => {
        setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
        schedule();
      }, delay);
    };
    const timer = schedule();
    return () => clearTimeout(timer);
  }, []);

  const formatted = count.toLocaleString('de-DE');

  return <span>{formatted}+</span>;
};

const Hero = () => {
  const { t } = useTranslation();
  const { config } = useConfig();
  
  const activeSocials = (config?.social_links && config.social_links.length > 0)
    ? config.social_links.filter(s => s.isVisible !== false).map(s => ({
        ...s,
        renderableIcon: s.iconUrl ? (
          <img src={s.iconUrl} alt={s.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
        ) : (
          <SocialIcon name={s.icon || s.name} size={20} />
        )
      }))
    : [
    { name: "Facebook", color: "#1877F2", renderableIcon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>, url: "#" },
    { name: "Github", color: "#2ea44f", renderableIcon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22"></path></svg>, url: "#" },
    { name: "LinkedIn", color: "#0A66C2", renderableIcon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, url: "#" },
    { name: "Youtube", color: "#FF0000", renderableIcon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>, url: "#" },
    { name: "Messenger", color: "#0084FF", renderableIcon: <MessageSquare size={20} />, url: "#" }
  ];

  return (
    <section id="home" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      paddingTop: '2rem'
    }} className="container">
      
      <div style={{ maxWidth: '1000px', zIndex: 10 }}>
        <motion.p 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: '1rem', letterSpacing: '1px', fontSize: '1.1rem' }}
        >
          {t('hero.greeting')}
        </motion.p>
        
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{ 
            fontSize: 'clamp(3rem, 8vw, 6rem)', 
            marginBottom: '1rem',
            fontFamily: "'Chakra Petch', sans-serif"
          }}
          className="text-gradient"
        >
          {t('hero.title')}
        </motion.h1>

        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
            color: 'var(--text-secondary)', 
            marginBottom: '2rem',
            fontFamily: "'Chakra Petch', sans-serif",
            fontWeight: 400
          }}
        >
          {t('hero.subtitle')}
        </motion.h2>

        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1, delay: 0.8 }}
        >
          <QuoteCarousel />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          style={{ display: 'flex', gap: '1.5rem', marginTop: '3rem' }}
        >
          <a href="#projects" className="btn-primary">
            {t('hero.cta_projects')}
          </a>
          <motion.a 
            href="#contact" 
            className="btn-secondary"
            animate={{ 
              boxShadow: [
                '0 0 0px var(--accent-secondary)', 
                '0 0 20px var(--accent-secondary)', 
                '0 0 0px var(--accent-secondary)'
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            style={{
              border: '2px solid var(--accent-secondary)',
              color: 'var(--accent-secondary)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {t('hero.cta_contact')}
          </motion.a>
        </motion.div>
        
        {}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', marginTop: '4rem', width: '100%' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}
          >
            {activeSocials.map((social, idx) => (
              <a 
                key={idx} 
                href={social.url || "/404"} 
                target="_blank"
                rel="noreferrer"
                className="glass-panel" 
                style={{ 
                  padding: '0.6rem 1rem', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.3s ease' 
                }}
                onMouseOver={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = social.color || '#fff';
                  e.currentTarget.style.boxShadow = `0 10px 20px -10px ${social.color || '#fff'}55`;
                  e.currentTarget.style.background = `${social.color || '#fff'}11`;
                  if (icon) icon.style.color = social.color || '#fff';
                  e.currentTarget.querySelector('span').style.color = social.color || '#fff';
                }}
                onMouseOut={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--bg-glass-border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'var(--bg-glass)';
                  if (icon) icon.style.color = 'inherit';
                  e.currentTarget.querySelector('span').style.color = 'var(--text-muted)';
                }}
              >
                {social.renderableIcon}
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  color: 'var(--text-muted)',
                  transition: 'color 0.3s'
                }}>
                  {social.name}
                </span>
              </a>
            ))}
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              fontFamily: '"Share Tech Mono", monospace',
              padding: '0.5rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--bg-glass-border)',
              background: 'var(--bg-glass)',
              height: '74px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--accent-main)', minWidth: '140px' }}>
                <RandomCounter />
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                total likes
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <motion.span 
                animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }} 
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ fontSize: '1.4rem', cursor: 'default' }}
                title="Love"
              >
                ❤️
              </motion.span>
              <motion.span 
                animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }} 
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                style={{ fontSize: '1.4rem', cursor: 'default' }}
                title="Like"
              >
                👍
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>

      <TechSphere />
    </section>
  );
};

export default Hero;

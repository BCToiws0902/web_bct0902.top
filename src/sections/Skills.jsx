import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Code2, Server, Terminal } from 'lucide-react';

const Skills = () => {
  const { t } = useTranslation();

  const skillCategories = [
    {
      title: t('skills.frontend'),
      icon: <Code2 size={32} color="var(--accent-main)" />,
      skills: ['React', 'Next.js', 'Vite', 'Framer Motion', 'Tailwind', 'Vanilla CSS']
    },
    {
      title: t('skills.backend'),
      icon: <Server size={32} color="var(--accent-secondary)" />,
      skills: ['Node.js', 'Express', 'Python', 'FastAPI', 'PostgreSQL', 'MongoDB']
    },
    {
      title: t('skills.tools'),
      icon: <Terminal size={32} color="var(--success)" />,
      skills: ['Git/GitHub', 'Docker', 'AWS', 'Vercel', 'Linux', 'CI/CD']
    }
  ];

  return (
    <section id="skills" className="container" style={{ padding: '4rem 2rem 1rem' }}>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        style={{ 
          fontSize: '3rem', 
          marginBottom: '4rem', 
          textAlign: 'center',
          fontFamily: "'Chakra Petch', sans-serif"
        }}
      >
        <span className="text-gradient">{t('skills.title')}</span>
      </motion.h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem' 
      }}>
        {skillCategories.map((cat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel"
            style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
          >
            {}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '100px',
              height: '100px',
              background: 'var(--accent-glow)',
              filter: 'blur(50px)',
              pointerEvents: 'none'
            }}/>

            <div style={{ marginBottom: '1.5rem' }}>{cat.icon}</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
              {cat.title}
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              {cat.skills.map((skill, i) => (
                <span 
                  key={i} 
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--bg-glass-border)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Skills;

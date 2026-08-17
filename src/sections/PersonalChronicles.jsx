import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Briefcase, School, BookOpen, Star, Rocket } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import MobileBottomNav from '../components/MobileBottomNav';
import './PersonalChronicles.css';

const Milestone = ({ milestone, index, isLast, image }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const icons = [
    <School size={24} />,
    <School size={24} />,
    <School size={24} />,
    <GraduationCap size={24} />,
    <Star size={24} />,
    <Briefcase size={24} />
  ];

  const isEven = index % 2 === 0;

  const rotateY = useTransform(scrollYProgress, [0, 1], [isEven ? -15 : 15, 0]);
  const translateZ = useTransform(scrollYProgress, [0, 1], [-100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  return (
    <div 
      ref={ref}
      className="chronicles-milestone-item"
      style={{ 
        position: 'relative', 
        display: 'flex', 
        justifyContent: isEven ? 'flex-start' : 'flex-end',
        paddingBottom: isLast ? 0 : '12rem',
        paddingLeft: isEven ? '0' : '5%',
        paddingRight: isEven ? '5%' : '0',
        perspective: '1200px'
      }}
    >
      {}
      <motion.div 
        className="glass-panel chronicles-milestone-card"
        style={{ 
          width: '45%',
          opacity,
          rotateY,
          z: translateZ,
          scale,
          transformStyle: 'preserve-3d',
          padding: '2.5rem', 
          background: 'var(--bg-glass)', 
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          zIndex: 5,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        {}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: `radial-gradient(circle at ${isEven ? 'top left' : 'top right'}, rgba(var(--accent-rgb), 0.1), transparent)`,
          pointerEvents: 'none',
          zIndex: -1
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <motion.span 
            style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '1.2rem', 
                color: 'var(--accent-main)',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(var(--accent-rgb), 0.5)'
            }}
            >
            {milestone.year}
            </motion.span>
            <div style={{ color: 'var(--accent-secondary)', filter: 'drop-shadow(0 0 5px var(--accent-secondary))' }}>{icons[index]}</div>
        </div>

        <div style={{ flex: 1, transform: 'translateZ(20px)' }}> {}
            <h3 style={{ fontFamily: 'Chakra Petch', fontSize: '1.4rem', color: '#fff', marginBottom: '1rem', letterSpacing: '1px' }}>{milestone.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: milestone.achievements?.length > 0 ? '1.5rem' : 0 }}>{milestone.desc}</p>
            
            {milestone.achievements?.length > 0 && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.8rem',
                paddingLeft: '0.5rem',
                borderLeft: '2px solid rgba(var(--accent-rgb), 0.3)',
                marginTop: '1rem'
              }}>
                {milestone.achievements.map((ach, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#ddd', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.6rem',
                      lineHeight: 1.4
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-main)', boxShadow: '0 0 5px var(--accent-main)' }} />
                    {ach}
                  </motion.div>
                ))}
              </div>
            )}
        </div>

        {image && (
            <motion.div 
              style={{ 
                width: '100%', 
                height: '240px', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                border: '1px solid rgba(255,255,255,0.1)',
                transform: 'translateZ(10px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}
            >
                <img src={image} alt={milestone.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
        )}
        
        {}
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, transform: 'rotate(-15deg) translateZ(-10px)' }}>
            {icons[index] && React.cloneElement(icons[index], { size: 140 })}
        </div>
      </motion.div>

      {}
      <div 
        className="chronicles-node"
        style={{ 
            position: 'absolute', 
            left: '50%', 
            top: '40px', 
            transform: 'translateX(-50%)',
            zIndex: 10 
        }}
      >
        <motion.div 
            style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, var(--accent-main), #000)',
                boxShadow: '0 0 30px var(--accent-main), inset -2px -2px 5px rgba(255,255,255,0.3)',
                scale: useTransform(scrollYProgress, [0, 1], [0.6, 1.2]),
                border: '1px solid rgba(255,255,255,0.2)'
            }}
        />
        {}
        <motion.div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '40px',
            height: '40px',
            border: '1px solid rgba(var(--accent-rgb), 0.3)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotateX(70deg)',
            opacity: useTransform(scrollYProgress, [0, 1], [0, 0.8])
          }}
        />
      </div>
    </div>
  );
};

const CurvyPath = ({ scrollYProgress }) => {
    const pathLength = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    return (
        <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 100 1000" 
            preserveAspectRatio="none"
            style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none',
                overflow: 'visible'
            }}
        >
            <path 
                d="M50,0 C70,100 30,200 50,300 C70,400 30,500 50,600 C70,700 30,800 50,900 C70,950 50,1000 50,1100"
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="0.3"
            />
            <motion.path 
                d="M50,0 C70,100 30,200 50,300 C70,400 30,500 50,600 C70,700 30,800 50,900 C70,950 50,1000 50,1100"
                fill="none"
                stroke="var(--accent-main)"
                strokeWidth="1.2"
                style={{ pathLength: pathLength }}
                filter="drop-shadow(0 0 12px var(--accent-main))"
                opacity={0.6}
            />
        </svg>
    );
};

const PersonalChronicles = () => {
  const { t } = useTranslation();
  const { config } = useConfig();
  const containerRef = useRef(null);
  
  const images = config?.content?.filmStripImages || [];
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const milestones = [];
  for(let i=1; i<=6; i++) {
    const achievementKey = `chronicles.m${i}.achievements`;
    const achievements = t(achievementKey, { returnObjects: true });
    
    milestones.push({
      year: t(`chronicles.m${i}.year`),
      title: t(`chronicles.m${i}.title`),
      desc: t(`chronicles.m${i}.desc`),
      achievements: Array.isArray(achievements) ? achievements : []
    });
  }

  return (
    <>
      <section 
          id="chronicles" 
          ref={containerRef}
          style={{ 
              position: 'relative', 
              background: 'transparent',
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '10rem 2rem'
          }}
      >
        <div 
          style={{ position: 'relative' }}
        >
          {}
          <CurvyPath scrollYProgress={scrollYProgress} />

          <div style={{ position: 'relative', zIndex: 2 }}>
              <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="chronicles-page-header"
                  style={{ textAlign: 'center', marginBottom: '8rem' }}
              >
                  <h2 className="text-gradient" style={{ fontSize: '3.5rem', fontFamily: 'Chakra Petch' }}>{t('chronicles.title')}</h2>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>{t('chronicles.subtitle')}</p>
              </motion.div>

              <div className="chronicles-milestone-list" style={{ display: 'flex', flexDirection: 'column' }}>
                  {milestones.map((milestone, idx) => (
                      <Milestone 
                          key={idx} 
                          milestone={milestone} 
                          index={idx} 
                          isLast={idx === milestones.length - 1} 
                          image={images[idx]}
                      />
                  ))}
              </div>
          </div>
        </div>
      </section>
      <MobileBottomNav />
    </>
  );
};

export default PersonalChronicles;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Quote, Star } from 'lucide-react';

const Testimonials = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === 0 ? 1 : 0));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const getTestimonialList = () => {
    const list = [];
    for (let i = 1; i <= 6; i++) {
      list.push({
        id: i,
        name: t(`testimonials.list.${i}.name`),
        role: t(`testimonials.list.${i}.role`),
        content: t(`testimonials.list.${i}.content`),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Person${i}`,
        stars: 5
      });
    }
    return list;
  };

  const allTestimonials = getTestimonialList();
  const displaySet = currentIndex === 0 ? allTestimonials.slice(0, 3) : allTestimonials.slice(3, 6);

  const flickerVariants = {
    initial: { opacity: 0, filter: 'brightness(2)' },
    animate: { opacity: 1, filter: 'brightness(1)', transition: { duration: 0.3 } },
    exit: { opacity: 0, filter: 'brightness(2)', transition: { duration: 0.2 } }
  };

  return (
    <section id="testimonials" style={{ padding: '4rem 2rem', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
             <h2 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem', fontFamily: 'Chakra Petch' }}>
                {t('testimonials.title', '< TRUSTED_VOICES />')}
             </h2>
             <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                {t('testimonials.subtitle')}
             </p>
          </motion.div>
        </header>

        <div style={{ minHeight: '320px', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              variants={flickerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '2rem' 
              }}
            >
              {displaySet.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{ padding: '2.5rem', position: 'relative', background: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Quote size={40} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.1, color: 'var(--accent-main)' }} />
                  
                  <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1.5rem' }}>
                    {[...Array(item.stars)].map((_, i) => <Star key={i} size={16} fill="var(--accent-main)" color="var(--accent-main)" />)}
                  </div>

                  <p style={{ fontStyle: 'italic', marginBottom: '2rem', lineHeight: '1.6', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    "{item.content}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={item.avatar} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--accent-main)' }} />
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, color: 'var(--text-secondary)' }}>{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem', 
          marginTop: '4rem' 
        }}>
          {[0, 1].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? '30px' : '12px',
                height: '12px',
                borderRadius: '6px',
                background: idx === currentIndex ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: idx === currentIndex ? '0 0 10px var(--accent-main)' : 'none'
              }}
              title={`Set ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExternalLink, GitBranch } from 'lucide-react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';

const Projects = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'projects'));
        const projs = [];
        querySnapshot.forEach((docSnap) => {
          projs.push({ id: docSnap.id, ...docSnap.data() });
        });
        projs.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        setProjects(projs);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };
    fetchProjects();
  }, []);

  return (
    <section id="projects" className="container" style={{ padding: '8rem 2rem' }}>
      <motion.h2 
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        style={{ fontSize: '3rem', marginBottom: '4rem' }}
      >
        <span className="text-gradient">{t('projects.title')}</span>
      </motion.h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        {projects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              alignItems: 'center',
              border: '1px solid var(--bg-glass-border)',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              padding: '2rem',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, left: 0, bottom: 0, width: '4px',
              background: project.color
            }} />

            <div style={{ aspectRatio: '16/9', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--bg-glass-border)', overflow: 'hidden' }}>
              {(project.thumbnail || project.image) ? (
                <img src={project.thumbnail || project.image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>[ {project.title} ]</span>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                {project.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                {project.description}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {(Array.isArray(project.tags) ? project.tags : (project.tech || [])).map((tItem, i) => (
                  <span key={i} style={{ color: project.color || 'var(--accent-main)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                    {tItem}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="btn-secondary">
                    <GitBranch size={18} /> {t('projects.view_source')}
                  </a>
                )}
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: project.color, color: '#000', textDecoration: 'none' }} className="btn-primary">
                    <ExternalLink size={18} /> {t('projects.live_demo')}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Projects;

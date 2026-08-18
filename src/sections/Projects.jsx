import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExternalLink, GitBranch } from 'lucide-react';

const Projects = () => {
  const { t } = useTranslation();

  const projects = [
    {
      id: 'eink',
      title: "AESL0213 E-Ink BLE",
      description: "Ứng dụng web điều khiển và nạp ảnh 3 màu (Đen, Trắng, Đỏ) lên màn hình mực điện tử AESL0213 qua giao thức Bluetooth Low Energy (Web BLE).",
      tech: ["Web Bluetooth", "E-Ink 122x250", "nRF52811", "Floyd-Steinberg"],
      color: "var(--accent-main)",
      demoUrl: "https://bctoiws0902.github.io/sent_pic_to_eink/",
      githubUrl: "https://github.com/BCToiws0902/sent_pic_to_eink"
    },
    {
      id: 1,
      title: "CyberSystem OS",
      description: "A highly interactive web-based operating system visualization using React and Framer Motion.",
      tech: ["React", "Framer", "Zustand"],
      color: "var(--accent-secondary)",
      demoUrl: "https://github.com/BCToiws0902",
      githubUrl: "https://github.com/BCToiws0902"
    },
    {
      id: 2,
      title: "Neon E-commerce",
      description: "Full-stack e-commerce platform with dark mode default, Stripe integration, and real-time inventory.",
      tech: ["Next.js", "Node.js", "MongoDB"],
      color: "#f59e0b",
      demoUrl: "https://github.com/BCToiws0902",
      githubUrl: "https://github.com/BCToiws0902"
    }
  ];

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

            <div style={{ aspectRatio: '16/9', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--bg-glass-border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>[ {project.title} ]</span>
            </div>

            <div>
              <h3 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                {project.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                {project.description}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {project.tech.map((tItem, i) => (
                  <span key={i} style={{ color: project.color, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
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

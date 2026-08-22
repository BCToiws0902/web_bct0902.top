import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  Cpu, 
  ExternalLink,
  GitBranch,
  Eye,
  Download,
  Laptop
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import LoadingScreen from '../components/LoadingScreen';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProject(data);
          
          // Anti-spam view increment: Count only once per browser session
          const sessionKey = `bct_viewed_proj_${id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            updateDoc(docRef, {
              views: increment(1)
            }).catch(console.error);
          }
        } else {
          navigate('/showcase');
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        navigate('/showcase');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  const handleMainAction = async () => {
    const targetUrl = project?.demoUrl || project?.downloadUrl || project?.githubUrl;
    if (!targetUrl || connecting) return;
    
    setConnecting(true);
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setTimeout(() => setConnecting(false), 1000);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!project) return null;

  const galleryList = Array.isArray(project.galleryImages) ? project.galleryImages : [];
  const defaultActionText = project.demoUrl ? t('project.access_web', 'OPEN WEB APP') : project.downloadUrl ? t('project.download_exe', 'DOWNLOAD .EXE') : t('project.view_github', 'GITHUB REPOSITORY');
  const actionText = project.actionButtonLabel || defaultActionText;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '100px' }}>
      <Navbar />
      
      <div className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <motion.button 
          onClick={() => navigate('/showcase')}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', marginBottom: '2rem', fontSize: '0.9rem'
          }}
        >
          <ArrowLeft size={16} /> {t('project.back', 'BACK TO SHOWCASE')}
        </motion.button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem' }} className="project-detail-grid">
          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Hero Cover */}
            <div style={{ 
              width: '100%', aspectRatio: '16/9', borderRadius: '24px', 
              overflow: 'hidden', marginBottom: '2.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
              <img 
                src={project.thumbnail || project.coverImage || project.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200'} 
                alt={project.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <h1 style={{ fontSize: '3rem', fontFamily: 'Chakra Petch', marginBottom: '1rem' }} className="text-gradient">
              {project.title}
            </h1>

            {/* Meta Tags Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', opacity: 0.7, fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} /> {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : new Date(project.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={14} /> {t('project.version', 'Version')} {project.version || 'v1.0.0'}
              </span>
              {project.platform && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Laptop size={14} /> {project.platform}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 600 }}>
                <Eye size={14} /> {project.views || project.downloadCount || 1} {t('project.views', 'views')}
              </span>
            </div>

            {/* Gallery Section */}
            {galleryList.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'Chakra Petch', marginBottom: '1.2rem', color: 'var(--text-primary)' }}>
                  📸 {t('project.gallery_title', 'PRODUCT GALLERY')} ({galleryList.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {galleryList.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveImageIdx(idx)}
                      style={{ 
                        borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <img src={item.url} alt={item.caption || `Image ${idx + 1}`} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                      {item.caption && (
                        <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Body */}
            <div className="markdown-body" style={{ 
              color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.1rem'
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {project.content || project.fullDescription || project.longDescription || project.description || ''}
              </ReactMarkdown>
            </div>
          </motion.main>

          {/* Sidebar Info */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Cpu size={18} /> {t('project.tech_used', 'TECH STACK')}
              </h3>
              
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                {(Array.isArray(project.tags) ? project.tags : (project.tech || [])).map((tech, i) => (
                  <span key={i} style={{ 
                    padding: '6px 12px', background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)'
                  }}>
                    {tech}
                  </span>
                ))}
              </div>

              {/* Specs Box */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('project.category', 'Category:')}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{project.category || 'Tool'}</span>
                </div>
                {project.platform && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('project.platform', 'Platform:')}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{project.platform}</span>
                  </div>
                )}
                {project.fileSize && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('project.file_size', 'File Size:')}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{project.fileSize}</span>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.9rem' }}>
                  <ShieldCheck size={16} /> {t('project.verified', 'VERIFIED & SECURE')}
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>
                  {t('project.verified_desc', 'Tested and verified directly by BCT Studio.')}
                </p>
              </div>

              {/* Main Action Button */}
              {(project.demoUrl || project.downloadUrl || project.githubUrl) && (
                <button 
                  onClick={handleMainAction}
                  disabled={connecting}
                  style={{ 
                    width: '100%', padding: '1.1rem', borderRadius: '12px',
                    background: connecting ? 'rgba(255,255,255,0.1)' : 'var(--accent-main)',
                    color: connecting ? 'var(--text-muted)' : '#000',
                    border: 'none', fontWeight: 800, fontSize: '0.95rem',
                    cursor: connecting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                    boxShadow: connecting ? 'none' : '0 10px 30px rgba(var(--accent-rgb), 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {connecting ? t('project.connecting', 'CONNECTING...') : (
                    <>
                      {project.demoUrl ? <ExternalLink size={18} /> : project.downloadUrl ? <Download size={18} /> : <GitBranch size={18} />}
                      {actionText}
                    </>
                  )}
                </button>
              )}

              {/* Secondary Action: GitHub */}
              {project.githubUrl && project.demoUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%', padding: '0.85rem', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    textDecoration: 'none', marginTop: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <GitBranch size={16} /> {t('project.view_github', 'GITHUB REPOSITORY')}
                </a>
              )}
            </div>
          </motion.aside>
        </div>
      </div>

      {/* LIGHTBOX PREVIEW */}
      {activeImageIdx !== null && galleryList[activeImageIdx] && (
        <div 
          onClick={() => setActiveImageIdx(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '2rem'
          }}
        >
          <img 
            src={galleryList[activeImageIdx].url} 
            alt={galleryList[activeImageIdx].caption} 
            style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain' }} 
          />
          {galleryList[activeImageIdx].caption && (
            <div style={{ marginTop: '1rem', color: '#fff', fontSize: '1rem', fontWeight: 600 }}>
              {galleryList[activeImageIdx].caption}
            </div>
          )}
          <span style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {t('project.close_hint', '(Click anywhere to close)')}
          </span>
        </div>
      )}

      <MobileBottomNav />

      <style>{`
        .markdown-body h2 { margin-top: 2rem; margin-bottom: 1rem; color: var(--text-primary); font-family: 'Chakra Petch'; }
        .markdown-body h3 { margin-top: 1.5rem; margin-bottom: 0.8rem; color: var(--text-primary); }
        .markdown-body p { margin-bottom: 1.2rem; }
        .markdown-body ul { margin-bottom: 1.5rem; padding-left: 1.5rem; }
        .markdown-body li { margin-bottom: 0.5rem; }
        .markdown-body img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; border: 1px solid rgba(255,255,255,0.1); }
        .markdown-body em { display: block; text-align: center; font-size: 0.85rem; color: var(--text-muted); margin-top: -0.8rem; margin-bottom: 1.5rem; }
        
        @media (max-width: 992px) {
          .project-detail-grid { grid-template-columns: 1fr; }
          .project-detail-grid aside { order: -1; }
        }
      `}</style>
    </div>
  );
};

export default ProjectDetail;
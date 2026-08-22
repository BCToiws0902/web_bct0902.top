import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Eye
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';

const Showcase = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'projects'));
        const projs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        projs.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        setProjects(projs);
      } catch (err) {
        console.error("Error fetching showcase projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '100px' }}>
      <Navbar />
      
      <section style={{ 
        padding: '6.5rem 2rem 1.5rem', 
        textAlign: 'center', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80vw', height: '60vh',
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          opacity: 0.1, zIndex: 0, filter: 'blur(100px)'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-gradient" style={{ 
              fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', 
              fontFamily: 'Chakra Petch',
              margin: 0
            }}>
              {t('showcase.title', '< SHOWCASE />')}
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="container" style={{ padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
            {t('showcase.loading', 'LOADING SHOWCASE...')}
          </div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {t('showcase.empty', 'No projects or utilities published yet.')}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="glass-panel"
                onClick={() => navigate(`/showcase/${project.id}`)}
                style={{
                  padding: '1.5rem',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                whileHover={{ 
                  transform: 'translateY(-10px)',
                  borderColor: 'var(--accent-main)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
              >
                {/* Thumbnail */}
                <div style={{ 
                  width: '100%', aspectRatio: '16/9', borderRadius: '12px', 
                  overflow: 'hidden', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                   <img src={project.thumbnail || project.coverImage || project.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600'} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Info */}
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontFamily: 'Chakra Petch', margin: 0 }}>
                      {project.title}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-main)', opacity: 0.8 }}>{project.version || 'v1.0.0'}</span>
                  </div>
                  
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', height: '3em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {project.description || project.shortDescription}
                  </p>
                </div>

                {/* Tech Tags */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0 0.5rem' }}>
                  {(project.tags || project.techStack || []).slice(0, 3).map((tag, i) => (
                    <span key={i} style={{ 
                      fontSize: '0.65rem', color: 'var(--text-muted)', 
                      background: 'rgba(255,255,255,0.05)', padding: '2px 8px', 
                      borderRadius: '4px'
                    }}>
                      {tag}
                    </span>
                  ))}
                  {(project.tags || project.techStack || []).length > 3 && (
                    <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>+{(project.tags || project.techStack || []).length - 3}</span>
                  )}
                </div>

                {/* Footer action */}
                 <div style={{ 
                  marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--accent-main)'
                }}>
                   <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {t('showcase.view_details', 'DETAILS')} <ChevronRight size={14} />
                   </span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.7, fontSize: '0.75rem', color: '#10b981' }}>
                      <Eye size={14} /> {(Number(project.customViews || 0) + Number(project.views || 0)).toLocaleString()}
                   </div>
                 </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <MobileBottomNav />
    </div>
  );
};

export default Showcase;

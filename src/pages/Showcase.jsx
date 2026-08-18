import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Code, 
  Sparkles, 
  Box, 
  Layout as LayoutIcon, 
  Cpu, 
  ChevronRight,
  Download
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import LoadingScreen from '../components/LoadingScreen';

const GithubIcon = ({ size = 16 }) => (
  <svg 
    width={size} height={size} viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" strokeWidth="2" 
    strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22" />
  </svg>
);

const DEFAULT_SHOWCASE_PROJECTS = [
  {
    id: 'aesl0213-eink-ble',
    title: 'AESL0213 E-Ink BLE',
    category: 'IoT / Web Bluetooth',
    tags: ['Web BLE', 'E-Ink 122x250', 'nRF52811', 'Floyd-Steinberg'],
    description: 'Ứng dụng web điều khiển và nạp ảnh 3 màu (Đen, Trắng, Đỏ) lên màn hình mực điện tử AESL0213 qua giao thức Bluetooth Low Energy (Web BLE).',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
    demoUrl: 'https://bctoiws0902.github.io/sent_pic_to_eink/',
    downloadUrl: 'https://bctoiws0902.github.io/sent_pic_to_eink/',
    version: '1.0.0',
    createdAt: new Date().toISOString()
  }
];

const Showcase = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = React.useState(DEFAULT_SHOWCASE_PROJECTS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setProjects(DEFAULT_SHOWCASE_PROJECTS);
        }
      } catch (err) {
        console.error(err);
        setProjects(DEFAULT_SHOWCASE_PROJECTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '100px' }}>
      <Navbar />
      {}
      <section style={{ 
        padding: '8rem 2rem 4rem', 
        textAlign: 'center', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        {}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80vw', height: '60vh',
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          opacity: 0.1, zIndex: 0, filter: 'blur(100px)'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <button 
              onClick={() => navigate('/')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                color: 'var(--text-secondary)', background: 'transparent',
                cursor: 'pointer', marginBottom: '2rem',
                fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '30px',
                border: '1px solid var(--bg-glass-border)', margin: '0 auto 2rem'
              }}
            >
              <ArrowLeft size={16} /> {t('nav.back_home')}
            </button>
            <h1 className="text-gradient" style={{ 
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
              fontFamily: 'Chakra Petch',
              marginBottom: '1rem'
            }}>
              {t('utilities.gallery_title', '< PHÒNG TRƯNG BÀY />')}
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)', 
              maxWidth: '700px', 
              margin: '0 auto',
              fontSize: '1.1rem',
              lineHeight: '1.8'
            }}>
              {t('utilities.gallery_subtitle', 'Nơi hội tụ những ý tưởng kỹ thuật số và các công trình kiến trúc mã nguồn đầy tâm huyết.')}
            </p>
          </motion.div>
        </div>
      </section>

      {}
      <section className="container" style={{ padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>ĐANG TẢI DỮ LIỆU DỰ ÁN...</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
            gap: '2.5rem' 
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
                {}
                <div style={{ 
                  width: '100%', aspectRatio: '16/9', borderRadius: '12px', 
                  overflow: 'hidden', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                   <img src={project.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600'} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {}
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontFamily: 'Chakra Petch', margin: 0 }}>
                      {project.title}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-main)', opacity: 0.8 }}>v{project.version || '1.0.0'}</span>
                  </div>
                  
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', height: '3em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {project.description}
                  </p>
                </div>

                {}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0 0.5rem' }}>
                  {project.techStack?.slice(0, 3).map((tag, i) => (
                    <span key={i} style={{ 
                      fontSize: '0.65rem', color: 'var(--text-muted)', 
                      background: 'rgba(255,255,255,0.05)', padding: '2px 8px', 
                      borderRadius: '4px'
                    }}>
                      {tag}
                    </span>
                  ))}
                  {project.techStack?.length > 3 && <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>+{project.techStack.length - 3}</span>}
                </div>

                {}
                <div style={{ 
                  marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--accent-main)'
                }}>
                   <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      CHI TIẾT <ChevronRight size={14} />
                   </span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.6, fontSize: '0.75rem' }}>
                      <Download size={14} /> {project.downloadCount || 0}
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

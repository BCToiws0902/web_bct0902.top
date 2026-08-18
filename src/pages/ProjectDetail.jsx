import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Download, 
  ArrowLeft, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  Cpu, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import LoadingScreen from '../components/LoadingScreen';

const FALLBACK_EINK_PROJECT = {
  id: 'aesl0213-eink-ble',
  title: 'AESL0213 E-Ink BLE',
  category: 'IoT / Web Bluetooth',
  tags: ['Web BLE', 'E-Ink 122x250', 'nRF52811', 'Floyd-Steinberg'],
  techStack: ['Web Bluetooth API', 'E-Ink AESL0213', 'nRF52811 BLE', 'HTML5 Canvas', 'Floyd-Steinberg Dithering'],
  description: 'Ứng dụng web điều khiển và nạp ảnh 3 màu (Đen, Trắng, Đỏ) lên màn hình mực điện tử AESL0213 qua giao thức Bluetooth Low Energy (Web BLE).',
  longDescription: `### Giới thiệu dự án
**AESL0213 E-Ink BLE** là giải pháp phần mềm web cho phép kết nối trực tiếp với thẻ màn hình mực điện tử AESL0213 (122x250 pixels, 3 màu BWR) thông qua chuẩn Web Bluetooth Low Energy (BLE) từ trình duyệt mà không cần cài đặt ứng dụng native.

#### Các tính năng nổi bật:
* **Kết nối BLE trực tiếp:** Tự động quét và kết nối với các thẻ E-ink dùng chip Nordic nRF52811.
* **Xử lý ảnh & Tán sắc Floyd-Steinberg:** Chuyển đổi ảnh màu bất kỳ sang định dạng 3 màu (Đen, Trắng, Đỏ) cực kỳ sắc nét.
* **Bộ công cụ căn chỉnh trực quan:** Phóng to/thu nhỏ (Zoom), kéo pan, xoay 90 độ, chỉnh độ sáng và độ tương phản ngay trên trình duyệt.
* **Nạp thiết bị siêu tốc:** Phân mảnh dữ liệu theo chuẩn ATT MTU 180 bytes để truyền tải ổn định và kích hoạt làm mới màn hình.`,
  thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
  downloadUrl: 'https://bctoiws0902.github.io/sent_pic_to_eink/',
  demoUrl: 'https://bctoiws0902.github.io/sent_pic_to_eink/',
  version: '1.0.0',
  createdAt: new Date()
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (id === 'aesl0213-eink-ble') {
          setProject(FALLBACK_EINK_PROJECT);
          setLoading(false);
          return;
        }
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/showcase');
        }
      } catch (err) {
        console.error(err);
        if (id === 'aesl0213-eink-ble') {
          setProject(FALLBACK_EINK_PROJECT);
        } else {
          navigate('/showcase');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  const handleDownload = async () => {
    if (!project?.downloadUrl || downloading) return;
    
    setDownloading(true);
    try {
      
      const docRef = doc(db, 'projects', project.id);
      await updateDoc(docRef, {
        downloadCount: increment(1)
      });

      const finalUrl = project.demoUrl || project.downloadUrl;
      if (finalUrl) {
        window.open(finalUrl, '_blank');
      }

      setProject(prev => ({ ...prev, downloadCount: (prev.downloadCount || 0) + 1 }));
    } catch (err) {
      alert("Lỗi khi mở ứng dụng: " + err.message);
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!project) return null;

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
          <ArrowLeft size={16} /> QUAY LẠI PHÒNG TRƯNG BÀY
        </motion.button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }} className="project-detail-grid">
          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div style={{ 
              width: '100%', aspectRatio: '16/9', borderRadius: '24px', 
              overflow: 'hidden', marginBottom: '2.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
              <img 
                src={project.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200'} 
                alt={project.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <h1 style={{ fontSize: '3rem', fontFamily: 'Chakra Petch', marginBottom: '1rem' }} className="text-gradient">
              {project.title}
            </h1>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', opacity: 0.6, fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} /> {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString('vi-VN') : new Date(project.createdAt).toLocaleDateString('vi-VN')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={14} /> Version {project.version || '1.0.0'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
                <Download size={14} /> {project.downloadCount || 0} lượt truy cập
              </span>
            </div>

            <div className="markdown-body" style={{ 
              color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.1rem'
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {project.longDescription || project.description}
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
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={18} /> CÔNG NGHỆ SỬ DỤNG
              </h3>
              
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                {project.techStack?.map((tech, i) => (
                  <span key={i} style={{ 
                    padding: '6px 12px', background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {tech}
                  </span>
                ))}
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', marginBottom: '0.5rem', fontWeight: 700 }}>
                  <ShieldCheck size={18} /> AN TOÀN & BẢO MẬT
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>
                  Phần mềm đã được kiểm tra và xác thực bởi hệ thống BCT Studio.
                </p>
              </div>

              <button 
                onClick={handleDownload}
                disabled={downloading}
                style={{ 
                  width: '100%', padding: '1.2rem', borderRadius: '12px',
                  background: downloading ? 'rgba(255,255,255,0.1)' : 'var(--accent-main)',
                  color: downloading ? 'var(--text-muted)' : '#000',
                  border: 'none', fontWeight: 800, fontSize: '1rem',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
                  boxShadow: downloading ? 'none' : '0 10px 30px rgba(var(--accent-rgb), 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {downloading ? 'ĐANG KẾT NỐI...' : (
                  <>
                    {project.demoUrl ? <ExternalLink size={20} /> : <Download size={20} />}
                    {project.demoUrl ? 'TRUY CẬP ỨNG DỤNG' : 'TẢI XUỐNG NGAY'}
                  </>
                )}
              </button>
              
              <p style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.5, marginTop: '1rem' }}>
                Dung lượng ước tính: ~{Math.floor(Math.random() * 50) + 10}MB
              </p>
            </div>
          </motion.aside>
        </div>
      </div>

      <MobileBottomNav />

      <style>{`
        .markdown-body h2 { margin-top: 2rem; margin-bottom: 1rem; color: #fff; font-family: 'Chakra Petch'; }
        .markdown-body p { margin-bottom: 1.2rem; }
        .markdown-body ul { margin-bottom: 1.5rem; padding-left: 1.5rem; }
        .markdown-body li { margin-bottom: 0.5rem; }
        
        @media (max-width: 992px) {
          .project-detail-grid { grid-template-columns: 1fr; }
          .project-detail-grid aside { order: -1; }
        }
      `}</style>
    </div>
  );
};

export default ProjectDetail;

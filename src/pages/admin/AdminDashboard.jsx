import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Globe,
  Palette,
  FileText,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  ExternalLink,
  Users,
  Home,
  Activity,
  Edit,
  X,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Crop,
  Package,
  Menu,
  Lock,
  Film
} from 'lucide-react';

import { db } from '../../firebase';
import { doc, setDoc, collection, getDocs, deleteDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useConfig, DEFAULT_CONFIG } from '../../context/ConfigContext';
import SocialIcon from '../../components/SocialIcon';
import { APP_PRESET_LOGOS, renderAppLogo } from '../../constants/appLogos';
import { APP_ROUTES } from '../../constants/routes';
import './AdminDashboard.css';

const SOCIAL_PLATFORMS = [
  { name: 'Facebook', color: '#1877F2', icon: 'Facebook' },
  { name: 'YouTube', color: '#FF0000', icon: 'YouTube' },
  { name: 'GitHub', color: '#181717', icon: 'GitHub' },
  { name: 'TikTok', color: '#000000', icon: 'TikTok' },
  { name: 'Telegram', color: '#26A5E4', icon: 'Telegram' },
  { name: 'X (Twitter)', color: '#000000', icon: 'X' },
  { name: 'Instagram', color: '#E4405F', icon: 'Instagram' },
  { name: 'Discord', color: '#5865F2', icon: 'Discord' },
  { name: 'Zalo', color: '#0068FF', icon: 'Zalo' },
  { name: 'Reddit', color: '#FF4500', icon: 'Reddit' },
  { name: 'Threads', color: '#000000', icon: 'Threads' },
  { name: 'Website', color: '#4B5563', icon: 'Globe' }
];

const AdminDashboard = () => {
  const { config, loading } = useConfig();
  const [activeTab, setActiveTab] = useState('general');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [adjustmentModal, setAdjustmentModal] = useState({ isOpen: false, src: '', callback: null, aspect: 16 / 9 });
  const [activeIconPickerIdx, setActiveIconPickerIdx] = useState(null);
  const [activeAppLogoPickerIdx, setActiveAppLogoPickerIdx] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previewContainerRef = useRef(null);

  // Homepage sub-tab state
  const [homepageSubTab, setHomepageSubTab] = useState('filmstrip'); // 'filmstrip' | 'apps' | 'quotes'

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [userModal, setUserModal] = useState({ isOpen: false, mode: 'add', data: {} });

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsFilter, setAnalyticsFilter] = useState('all'); // 'all' | 'desktop' | 'mobile'
  const [trafficPage, setTrafficPage] = useState(1);
  const TRAFFIC_PER_PAGE = 20;

  // Blog State
  const [blogPosts, setBlogPosts] = useState([]);

  // Projects State
  const [projectsList, setProjectsList] = useState([]);
  const [projectModal, setProjectModal] = useState({ isOpen: false, mode: 'add', data: {} });

  const handleSaveRef = useRef();

  // Keyboard shortcut: Ctrl+S / Cmd+S to Save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (config) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
    }
  }, [config]);

  // Fetch collections when switching tabs
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'blog') fetchBlogPosts();
    if (activeTab === 'projects') fetchProjects();
  }, [activeTab]);

  // Realtime Traffic Analytics Stream
  useEffect(() => {
    if (activeTab === 'analytics') {
      const q = query(collection(db, 'system_analytics'), orderBy('timestamp', 'desc'), limit(200));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = [];
        snapshot.forEach((d) => {
          data.push({ id: d.id, ...d.data() });
        });
        setAnalyticsData(data);
      }, (err) => {
        console.error("Analytics stream error:", err);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  // Compute analytics grouped by unique visitor
  const groupedVisitors = useMemo(() => {
    const map = {};
    analyticsData.forEach(item => {
      const vid = item.visitorId || (item.isAdmin ? 'admin_session' : `guest_${item.userAgent?.slice(0, 25)}`);
      if (!map[vid]) {
        const isMobile = Boolean(item.isMobile || /Android|iPhone|iPad/i.test(item.userAgent || '') || /Mobile|iPhone|Android|iPad/i.test(item.deviceLabel || ''));
        map[vid] = {
          visitorId: vid,
          isAdmin: Boolean(item.isAdmin),
          isMobile,
          deviceLabel: item.deviceLabel || (isMobile ? 'Mobile · Browser' : 'Desktop · Browser'),
          ip: item.ip || '',
          city: item.city || '',
          country: item.country || '',
          countryCode: item.countryCode || '',
          totalHits: 0,
          paths: new Set(),
          lastTimestamp: item.timestamp,
          events: []
        };
      }
      if (item.ip && !map[vid].ip) map[vid].ip = item.ip;
      if (item.city && !map[vid].city) map[vid].city = item.city;
      if (item.country && !map[vid].country) map[vid].country = item.country;
      if (item.countryCode && !map[vid].countryCode) map[vid].countryCode = item.countryCode;

      map[vid].totalHits += 1;
      if (item.path) map[vid].paths.add(item.path);
      map[vid].events.push(item);
      if (item.timestamp && (!map[vid].lastTimestamp || (item.timestamp?.seconds && item.timestamp.seconds > (map[vid].lastTimestamp?.seconds || 0)))) {
        map[vid].lastTimestamp = item.timestamp;
      }
    });

    return Object.values(map).sort((a, b) => {
      const timeA = a.lastTimestamp?.seconds || 0;
      const timeB = b.lastTimestamp?.seconds || 0;
      return timeB - timeA;
    });
  }, [analyticsData]);

  const activeNowCount = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    return groupedVisitors.filter(v => {
      const lastSec = v.lastTimestamp?.seconds || (v.lastTimestamp ? Math.floor(new Date(v.lastTimestamp).getTime() / 1000) : 0);
      return (nowSec - lastSec) <= 300; // Hoạt động trong 5 phút gần đây
    }).length;
  }, [groupedVisitors]);

  const filteredVisitors = useMemo(() => {
    if (analyticsFilter === 'desktop') return groupedVisitors.filter(v => !v.isMobile);
    if (analyticsFilter === 'mobile') return groupedVisitors.filter(v => v.isMobile);
    return groupedVisitors;
  }, [groupedVisitors, analyticsFilter]);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setUsersList(users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const q = query(collection(db, 'blog_posts'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const posts = [];
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setBlogPosts(posts);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projs = [];
      querySnapshot.forEach((docSnap) => {
        projs.push({ id: docSnap.id, ...docSnap.data() });
      });
      projs.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      setProjectsList(projs);
    } catch (err) {
      console.error("fetchProjects error:", err);
    }
  };

  const deleteBlogPost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await deleteDoc(doc(db, 'blog_posts', postId));
      setBlogPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Đã xóa bài viết thành công!');
    } catch (err) {
      alert('Lỗi xóa bài viết: ' + err.message);
    }
  };

  const deleteProjectRecord = async (projId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dự án này?')) return;
    try {
      await deleteDoc(doc(db, 'projects', projId));
      setProjectsList(prev => prev.filter(p => p.id !== projId));
      showToast('Đã xóa dự án thành công!');
    } catch (err) {
      alert('Lỗi xóa dự án: ' + err.message);
    }
  };

  const handleSaveProject = async () => {
    try {
      const data = { ...projectModal.data };
      if (!data.title) {
        alert('Vui lòng nhập tên dự án!');
        return;
      }
      if (typeof data.tags === 'string') {
        data.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      const targetId = projectModal.mode === 'add' ? (data.slug || 'proj_' + Date.now().toString(36)) : data.id;
      await setDoc(doc(db, 'projects', targetId), {
        ...data,
        id: targetId,
        thumbnail: data.thumbnail || data.image || '',
        demoUrl: data.demoUrl || '',
        githubUrl: data.githubUrl || '',
        order: Number(data.order) || 0,
        createdAt: data.createdAt || new Date().toISOString()
      }, { merge: true });

      setUserModal({ isOpen: false, mode: 'add', data: {} });
      setProjectModal({ isOpen: false, mode: 'add', data: {} });
      fetchProjects();
      showToast('Đã lưu thông tin dự án!');
    } catch (err) {
      alert('Lỗi lưu dự án: ' + err.message);
    }
  };

  const handleSaveUser = async () => {
    try {
      const data = { ...userModal.data };
      if (!data.email || !data.username) {
        alert('Vui lòng điền Email và Username!');
        return;
      }
      const targetId = userModal.mode === 'add' ? Date.now().toString() : data.id;
      await setDoc(doc(db, 'users', targetId), {
        ...data,
        id: targetId,
        role: data.role || 'user',
        createdAt: data.createdAt || new Date().toISOString()
      }, { merge: true });

      setUserModal({ isOpen: false, mode: 'add', data: {} });
      fetchUsers();
      showToast('Đã lưu thông tin tài khoản!');
    } catch (err) {
      alert('Lỗi lưu tài khoản: ' + err.message);
    }
  };

  const deleteUserRecord = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsersList(prev => prev.filter(u => u.id !== userId));
      showToast('Đã xóa tài khoản thành công!');
    } catch (err) {
      alert('Lỗi xóa tài khoản: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 3000);
  };

  const computeConfigDiff = (original, current) => {
    if (!original) return current;
    const diff = {};

    if (JSON.stringify(original.general || {}) !== JSON.stringify(current.general || {})) {
      diff.general = current.general || {};
    }
    if (JSON.stringify(original.appearance || {}) !== JSON.stringify(current.appearance || {})) {
      diff.appearance = current.appearance || {};
    }
    if (JSON.stringify(original.social_links || []) !== JSON.stringify(current.social_links || [])) {
      diff.social_links = current.social_links || [];
    }
    if (JSON.stringify(original.maintenance || {}) !== JSON.stringify(current.maintenance || {})) {
      diff.maintenance = current.maintenance || {};
    }
    if (JSON.stringify(original.apps || []) !== JSON.stringify(current.apps || [])) {
      diff.apps = current.apps || [];
    }
    if (JSON.stringify(original.content?.quotes || []) !== JSON.stringify(current.content?.quotes || []) ||
      original.content?.filmStripSpeed !== current.content?.filmStripSpeed) {
      diff.content = {
        quotes: current.content?.quotes || [],
        filmStripSpeed: current.content?.filmStripSpeed || 45
      };
    }
    return diff;
  };

  const handleSave = async () => {
    if (!localConfig) return;
    const diffPayload = computeConfigDiff(config, localConfig);
    const filmStripChanged = JSON.stringify(config?.content?.filmStripImages || []) !== JSON.stringify(localConfig.content?.filmStripImages || []);

    if (Object.keys(diffPayload).length === 0 && !filmStripChanged) {
      showToast('Không có thay đổi nào cần lưu.');
      return;
    }

    setIsSaving(true);
    try {
      const promises = [];
      if (Object.keys(diffPayload).length > 0) {
        promises.push(setDoc(doc(db, 'site_config', 'main_config'), diffPayload, { merge: true }));
      }
      if (filmStripChanged) {
        promises.push(setDoc(doc(db, 'system', 'memories'), {
          filmStripImages: localConfig.content?.filmStripImages || []
        }, { merge: true }));
      }
      await Promise.all(promises);
      showToast('Đã lưu thành công cấu hình!');
    } catch (err) {
      alert('Lỗi khi lưu cấu hình: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };
  handleSaveRef.current = handleSave;

  const updateNested = (category, field, value) => {
    setLocalConfig(prev => {
      const updated = { ...prev };
      if (!updated[category]) updated[category] = {};
      updated[category][field] = value;
      return updated;
    });
  };

  const compressImage = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1200;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
    });
  };

  const handleFileUpload = (e, callback, aspect = 16 / 9) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước ảnh tối đa là 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        setAdjustmentModal({
          isOpen: true,
          src: compressed,
          callback,
          aspect
        });
        setZoom(1);
        setDragPos({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReAdjust = (src, callback, aspect = 16 / 9) => {
    setAdjustmentModal({
      isOpen: true,
      src,
      callback,
      aspect
    });
    setZoom(1);
    setDragPos({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragPos.x, y: e.clientY - dragPos.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setDragPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - dragPos.x,
        y: e.touches[0].clientY - dragPos.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setDragPos({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const confirmCrop = () => {
    if (!adjustmentModal.src) return;
    const img = new Image();
    img.src = adjustmentModal.src;
    img.onload = () => {
      const targetAspect = adjustmentModal.aspect || 16 / 9;
      const targetWidth = 1200;
      const targetHeight = Math.round(targetWidth / targetAspect);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      const container = previewContainerRef.current;
      const cWidth = container ? container.clientWidth : 480;
      const cHeight = container ? container.clientHeight : Math.round(480 / targetAspect);

      let baseW, baseH;
      const imgAspect = img.width / img.height;
      if (imgAspect > targetAspect) {
        baseH = cHeight;
        baseW = cHeight * imgAspect;
      } else {
        baseW = cWidth;
        baseH = cWidth / imgAspect;
      }

      const scale = targetWidth / cWidth;
      const finalW = baseW * zoom * scale;
      const finalH = baseH * zoom * scale;

      const drawX = (targetWidth - finalW) / 2 + (dragPos.x * scale);
      const drawY = (targetHeight - finalH) / 2 + (dragPos.y * scale);

      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, drawX, drawY, finalW, finalH);

      const finalBase64 = canvas.toDataURL('image/jpeg', 0.85);
      if (adjustmentModal.callback) {
        adjustmentModal.callback(finalBase64);
      }
      setAdjustmentModal({ isOpen: false, src: '', callback: null, aspect: 16 / 9 });
      setDragPos({ x: 0, y: 0 });
      setZoom(1);
    };
  };

  if (loading || !localConfig) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', color: '#1d1d1f' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Đang tải bảng điều khiển...</div>
      </div>
    );
  }

  // 6 Master Tabs
  const tabs = [
    { id: 'general', label: 'CÀI ĐẶT & TRẠNG THÁI', icon: <Settings size={18} /> },
    { id: 'homepage', label: 'NỘI DUNG TRANG CHỦ', icon: <Home size={18} /> },
    { id: 'blog', label: 'BÀI VIẾT & BLOG', icon: <FileText size={18} /> },
    { id: 'projects', label: 'DỰ ÁN & PHẦN MỀM', icon: <Package size={18} /> },
    { id: 'users', label: 'QUẢN LÝ TÀI KHOẢN', icon: <Users size={18} /> },
    { id: 'analytics', label: 'THỐNG KÊ TRAFFIC', icon: <Activity size={18} /> }
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="brand-icon-wrapper">
            <img src={localConfig.general?.logoUrl || '/logobct.png'} alt="Logo" />
          </div>
          <div className="admin-brand-info">
            <span className="admin-brand-title">{localConfig.general?.siteTitle || 'BCT0902 Studio'}</span>
            <span className="admin-brand-subtitle">Quản Trị Hệ Thống</span>
          </div>
        </div>

        <nav className="admin-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="logout-btn" onClick={() => {
            localStorage.removeItem('bct_admin_session');
            window.location.href = '/login';
          }}>
            Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        <header className="admin-header">
          <div className="admin-header-titles">
            <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
            <p>Không gian quản trị BCT Studio</p>
          </div>

          <div className="admin-header-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <ExternalLink size={15} />
              <span>Xem Web</span>
            </a>
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
              <Save size={15} />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </header>

        <div className="admin-frame">
          <AnimatePresence mode="wait">
            {/* TAB 1: CÀI ĐẶT & TRẠNG THÁI */}
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* 1.1 Logo & Nhận diện */}
                <div className="admin-card">
                  <div className="config-section-title">
                    <ImageIcon size={18} /> LOGO VÀ NHẬN DIỆN THƯƠNG HIỆU
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ width: '80px', height: '80px', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--apple-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <img src={localConfig.appearance?.logoUrl || localConfig.general?.logoUrl || '/logobct.png'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <label className="btn-ghost" style={{ cursor: 'pointer' }}>
                        <Upload size={15} />
                        <span>Tải Logo Mới</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => {
                          updateNested('appearance', 'logoUrl', res);
                          updateNested('general', 'logoUrl', res);
                        }, 1)} />
                      </label>
                      {(localConfig.appearance?.logoUrl || localConfig.general?.logoUrl) && (
                        <button className="btn-ghost" onClick={() => handleReAdjust(localConfig.appearance?.logoUrl || localConfig.general?.logoUrl, (res) => {
                          updateNested('appearance', 'logoUrl', res);
                          updateNested('general', 'logoUrl', res);
                        }, 1)}>
                          <Crop size={15} /> Căn Chỉnh
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Tên Thương Hiệu / Tiêu Đề (Site Title)</label>
                    <input type="text" className="admin-input" value={localConfig.general?.siteTitle || ''} onChange={(e) => updateNested('general', 'siteTitle', e.target.value)} placeholder="BCT0902 Studio" />
                  </div>
                </div>

                {/* 1.2 Mạng Xã Hội */}
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                        <Globe size={18} /> QUẢN LÝ MẠNG XÃ HỘI ({(localConfig.social_links || []).length})
                      </div>
                      <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                        Chọn logo thương hiệu có sẵn hoặc tải ảnh logo riêng, sau đó nhập liên kết URL.
                      </p>
                    </div>
                    <button className="add-btn" onClick={() => {
                      const newSocials = [...(localConfig.social_links || [])];
                      newSocials.push({ icon: 'Globe', url: '', customIcon: '' });
                      setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                    }}>
                      <Plus size={15} /> Thêm Mạng Xã Hội
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(localConfig.social_links || []).map((social, idx) => (
                      <div key={idx} className="social-compact-row">
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="social-logo-trigger"
                            onClick={() => setActiveIconPickerIdx(activeIconPickerIdx === idx ? null : idx)}
                            title="Bấm để đổi Logo"
                          >
                            {social.customIcon ? (
                              <img src={social.customIcon} alt="social-logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : social.icon ? (
                              <SocialIcon name={social.icon} size={22} />
                            ) : (
                              <Globe size={22} />
                            )}
                          </button>

                          {activeIconPickerIdx === idx && (
                            <div className="social-picker-dropdown">
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.6rem' }}>
                                CHỌN LOGO THƯƠNG HIỆU CÓ SẴN
                              </div>
                              <div className="social-picker-grid">
                                {SOCIAL_PLATFORMS.map((platform) => (
                                  <button
                                    key={platform.name}
                                    type="button"
                                    className="social-preset-btn"
                                    onClick={() => {
                                      const newSocials = [...localConfig.social_links];
                                      newSocials[idx] = { ...newSocials[idx], icon: platform.icon, customIcon: '' };
                                      setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                                      setActiveIconPickerIdx(null);
                                    }}
                                  >
                                    <SocialIcon name={platform.icon} size={18} color={platform.color} />
                                    <span>{platform.name}</span>
                                  </button>
                                ))}
                              </div>

                              <div style={{ borderTop: '1px solid var(--apple-border)', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
                                <label className="btn-ghost" style={{ width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                                  <Upload size={14} />
                                  <span>Tải Logo Riêng Từ Máy</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload(e, (res) => {
                                      const newSocials = [...localConfig.social_links];
                                      newSocials[idx] = { ...newSocials[idx], customIcon: res, icon: '' };
                                      setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                                      setActiveIconPickerIdx(null);
                                    }, 1)}
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>

                        <input
                          type="url"
                          className="admin-input"
                          placeholder="https://..."
                          value={social.url || ''}
                          style={{ flex: 1 }}
                          onChange={(e) => {
                            const newSocials = [...localConfig.social_links];
                            newSocials[idx] = { ...newSocials[idx], url: e.target.value };
                            setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          }}
                        />

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => {
                            const newSocials = (localConfig.social_links || []).filter((_, i) => i !== idx);
                            setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          }}
                          aria-label="Xóa mạng xã hội"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 1.3 Hiệu ứng giao diện (Apple iOS Switches) */}
                <div className="admin-card">
                  <div className="config-section-title">
                    <Palette size={18} /> HIỆU ỨNG GIAO DIỆN HỆ THỐNG
                  </div>

                  <div className="apple-toggle-row">
                    <div className="apple-toggle-info">
                      <h4>Độ mờ nền phía sau (Background Blur)</h4>
                      <p>Hiệu ứng kính mờ chiều sâu trên nền trang chủ</p>
                    </div>
                    <button
                      type="button"
                      className={`apple-switch ${localConfig.appearance?.backgroundBlur ? 'active' : ''}`}
                      onClick={() => updateNested('appearance', 'backgroundBlur', !localConfig.appearance?.backgroundBlur)}
                    >
                      <div className="apple-switch-handle" />
                    </button>
                  </div>

                  <div className="apple-toggle-row">
                    <div className="apple-toggle-info">
                      <h4>Hiệu ứng hạt bụi phát sáng (Particle Effects)</h4>
                      <p>Các đốm sáng chuyển động lơ lửng trong không gian</p>
                    </div>
                    <button
                      type="button"
                      className={`apple-switch ${localConfig.appearance?.particleEffects ? 'active' : ''}`}
                      onClick={() => updateNested('appearance', 'particleEffects', !localConfig.appearance?.particleEffects)}
                    >
                      <div className="apple-switch-handle" />
                    </button>
                  </div>

                  <div className="apple-toggle-row">
                    <div className="apple-toggle-info">
                      <h4>Lưới tọa độ hình học (Grid Overlay)</h4>
                      <p>Đường lưới ma trận nhẹ nhàng phủ toàn màn hình</p>
                    </div>
                    <button
                      type="button"
                      className={`apple-switch ${localConfig.appearance?.gridOverlay ? 'active' : ''}`}
                      onClick={() => updateNested('appearance', 'gridOverlay', !localConfig.appearance?.gridOverlay)}
                    >
                      <div className="apple-switch-handle" />
                    </button>
                  </div>
                </div>

                {/* 1.4 Quản Lý Trạng Thái Bảo Trì (Dynamic Route Registry) */}
                <div className="admin-card">
                  <div className="config-section-title">
                    <Lock size={18} /> QUẢN LÝ TRẠNG THÁI BẢO TRÌ CÁC TRANG
                  </div>
                  <p style={{ margin: '-0.75rem 0 1.25rem 0', color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                    Bật công tắc để khóa bảo trì tạm thời từng phân hệ trang web. Khi khóa, người dùng vãng lai sẽ thấy màn hình bảo trì.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {APP_ROUTES.map(route => {
                      const isLocked = Boolean(localConfig.maintenance && localConfig.maintenance[route.id]);
                      return (
                        <div key={route.id} className="apple-toggle-row">
                          <div className="apple-toggle-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h4>{route.name}</h4>
                              <code style={{ fontSize: '0.75rem', color: 'var(--apple-text-muted)' }}>{route.path}</code>
                            </div>
                            <p>{route.description}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isLocked ? 'var(--apple-red)' : 'var(--apple-green)' }}>
                              {isLocked ? 'ĐANG KHÓA BẢO TRÌ' : 'CÔNG KHAI'}
                            </span>
                            <button
                              type="button"
                              className={`apple-switch ${isLocked ? 'locked' : 'active'}`}
                              onClick={() => updateNested('maintenance', route.id, !isLocked)}
                            >
                              <div className="apple-switch-handle" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: NỘI DUNG TRANG CHỦ */}
            {activeTab === 'homepage' && (
              <motion.div key="homepage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Segmented Sub-Tabs Bar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', background: '#ffffff', padding: '6px', borderRadius: '14px', border: '1px solid var(--apple-border)', width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`filter-pill ${homepageSubTab === 'filmstrip' ? 'active' : ''}`}
                    onClick={() => setHomepageSubTab('filmstrip')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Film size={15} />
                    <span>Dải Phim Kỹ Thuật Số ({(localConfig.content?.filmStripImages || []).length})</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-pill ${homepageSubTab === 'apps' ? 'active' : ''}`}
                    onClick={() => setHomepageSubTab('apps')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Package size={15} />
                    <span>Ứng Dụng Tin Dùng ({(localConfig.apps || []).length})</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-pill ${homepageSubTab === 'quotes' ? 'active' : ''}`}
                    onClick={() => setHomepageSubTab('quotes')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <MessageSquare size={15} />
                    <span>Danh Ngôn Trang Chủ ({(localConfig.content?.quotes || []).length})</span>
                  </button>
                </div>

                {/* SubTab 1: Dải Phim Kỹ Thuật Số */}
                {homepageSubTab === 'filmstrip' && (
                  <div className="admin-card">
                    <div className="config-section-title">
                      <Film size={18} /> CẤU HÌNH DẢI PHIM KỸ THUẬT SỐ
                    </div>

                    <div className="form-group">
                      <label>Tốc Độ Cuộn Phim (Giây)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={localConfig.content?.filmStripSpeed || 45}
                        onChange={(e) => updateNested('content', 'filmStripSpeed', Number(e.target.value))}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem 0', flexWrap: 'wrap', gap: '1rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--apple-text-secondary)' }}>
                        DANH SÁCH KHUNG HÌNH ({(localConfig.content?.filmStripImages || []).length})
                      </label>
                      <label className="add-btn" style={{ cursor: 'pointer' }}>
                        <Upload size={15} /> Thêm Khung Hình
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(e, (res) => {
                            const currentImages = [...(localConfig.content?.filmStripImages || [])];
                            currentImages.push(res);
                            updateNested('content', 'filmStripImages', currentImages);
                          }, 16 / 9)}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {(localConfig.content?.filmStripImages || []).map((imgUrl, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--apple-border)', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <div style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.02)' }}>
                            <img src={imgUrl} alt={`Filmstrip ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#ffffff' }}>
                            <button
                              className="btn-ghost"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => handleReAdjust(imgUrl, (res) => {
                                const currentImages = [...(localConfig.content?.filmStripImages || [])];
                                currentImages[idx] = res;
                                updateNested('content', 'filmStripImages', currentImages);
                              }, 16 / 9)}
                            >
                              <Crop size={13} /> Sửa
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => {
                                const currentImages = (localConfig.content?.filmStripImages || []).filter((_, i) => i !== idx);
                                updateNested('content', 'filmStripImages', currentImages);
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SubTab 2: Ứng Dụng Tin Dùng */}
                {homepageSubTab === 'apps' && (
                  <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                          <Package size={18} /> HỆ SINH THÁI ỨNG DỤNG TIN DÙNG ({(localConfig.apps || []).length})
                        </div>
                        <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                          Chọn logo thương hiệu chính hãng hoặc tải logo riêng, logo sẽ tự động mang màu sắc chuẩn.
                        </p>
                      </div>
                      <button className="add-btn" onClick={() => {
                        const newApps = [...(localConfig.apps || [])];
                        newApps.push({ name: '', color: '#0071e3', iconUrl: '' });
                        setLocalConfig(prev => ({ ...prev, apps: newApps }));
                      }}>
                        <Plus size={15} /> Thêm Ứng Dụng
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(localConfig.apps || []).map((app, idx) => (
                        <div key={idx} className="app-compact-row">
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              className="social-logo-trigger"
                              onClick={() => setActiveAppLogoPickerIdx(activeAppLogoPickerIdx === idx ? null : idx)}
                              title="Bấm để đổi Logo thương hiệu hoặc tải ảnh lên"
                            >
                              {renderAppLogo(app)}
                            </button>

                            {activeAppLogoPickerIdx === idx && (
                              <div className="social-picker-dropdown">
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.6rem' }}>
                                  CHỌN LOGO THƯƠNG HIỆU CÓ SẴN
                                </div>
                                <div className="social-picker-grid">
                                  {APP_PRESET_LOGOS.map((preset) => (
                                    <button
                                      key={preset.name}
                                      type="button"
                                      className="social-preset-btn"
                                      onClick={() => {
                                        const newApps = [...localConfig.apps];
                                        newApps[idx] = {
                                          ...newApps[idx],
                                          name: newApps[idx].name || preset.name,
                                          color: preset.color,
                                          iconKey: preset.name,
                                          iconUrl: ''
                                        };
                                        setLocalConfig(prev => ({ ...prev, apps: newApps }));
                                        setActiveAppLogoPickerIdx(null);
                                      }}
                                    >
                                      <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {preset.renderIcon({ width: '100%', height: '100%', style: { color: preset.color } })}
                                      </div>
                                      <span>{preset.name}</span>
                                    </button>
                                  ))}
                                </div>

                                <div style={{ borderTop: '1px solid var(--apple-border)', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
                                  <label className="btn-ghost" style={{ width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                                    <Upload size={14} />
                                    <span>Tải Logo Riêng Từ Máy</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={(e) => handleFileUpload(e, (res) => {
                                        const newApps = [...localConfig.apps];
                                        newApps[idx] = { ...newApps[idx], iconUrl: res, iconKey: '' };
                                        setLocalConfig(prev => ({ ...prev, apps: newApps }));
                                        setActiveAppLogoPickerIdx(null);
                                      }, 1)}
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          {app.iconUrl && (
                            <button
                              type="button"
                              className="btn-ghost"
                              style={{ padding: '0.45rem', width: '36px', height: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleReAdjust(app.iconUrl, (res) => {
                                const newApps = [...(localConfig.apps || [])];
                                newApps[idx] = { ...newApps[idx], iconUrl: res };
                                setLocalConfig(prev => ({ ...prev, apps: newApps }));
                              }, 1)}
                              title="Căn chỉnh icon"
                            >
                              <Crop size={14} />
                            </button>
                          )}

                          <input
                            type="text"
                            className="admin-input"
                            placeholder="Tên ứng dụng (vd: Antigravity, GitHub, VS Code...)"
                            value={app.name || ''}
                            style={{ flex: 1 }}
                            onChange={(e) => {
                              const newApps = [...(localConfig.apps || [])];
                              newApps[idx] = { ...newApps[idx], name: e.target.value };
                              setLocalConfig(prev => ({ ...prev, apps: newApps }));
                            }}
                          />

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => {
                              const newApps = (localConfig.apps || []).filter((_, i) => i !== idx);
                              setLocalConfig(prev => ({ ...prev, apps: newApps }));
                            }}
                            aria-label={`Xóa ứng dụng ${app.name || ''}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SubTab 3: Danh Ngôn Trang Chủ */}
                {homepageSubTab === 'quotes' && (
                  <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                          <MessageSquare size={18} /> QUẢN LÝ DANH NGÔN TRANG CHỦ ({(localConfig.content?.quotes || []).length})
                        </div>
                        <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                          Các câu trích dẫn sẽ hiển thị tự động trên thanh tiêu đề và chân trang web.
                        </p>
                      </div>
                      <button className="add-btn" onClick={() => {
                        const newQuotes = [...(localConfig.content?.quotes || [])];
                        newQuotes.push('Danh ngôn mới...');
                        updateNested('content', 'quotes', newQuotes);
                      }}>
                        <Plus size={15} /> Thêm Danh Ngôn
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {(localConfig.content?.quotes || []).map((quote, idx) => (
                        <div key={idx} className="quote-item-card">
                          <span className="quote-index">{String(idx + 1).padStart(2, '0')}</span>
                          <textarea
                            className="quote-edit-input"
                            value={quote}
                            onChange={(e) => {
                              const newQuotes = [...(localConfig.content?.quotes || [])];
                              newQuotes[idx] = e.target.value;
                              updateNested('content', 'quotes', newQuotes);
                            }}
                            rows={2}
                            aria-label={`Danh ngôn số ${idx + 1}`}
                          />
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => {
                              const newQuotes = (localConfig.content?.quotes || []).filter((_, i) => i !== idx);
                              updateNested('content', 'quotes', newQuotes);
                            }}
                            aria-label={`Xóa danh ngôn số ${idx + 1}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: BÀI VIẾT & BLOG */}
            {activeTab === 'blog' && (
              <motion.div key="blog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="config-section-title" style={{ margin: 0 }}>
                      <FileText size={18} /> QUẢN LÝ BÀI VIẾT & BLOG ({blogPosts.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link to="/admin/cms/new" className="add-btn" style={{ textDecoration: 'none' }}>
                        <Plus size={15} /> Viết Bài Mới
                      </Link>
                      <button className="btn-ghost" onClick={fetchBlogPosts}>
                        <Activity size={15} /> Làm Mới
                      </button>
                    </div>
                  </div>

                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>BÀI VIẾT</th>
                          <th>DANH MỤC</th>
                          <th>NGÀY ĐĂNG</th>
                          <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogPosts.map(post => (
                          <tr key={post.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={post.thumbnail || '/placeholder.png'} style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--apple-border)' }} alt={post.title || 'Thumbnail'} />
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.title}</div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: post.published ? 'var(--apple-green)' : '#f59e0b', background: post.published ? 'var(--apple-green-subtle)' : 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '980px' }}>
                                {post.category || 'Tech'} · {post.published ? 'Công Khai' : 'Bản Nháp'}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--apple-text-secondary)' }}>{post.date}</td>
                            <td>
                              <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                <Link to={`/admin/cms/${post.id}`} className="edit-btn" aria-label={`Sửa ${post.title}`}><Edit size={15} /></Link>
                                <button className="delete-btn" onClick={() => deleteBlogPost(post.id)} aria-label={`Xóa ${post.title}`}><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: DỰ ÁN & PHẦN MỀM */}
            {activeTab === 'projects' && (
              <motion.div key="projects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="config-section-title" style={{ margin: 0 }}>
                      <Package size={18} /> QUẢN LÝ DỰ ÁN & PHẦN MỀM ({projectsList.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link to="/admin/projects/new" className="add-btn" style={{ textDecoration: 'none' }}>
                        <Plus size={15} /> Soạn Dự Án Mới
                      </Link>
                      <button className="btn-ghost" onClick={fetchProjects}>
                        <Activity size={15} /> Làm Mới
                      </button>
                    </div>
                  </div>

                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th style={{ width: '70px', textAlign: 'center' }}>STT</th>
                          <th>DỰ ÁN</th>
                          <th>CÔNG NGHỆ</th>
                          <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectsList.map((proj, idx) => (
                          <tr key={proj.id}>
                            <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--apple-blue)', fontSize: '0.95rem' }}>
                              {proj.order !== undefined && proj.order !== null && proj.order !== '' ? proj.order : (idx + 1)}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img
                                  src={proj.thumbnail || proj.coverImage || proj.image || '/logobct.png'}
                                  style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--apple-border)' }}
                                  alt={proj.title || 'Project thumbnail'}
                                  onError={(e) => { e.target.src = '/logobct.png'; }}
                                />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{proj.title}</div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--apple-text-secondary)' }}>{proj.category}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {(Array.isArray(proj.tags) ? proj.tags : []).map((t, i) => (
                                  <span key={i} className="path-chip">{t}</span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                <Link to={`/admin/projects/edit/${proj.id}`} className="edit-btn" aria-label={`Sửa ${proj.title}`}><Edit size={15} /></Link>
                                <button className="delete-btn" onClick={() => deleteProjectRecord(proj.id)} aria-label={`Xóa ${proj.title}`}><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: QUẢN LÝ TÀI KHOẢN */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="config-section-title" style={{ margin: 0 }}>
                      <Users size={18} /> QUẢN LÝ TÀI KHOẢN ({usersList.length})
                    </div>
                    <button className="add-btn" onClick={() => setUserModal({ isOpen: true, mode: 'add', data: { role: 'user' } })}>
                      <Plus size={15} /> Thêm Tài Khoản
                    </button>
                  </div>

                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>DANH TÍNH</th>
                          <th>EMAIL</th>
                          <th>VAI TRÒ</th>
                          <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map(user => (
                          <tr key={user.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <img src={user.photoURL || '/logobct.png'} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--apple-border)' }} alt={user.displayName} />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.displayName}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--apple-blue)' }}>@{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>{user.email}</td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '980px', background: user.role === 'admin' ? 'var(--apple-blue-subtle)' : 'rgba(0,0,0,0.05)', color: user.role === 'admin' ? 'var(--apple-blue)' : 'var(--apple-text-secondary)' }}>
                                {user.role === 'admin' ? 'Admin' : 'Thành Viên'}
                              </span>
                            </td>
                            <td>
                              <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                <button className="edit-btn" onClick={() => setUserModal({ isOpen: true, mode: 'edit', data: user })}><Edit size={15} /></button>
                                <button className="delete-btn" onClick={() => deleteUserRecord(user.id)}><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 6: THỐNG KÊ TRAFFIC */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                      LƯỢT TRUY CẬP HIỆN TẠI
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>{activeNowCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Hoạt động trong 5 phút gần đây</div>
                  </div>

                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem' }}>TỔNG LƯỢT TRUY CẬP</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--apple-text-primary)', letterSpacing: '-0.03em' }}>{analyticsData.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Tổng số sự kiện xem trang</div>
                  </div>

                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem' }}>THIẾT BỊ DUY NHẤT</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--apple-blue)', letterSpacing: '-0.03em' }}>{groupedVisitors.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Gom nhóm theo người dùng/phiên</div>
                  </div>
                </div>

                {/* Visitors Grouped List */}
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                        <Activity size={18} /> NHẬT KÝ LƯU LƯỢNG TRUY CẬP REALTIME
                      </div>
                      <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                        Tự động cập nhật thời gian thực khi có người dùng truy cập.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div className="filter-pills">
                        <button
                          className={`filter-pill ${analyticsFilter === 'all' ? 'active' : ''}`}
                          onClick={() => { setAnalyticsFilter('all'); setTrafficPage(1); }}
                        >
                          Tất cả ({groupedVisitors.length})
                        </button>
                        <button
                          className={`filter-pill ${analyticsFilter === 'desktop' ? 'active' : ''}`}
                          onClick={() => { setAnalyticsFilter('desktop'); setTrafficPage(1); }}
                        >
                          Desktop 💻 ({groupedVisitors.filter(v => !v.isMobile).length})
                        </button>
                        <button
                          className={`filter-pill ${analyticsFilter === 'mobile' ? 'active' : ''}`}
                          onClick={() => { setAnalyticsFilter('mobile'); setTrafficPage(1); }}
                        >
                          Mobile 📱 ({groupedVisitors.filter(v => v.isMobile).length})
                        </button>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const totalTrafficPages = Math.max(1, Math.ceil(filteredVisitors.length / TRAFFIC_PER_PAGE));
                    const paginatedVisitors = filteredVisitors.slice((trafficPage - 1) * TRAFFIC_PER_PAGE, trafficPage * TRAFFIC_PER_PAGE);

                    return (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {paginatedVisitors.map((v, i) => (
                            <div key={v.visitorId || i} className="visitor-row-card">
                              <div className="visitor-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                                  {v.isAdmin ? (
                                    <span className="visitor-badge-admin">Admin</span>
                                  ) : (
                                    <span className="visitor-badge-guest">Khách #{String(v.visitorId || 'guest').slice(-6).toUpperCase()}</span>
                                  )}
                                  <span style={{ fontSize: '0.85rem', color: 'var(--apple-text-secondary)' }}>
                                    {v.deviceLabel}
                                  </span>
                                  {(v.city || v.country) && (
                                    <span style={{ fontSize: '0.78rem', color: 'var(--apple-green)', background: 'var(--apple-green-subtle)', padding: '2px 8px', borderRadius: '980px', fontWeight: 600 }}>
                                      📍 {[v.city, v.country].filter(Boolean).join(', ')} {v.countryCode === 'VN' ? '🇻🇳' : ''}
                                    </span>
                                  )}
                                  {v.ip && (
                                    <code style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                                      🌐 {v.ip}
                                    </code>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                  <span className="visitor-hits">{v.totalHits} lượt xem</span>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--apple-text-secondary)' }}>
                                    {v.lastTimestamp?.toDate ? v.lastTimestamp.toDate().toLocaleString() : 'Vừa xong'}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.35rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginRight: '0.25rem' }}>Trang đã xem:</span>
                                {Array.from(v.paths).map((p, pIdx) => (
                                  <span key={pIdx} className="path-chip">{p}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {totalTrafficPages > 1 && (
                          <div className="apple-pagination-bar">
                            <div className="pagination-info">
                              Đang hiển thị {((trafficPage - 1) * TRAFFIC_PER_PAGE) + 1}–{Math.min(trafficPage * TRAFFIC_PER_PAGE, filteredVisitors.length)} trong tổng số {filteredVisitors.length} khách
                            </div>
                            <div className="pagination-controls">
                              <button
                                className="btn-ghost"
                                style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                                disabled={trafficPage === 1}
                                onClick={() => setTrafficPage(p => Math.max(1, p - 1))}
                              >
                                ‹ Trước
                              </button>
                              <div className="pagination-pills">
                                {Array.from({ length: totalTrafficPages }).map((_, pIdx) => {
                                  const pageNum = pIdx + 1;
                                  return (
                                    <button
                                      key={pageNum}
                                      className={`filter-pill ${trafficPage === pageNum ? 'active' : ''}`}
                                      style={{ minWidth: '32px', padding: '0.35rem 0.5rem', textAlign: 'center' }}
                                      onClick={() => setTrafficPage(pageNum)}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                              </div>
                              <button
                                className="btn-ghost"
                                style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                                disabled={trafficPage === totalTrafficPages}
                                onClick={() => setTrafficPage(p => Math.min(totalTrafficPages, p + 1))}
                              >
                                Sau ›
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Image Crop Adjustment Modal */}
      {adjustmentModal.isOpen && (
        <div className="admin-modal-backdrop" onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
          <div className="admin-modal-card" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div className="config-section-title" style={{ margin: 0 }}>CĂN CHỈNH KHUNG HÌNH</div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--apple-text-secondary)' }}>
                  Bấm giữ chuột để kéo di chuyển vị trí hoặc dùng thanh trượt để thu phóng.
                </p>
              </div>
              <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={() => setAdjustmentModal({ isOpen: false, src: '', callback: null, aspect: 16 / 9 })}>
                <X size={16} />
              </button>
            </div>

            <div 
              ref={previewContainerRef}
              style={{ 
                width: '100%', 
                height: '280px', 
                background: '#0a0a0c', 
                borderRadius: '12px', 
                border: '2px dashed var(--apple-blue)', 
                overflow: 'hidden', 
                position: 'relative',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1.25rem',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <img
                src={adjustmentModal.src}
                alt="Preview"
                draggable={false}
                style={{
                  maxWidth: 'none',
                  maxHeight: 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${zoom}) translate(${dragPos.x / zoom}px, ${dragPos.y / zoom}px)`,
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                  pointerEvents: 'none'
                }}
              />
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.65)', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', pointerEvents: 'none' }}>
                16 : 9 Khung chuẩn
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Thu Phóng</label>
                  <span style={{ fontSize: '0.8rem', color: 'var(--apple-blue)', fontWeight: 700 }}>{zoom.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3.0" 
                  step="0.05" 
                  value={zoom} 
                  onChange={(e) => setZoom(Number(e.target.value))} 
                  style={{ width: '100%' }}
                />
              </div>
              <button 
                type="button" 
                className="btn-ghost" 
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.78rem', marginTop: '1rem' }}
                onClick={() => { setDragPos({ x: 0, y: 0 }); setZoom(1); }}
              >
                Đặt Lại
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setAdjustmentModal({ isOpen: false, src: '', callback: null, aspect: 16 / 9 })}>Hủy</button>
              <button className="save-btn" onClick={confirmCrop}>Áp Dụng</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {projectModal.isOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="config-section-title" style={{ margin: 0 }}>{projectModal.mode === 'add' ? 'THÊM DỰ ÁN MỚI' : 'CHỈNH SỬA DỰ ÁN'}</div>
              <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={() => setProjectModal({ isOpen: false, mode: 'add', data: {} })}>
                <X size={16} />
              </button>
            </div>

            <div className="form-group">
              <label>Tên Dự Án</label>
              <input type="text" className="admin-input" value={projectModal.data.title || ''} onChange={e => setProjectModal(p => ({ ...p, data: { ...p.data, title: e.target.value } }))} />
            </div>

            <div className="form-group">
              <label>Chuyên Mục</label>
              <input type="text" className="admin-input" value={projectModal.data.category || ''} onChange={e => setProjectModal(p => ({ ...p, data: { ...p.data, category: e.target.value } }))} placeholder="Web App, AI Tool..." />
            </div>

            <div className="form-group">
              <label>Thẻ Công Nghệ (Phân cách bằng dấu phẩy)</label>
              <input type="text" className="admin-input" value={Array.isArray(projectModal.data.tags) ? projectModal.data.tags.join(', ') : (projectModal.data.tags || '')} onChange={e => setProjectModal(p => ({ ...p, data: { ...p.data, tags: e.target.value } }))} placeholder="React, Vite, Firebase..." />
            </div>

            <div className="form-group">
              <label>Mô Tả Dự Án</label>
              <textarea className="admin-textarea" value={projectModal.data.description || ''} onChange={e => setProjectModal(p => ({ ...p, data: { ...p.data, description: e.target.value } }))} />
            </div>

            <div className="form-group">
              <label>Đường Dẫn Live Demo / Website (Demo URL)</label>
              <input type="url" className="admin-input" placeholder="https://bctoiws0902.github.io/..." value={projectModal.data.demoUrl || ''} onChange={e => setProjectModal(p => ({ ...p, data: { ...p.data, demoUrl: e.target.value } }))} />
            </div>

            <div className="form-group">
              <label>Đường Dẫn Mã Nguồn GitHub (GitHub URL)</label>
              <input type="url" className="admin-input" placeholder="https://github.com/..." value={projectModal.data.githubUrl || ''} onChange={e => setProjectModal(p => ({ ...p, data: { ...p.data, githubUrl: e.target.value } }))} />
            </div>

            <div className="form-group">
              <label>Ảnh Bìa Dự Án</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {(projectModal.data.image || projectModal.data.thumbnail) && (
                  <img src={projectModal.data.image || projectModal.data.thumbnail} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                )}
                <label className="btn-ghost" style={{ cursor: 'pointer' }}>
                  <Upload size={14} /> Tải Ảnh
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, res => setProjectModal(p => ({ ...p, data: { ...p.data, image: res, thumbnail: res } })), 16 / 9)} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-ghost" onClick={() => setProjectModal({ isOpen: false, mode: 'add', data: {} })}>Hủy</button>
              <button className="save-btn" onClick={handleSaveProject}>Lưu Dự Án</button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {userModal.isOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="config-section-title" style={{ margin: 0 }}>{userModal.mode === 'add' ? 'THÊM TÀI KHOẢN MỚI' : 'CHỈNH SỬA TÀI KHOẢN'}</div>
              <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={() => setUserModal({ isOpen: false, mode: 'add', data: {} })}>
                <X size={16} />
              </button>
            </div>

            <div className="form-group">
              <label>Tên Hiển Thị</label>
              <input type="text" className="admin-input" value={userModal.data.displayName || ''} onChange={e => setUserModal(p => ({ ...p, data: { ...p.data, displayName: e.target.value } }))} />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input type="text" className="admin-input" value={userModal.data.username || ''} onChange={e => setUserModal(p => ({ ...p, data: { ...p.data, username: e.target.value } }))} />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" className="admin-input" value={userModal.data.email || ''} onChange={e => setUserModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))} />
            </div>

            <div className="form-group">
              <label>Phân Quyền Vai Trò</label>
              <select className="admin-select" value={userModal.data.role || 'user'} onChange={e => setUserModal(p => ({ ...p, data: { ...p.data, role: e.target.value } }))}>
                <option value="user">Thành Viên (User)</option>
                <option value="admin">Quản Trị Viên (Admin)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-ghost" onClick={() => setUserModal({ isOpen: false, mode: 'add', data: {} })}>Hủy</button>
              <button className="save-btn" onClick={handleSaveUser}>Lưu Tài Khoản</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Toast */}
      <div className={`admin-floating-status ${status ? 'show' : ''}`}>
        <span>{status}</span>
      </div>
    </div>
  );
};

export default AdminDashboard;

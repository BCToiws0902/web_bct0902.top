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
import { 
  doc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  getCountFromServer 
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import SocialIcon from '../../components/SocialIcon';
import { APP_PRESET_LOGOS, renderAppLogo } from '../../constants/appLogos';
import { APP_ROUTES } from '../../constants/routes';
import './AdminDashboard.css';

const SOCIAL_PLATFORMS = [
  { name: 'Facebook', color: '#1877F2', icon: 'Facebook' },
  { name: 'YouTube', color: '#FF0000', icon: 'YouTube' },
  { name: 'GitHub', color: '#181717', icon: 'GitHub' },
  { name: 'Telegram', color: '#26A5E4', icon: 'Telegram' },
  { name: 'LinkedIn', color: '#0A66C2', icon: 'LinkedIn' },
  { name: 'Twitter / X', color: '#000000', icon: 'Twitter' },
  { name: 'Instagram', color: '#E4405F', icon: 'Instagram' },
  { name: 'Discord', color: '#5865F2', icon: 'Discord' },
  { name: 'TikTok', color: '#000000', icon: 'TikTok' },
  { name: 'Zalo', color: '#0068FF', icon: 'Zalo' }
];

const AdminDashboard = () => {
  const { config, setConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [homepageSubTab, setHomepageSubTab] = useState('filmstrip');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [totalLifetimeHits, setTotalLifetimeHits] = useState(0);
  const [analyticsFilter, setAnalyticsFilter] = useState('all');
  const [trafficPage, setTrafficPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Logo Picker States
  const [activeSocialPickerIdx, setActiveSocialPickerIdx] = useState(null);
  const [activeAppLogoPickerIdx, setActiveAppLogoPickerIdx] = useState(null);

  // Image Cropper State
  const [cropperModal, setCropperModal] = useState({
    isOpen: false,
    imageSrc: '',
    aspectRatio: 1,
    zoom: 1,
    pan: { x: 0, y: 0 },
    onSaveCallback: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleSaveRef = useRef(null);

  // Keyboard shortcut: Ctrl + S to save
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

  // Fetch total lifetime hits count
  const fetchTotalHitsCount = async () => {
    try {
      const coll = collection(db, 'system_analytics');
      const snapshot = await getCountFromServer(coll);
      setTotalLifetimeHits(snapshot.data().count);
    } catch (err) {
      console.error("Error fetching total hits count:", err);
    }
  };

  // Realtime Traffic Analytics Stream
  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'overview') {
      fetchTotalHitsCount();
      const q = query(collection(db, 'system_analytics'), orderBy('timestamp', 'desc'), limit(200));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = [];
        snapshot.forEach((d) => {
          data.push({ id: d.id, ...d.data() });
        });
        setAnalyticsData(data);
        fetchTotalHitsCount();
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
      return (nowSec - lastSec) <= 300; // Active in last 5 mins
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
      querySnapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() });
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
      querySnapshot.forEach((docSnap) => {
        posts.push({ id: docSnap.id, ...docSnap.data() });
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
      console.error(err);
    }
  };

  const deleteBlogPost = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this article?')) return;
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
      setBlogPosts(prev => prev.filter(p => p.id !== id));
      showToast('Article deleted successfully!');
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const deleteProjectRecord = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjectsList(prev => prev.filter(p => p.id !== id));
      showToast('Project deleted successfully!');
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const deleteUserRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsersList(prev => prev.filter(u => u.id !== id));
      showToast('User deleted successfully!');
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const showToast = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 3000);
  };

  const handleSave = async () => {
    if (!localConfig) return;

    setIsSaving(true);
    try {
      const payload = {
        appearance: localConfig.appearance || {},
        social_links: localConfig.social_links || [],
        apps: localConfig.apps || [],
        content: {
          quotes: localConfig.content?.quotes || [],
          filmStripSpeed: Number(localConfig.content?.filmStripSpeed) || 45,
          filmStripImages: localConfig.content?.filmStripImages || []
        },
        maintenance: localConfig.maintenance || {}
      };

      const promises = [
        setDoc(doc(db, 'site_config', 'main_config'), payload, { merge: true }),
        setDoc(doc(db, 'system', 'memories'), {
          filmStripImages: localConfig.content?.filmStripImages || []
        }, { merge: true })
      ];
      await Promise.all(promises);
      if (setConfig) setConfig(localConfig);
      showToast('Configuration saved successfully!');
    } catch (err) {
      alert('Save error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };
  handleSaveRef.current = handleSave;

  const updateNested = (category, field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value
      }
    }));
  };

  const handleFileUpload = (e, callback, aspectRatio = 1) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropperModal({
        isOpen: true,
        imageSrc: event.target.result,
        aspectRatio,
        zoom: 1,
        pan: { x: 0, y: 0 },
        onSaveCallback: callback
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReAdjust = (imgUrl, callback, aspectRatio = 16 / 9) => {
    setCropperModal({
      isOpen: true,
      imageSrc: imgUrl,
      aspectRatio,
      zoom: 1,
      pan: { x: 0, y: 0 },
      onSaveCallback: callback
    });
  };

  const handleCropSave = () => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = cropperModal.imageSrc;

    img.onload = () => {
      const targetWidth = cropperModal.aspectRatio === 1 ? 512 : 1280;
      const targetHeight = targetWidth / cropperModal.aspectRatio;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const baseScale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const currentScale = baseScale * cropperModal.zoom;

      const drawWidth = img.width * currentScale;
      const drawHeight = img.height * currentScale;
      const drawX = (targetWidth - drawWidth) / 2 + cropperModal.pan.x;
      const drawY = (targetHeight - drawHeight) / 2 + cropperModal.pan.y;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      const croppedBase64 = canvas.toDataURL('image/webp', 0.85);
      if (cropperModal.onSaveCallback) {
        cropperModal.onSaveCallback(croppedBase64);
      }
      setCropperModal(prev => ({ ...prev, isOpen: false }));
      showToast('Image cropped and applied successfully!');
    };
  };

  if (!localConfig) {
    return (
      <div className="admin-loading-screen">
        <div className="spinner" />
        <p>Loading BCT Studio workspace...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Toast Notification */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="admin-toast"
          >
            <CheckCircle size={16} />
            <span>{status}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <img src={localConfig.appearance?.logoUrl || '/logobct.png'} alt="Logo" className="admin-brand-logo" />
          <div className="admin-brand-info">
            <h2>BCT STUDIO</h2>
            <span>WORKSPACE ADMIN</span>
          </div>
        </div>

        <nav className="admin-nav-menu">
          <button
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
          >
            <Home size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
          >
            <Settings size={18} />
            <span>System & Security</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'homepage' ? 'active' : ''}`}
            onClick={() => { setActiveTab('homepage'); setIsMobileMenuOpen(false); }}
          >
            <Palette size={18} />
            <span>Home Content</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'socials' ? 'active' : ''}`}
            onClick={() => { setActiveTab('socials'); setIsMobileMenuOpen(false); }}
          >
            <Globe size={18} />
            <span>Social Network</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
          >
            <Package size={18} />
            <span>Projects & Tools</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => { setActiveTab('blog'); setIsMobileMenuOpen(false); }}
          >
            <FileText size={18} />
            <span>Blog Articles</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
          >
            <Activity size={18} />
            <span>Traffic Analytics</span>
          </button>

          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
          >
            <Users size={18} />
            <span>User Accounts</span>
          </button>
        </nav>
      </aside>

      {/* Main Body */}
      <main className="admin-main">
        {/* Top Sticky Bar */}
        <header className="admin-topbar">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu size={20} />
          </button>

          <div className="topbar-title">
            <h1>
              {activeTab === 'overview' && 'SYSTEM OVERVIEW'}
              {activeTab === 'settings' && 'SYSTEM & SECURITY'}
              {activeTab === 'homepage' && 'HOME CONTENT'}
              {activeTab === 'socials' && 'SOCIAL LINKS'}
              {activeTab === 'projects' && 'PROJECTS & SOFTWARE'}
              {activeTab === 'blog' && 'BLOG & ARTICLES'}
              {activeTab === 'analytics' && 'TRAFFIC ANALYTICS'}
              {activeTab === 'users' && 'USER MANAGEMENT'}
            </h1>
            <p>BCT Studio Administration Space</p>
          </div>

          <div className="topbar-actions">
            <Link to="/" target="_blank" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <ExternalLink size={16} />
              <span>Live Site</span>
            </Link>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </header>

        {/* Tab Content Container */}
        <div className="admin-content-body">
          <AnimatePresence mode="wait">
            {/* TAB 0: OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                      ACTIVE NOW
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>{activeNowCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Active in last 5 minutes</div>
                  </div>

                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem' }}>TOTAL LIFETIME VISITS</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--apple-text-primary)', letterSpacing: '-0.03em' }}>
                      {totalLifetimeHits > 0 ? totalLifetimeHits.toLocaleString() : analyticsData.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>All-time page view events</div>
                  </div>

                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem' }}>PUBLISHED PROJECTS</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--apple-blue)', letterSpacing: '-0.03em' }}>{projectsList.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Active showcases and tools</div>
                  </div>

                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem' }}>BLOG POSTS</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.03em' }}>{blogPosts.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Published technology articles</div>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="admin-card">
                  <div className="config-section-title">
                    <Activity size={18} /> QUICK MANAGEMENT SHORTCUTS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('projects')}
                      style={{ padding: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                    >
                      <strong style={{ fontSize: '1rem', color: 'var(--apple-text-primary)' }}>📦 Manage Projects</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>Publish and edit interactive case studies and tools</span>
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('blog')}
                      style={{ padding: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                    >
                      <strong style={{ fontSize: '1rem', color: 'var(--apple-text-primary)' }}>✍️ Write Blog Post</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>Create technical insights with rich Markdown</span>
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('settings')}
                      style={{ padding: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                    >
                      <strong style={{ fontSize: '1rem', color: 'var(--apple-text-primary)' }}>🔒 Maintenance Control</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>Lock or unlock individual site features</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 1: SETTINGS & MAINTENANCE */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* 1.1 Brand Identity */}
                <div className="admin-card">
                  <div className="config-section-title">
                    <ImageIcon size={18} /> BRAND IDENTITY & LOGO
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '90px', height: '90px', borderRadius: '18px', background: '#f5f5f7', border: '1px solid var(--apple-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                      <img src={localConfig.appearance?.logoUrl || '/logobct.png'} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label className="add-btn" style={{ cursor: 'pointer', width: 'fit-content' }}>
                        <Upload size={15} /> Upload New Logo
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(e, (res) => updateNested('appearance', 'logoUrl', res), 1)}
                        />
                      </label>
                      <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.8rem' }}>
                        Recommended ratio 1:1 (Square PNG, SVG, or WebP with transparent background).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1.2 Route Maintenance Registry */}
                <div className="admin-card">
                  <div className="config-section-title">
                    <Lock size={18} /> ROUTE MAINTENANCE CONTROL
                  </div>
                  <p style={{ margin: '-0.75rem 0 1.25rem 0', color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                    Toggle maintenance mode for individual routes. When locked, guests will see the maintenance screen.
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
                              {isLocked ? 'LOCKED' : 'PUBLIC'}
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

            {/* TAB 2: HOME CONTENT */}
            {activeTab === 'homepage' && (
              <motion.div key="homepage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Sub-Tabs Bar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', background: '#ffffff', padding: '6px', borderRadius: '14px', border: '1px solid var(--apple-border)', width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`filter-pill ${homepageSubTab === 'filmstrip' ? 'active' : ''}`}
                    onClick={() => setHomepageSubTab('filmstrip')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Film size={15} />
                    <span>Digital Filmstrip ({(localConfig.content?.filmStripImages || []).length})</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-pill ${homepageSubTab === 'apps' ? 'active' : ''}`}
                    onClick={() => setHomepageSubTab('apps')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <Package size={15} />
                    <span>Ecosystem Apps ({(localConfig.apps || []).length})</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-pill ${homepageSubTab === 'quotes' ? 'active' : ''}`}
                    onClick={() => setHomepageSubTab('quotes')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <MessageSquare size={15} />
                    <span>Homepage Quotes ({(localConfig.content?.quotes || []).length})</span>
                  </button>
                </div>

                {/* SubTab 1: Filmstrip */}
                {homepageSubTab === 'filmstrip' && (
                  <div className="admin-card">
                    <div className="config-section-title">
                      <Film size={18} /> DIGITAL FILMSTRIP CONFIGURATION
                    </div>

                    <div className="form-group">
                      <label>Scroll Duration (Seconds)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={localConfig.content?.filmStripSpeed || 45}
                        onChange={(e) => updateNested('content', 'filmStripSpeed', Number(e.target.value))}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem 0', flexWrap: 'wrap', gap: '1rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--apple-text-secondary)' }}>
                        FILM FRAMES LIST ({(localConfig.content?.filmStripImages || []).length})
                      </label>
                      <label className="add-btn" style={{ cursor: 'pointer' }}>
                        <Upload size={15} /> Add Frame
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
                              <Crop size={13} /> Edit
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

                {/* SubTab 2: Ecosystem Apps */}
                {homepageSubTab === 'apps' && (
                  <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                          <Package size={18} /> ECOSYSTEM APPLICATIONS ({(localConfig.apps || []).length})
                        </div>
                        <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                          Choose official brand presets or upload custom brand logos.
                        </p>
                      </div>
                      <button className="add-btn" onClick={() => {
                        const newApps = [...(localConfig.apps || [])];
                        newApps.push({ name: '', color: '#0071e3', iconUrl: '' });
                        setLocalConfig(prev => ({ ...prev, apps: newApps }));
                      }}>
                        <Plus size={15} /> Add Application
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
                              title="Click to select preset logo or upload custom image"
                            >
                              {renderAppLogo(app)}
                            </button>

                            {activeAppLogoPickerIdx === idx && (
                              <div className="social-picker-dropdown">
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.6rem' }}>
                                  SELECT BRAND PRESET
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
                                    <span>Upload Custom Logo</span>
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

                          <input
                            type="text"
                            className="admin-input"
                            style={{ flex: 1 }}
                            placeholder="Application Name (e.g. Antigravity, Github)..."
                            value={app.name || ''}
                            onChange={(e) => {
                              const newApps = [...localConfig.apps];
                              newApps[idx] = { ...newApps[idx], name: e.target.value };
                              setLocalConfig(prev => ({ ...prev, apps: newApps }));
                            }}
                          />

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => {
                              const newApps = localConfig.apps.filter((_, i) => i !== idx);
                              setLocalConfig(prev => ({ ...prev, apps: newApps }));
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SubTab 3: Quotes */}
                {homepageSubTab === 'quotes' && (
                  <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div className="config-section-title" style={{ margin: 0 }}>
                        <MessageSquare size={18} /> HOMEPAGE INSPIRATIONAL QUOTES ({(localConfig.content?.quotes || []).length})
                      </div>
                      <button className="add-btn" onClick={() => {
                        const quotes = [...(localConfig.content?.quotes || [])];
                        quotes.push('');
                        updateNested('content', 'quotes', quotes);
                      }}>
                        <Plus size={15} /> Add Quote
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(localConfig.content?.quotes || []).map((quote, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="admin-input"
                            style={{ flex: 1 }}
                            placeholder="Enter quote and author..."
                            value={quote}
                            onChange={(e) => {
                              const quotes = [...localConfig.content.quotes];
                              quotes[idx] = e.target.value;
                              updateNested('content', 'quotes', quotes);
                            }}
                          />
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => {
                              const quotes = localConfig.content.quotes.filter((_, i) => i !== idx);
                              updateNested('content', 'quotes', quotes);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: SOCIAL LINKS */}
            {activeTab === 'socials' && (
              <motion.div key="socials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                        <Globe size={18} /> SOCIAL PLATFORMS & LINKS ({(localConfig.social_links || []).length})
                      </div>
                      <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                        Select preset brand icons or upload custom icons, then enter destination URL.
                      </p>
                    </div>
                    <button className="add-btn" onClick={() => {
                      const newSocials = [...(localConfig.social_links || [])];
                      newSocials.push({ name: 'Website', icon: 'Globe', url: 'https://', color: '#0071e3', isVisible: true });
                      setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                    }}>
                      <Plus size={15} /> Add Social Link
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {(localConfig.social_links || []).map((social, idx) => (
                      <div key={idx} className="social-compact-row">
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="social-logo-trigger"
                            onClick={() => setActiveSocialPickerIdx(activeSocialPickerIdx === idx ? null : idx)}
                            title="Click to select preset icon or upload custom image"
                          >
                            <SocialIcon icon={social.icon} iconUrl={social.iconUrl} size={18} color={social.color} />
                          </button>

                          {activeSocialPickerIdx === idx && (
                            <div className="social-picker-dropdown">
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.6rem' }}>
                                SELECT PRESET BRAND
                              </div>
                              <div className="social-picker-grid">
                                {SOCIAL_PLATFORMS.map((platform) => (
                                  <button
                                    key={platform.name}
                                    type="button"
                                    className="social-preset-btn"
                                    onClick={() => {
                                      const newSocials = [...localConfig.social_links];
                                      newSocials[idx] = {
                                        ...newSocials[idx],
                                        name: platform.name,
                                        icon: platform.icon,
                                        color: platform.color,
                                        iconUrl: ''
                                      };
                                      setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                                      setActiveSocialPickerIdx(null);
                                    }}
                                  >
                                    <SocialIcon icon={platform.icon} size={18} color={platform.color} />
                                    <span>{platform.name}</span>
                                  </button>
                                ))}
                              </div>

                              <div style={{ borderTop: '1px solid var(--apple-border)', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
                                <label className="btn-ghost" style={{ width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                                  <Upload size={14} />
                                  <span>Upload Custom Icon</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileUpload(e, (res) => {
                                      const newSocials = [...localConfig.social_links];
                                      newSocials[idx] = { ...newSocials[idx], iconUrl: res, icon: '' };
                                      setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                                      setActiveSocialPickerIdx(null);
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
                          style={{ flex: 1 }}
                          placeholder="https://..."
                          value={social.url || ''}
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
                            const newSocials = localConfig.social_links.filter((_, i) => i !== idx);
                            setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: PROJECTS & SOFTWARE */}
            {activeTab === 'projects' && (
              <motion.div key="projects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                        <Package size={18} /> PROJECTS & SOFTWARE REPOSITORY ({projectsList.length})
                      </div>
                      <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                        Create, publish, and edit interactive case studies and tools.
                      </p>
                    </div>
                    <Link to="/admin/projects/new" className="add-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Plus size={15} /> New Project
                    </Link>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>NO.</th>
                          <th>PROJECT</th>
                          <th>TECH STACK</th>
                          <th style={{ width: '130px', textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectsList.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--apple-text-secondary)' }}>
                              No projects found. Click '+ New Project' to create your first case study.
                            </td>
                          </tr>
                        ) : (
                          projectsList.map((proj, idx) => (
                            <tr key={proj.id}>
                              <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--apple-text-muted)', fontSize: '0.85rem' }}>
                                #{idx + 1}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <div style={{ width: '56px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: '#f5f5f7', border: '1px solid var(--apple-border)', flexShrink: 0 }}>
                                    <img
                                      src={proj.thumbnail || proj.coverImage || proj.image || '/logobct.png'}
                                      alt={proj.title}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => { e.currentTarget.src = '/logobct.png'; }}
                                    />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--apple-text-primary)' }}>{proj.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)' }}>{proj.category || 'Tool'} · {proj.version || 'v1.0.0'}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  {(Array.isArray(proj.tags) ? proj.tags : (proj.tech || [])).slice(0, 3).map((t, i) => (
                                    <span key={i} style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', color: 'var(--apple-text-secondary)', border: '1px solid var(--apple-border)' }}>
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <Link to={`/admin/projects/edit/${proj.id}`} className="btn-ghost" style={{ padding: '0.4rem 0.7rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Edit size={14} /> Edit
                                  </Link>
                                  <button className="delete-btn" onClick={() => deleteProjectRecord(proj.id)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: BLOG ARTICLES */}
            {activeTab === 'blog' && (
              <motion.div key="blog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                        <FileText size={18} /> BLOG & INSIGHTS MANAGER ({blogPosts.length})
                      </div>
                      <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                        Write and publish articles with rich Markdown styling.
                      </p>
                    </div>
                    <Link to="/admin/cms/new" className="add-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Plus size={15} /> New Article
                    </Link>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>NO.</th>
                          <th>ARTICLE</th>
                          <th>CATEGORY</th>
                          <th>DATE</th>
                          <th style={{ width: '130px', textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogPosts.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--apple-text-secondary)' }}>
                              No blog posts found. Click '+ New Article' to create one.
                            </td>
                          </tr>
                        ) : (
                          blogPosts.map((post, idx) => (
                            <tr key={post.id}>
                              <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--apple-text-muted)', fontSize: '0.85rem' }}>
                                #{idx + 1}
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--apple-text-primary)' }}>{post.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)' }}>{post.slug || post.id}</div>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(0,113,227,0.08)', color: 'var(--apple-blue)', borderRadius: '6px', fontWeight: 600 }}>
                                  {post.category || 'Tech'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>
                                {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Recent'}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <Link to={`/admin/cms/${post.id}`} className="btn-ghost" style={{ padding: '0.4rem 0.7rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Edit size={14} /> Edit
                                  </Link>
                                  <button className="delete-btn" onClick={() => deleteBlogPost(post.id)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 6: TRAFFIC ANALYTICS */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                      ACTIVE NOW
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>{activeNowCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Active in last 5 minutes</div>
                  </div>

                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem' }}>TOTAL LIFETIME VISITS</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--apple-text-primary)', letterSpacing: '-0.03em' }}>
                      {totalLifetimeHits > 0 ? totalLifetimeHits.toLocaleString() : analyticsData.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Total recorded page views</div>
                  </div>

                  <div className="admin-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '0.5rem' }}>UNIQUE VISITORS</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--apple-blue)', letterSpacing: '-0.03em' }}>{groupedVisitors.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--apple-text-secondary)', marginTop: '0.35rem' }}>Grouped by client visitor session</div>
                  </div>
                </div>

                {/* Visitors Grouped List */}
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                        <Activity size={18} /> REAL-TIME TRAFFIC LOGS
                      </div>
                      <p style={{ margin: 0, color: 'var(--apple-text-secondary)', fontSize: '0.85rem' }}>
                        Automatically updates in real time as visitors navigate the site.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div className="filter-pills">
                        <button
                          className={`filter-pill ${analyticsFilter === 'all' ? 'active' : ''}`}
                          onClick={() => { setAnalyticsFilter('all'); setTrafficPage(1); }}
                        >
                          All ({groupedVisitors.length})
                        </button>
                        <button
                          className={`filter-pill ${analyticsFilter === 'desktop' ? 'active' : ''}`}
                          onClick={() => { setAnalyticsFilter('desktop'); setTrafficPage(1); }}
                        >
                          Desktop ({groupedVisitors.filter(v => !v.isMobile).length})
                        </button>
                        <button
                          className={`filter-pill ${analyticsFilter === 'mobile' ? 'active' : ''}`}
                          onClick={() => { setAnalyticsFilter('mobile'); setTrafficPage(1); }}
                        >
                          Mobile ({groupedVisitors.filter(v => v.isMobile).length})
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>STATUS</th>
                          <th>VISITOR / IP</th>
                          <th>DEVICE & OS</th>
                          <th>LOCATION</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>HITS</th>
                          <th>LAST ACTIVE</th>
                          <th>VISITED PATHS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVisitors.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--apple-text-secondary)' }}>
                              No traffic recorded yet.
                            </td>
                          </tr>
                        ) : (
                          filteredVisitors.slice((trafficPage - 1) * 20, trafficPage * 20).map((visitor) => {
                            const nowSec = Math.floor(Date.now() / 1000);
                            const lastSec = visitor.lastTimestamp?.seconds || (visitor.lastTimestamp ? Math.floor(new Date(visitor.lastTimestamp).getTime() / 1000) : 0);
                            const isOnline = (nowSec - lastSec) <= 300;

                            return (
                              <tr key={visitor.visitorId}>
                                <td>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: isOnline ? '#10b981' : 'var(--apple-text-muted)' }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOnline ? '#10b981' : '#94a3b8', display: 'inline-block' }} />
                                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--apple-text-primary)' }}>
                                    {visitor.isAdmin ? '👑 Admin (Active)' : (visitor.ip || 'Anonymous Client')}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--apple-text-muted)' }}>{visitor.visitorId}</div>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>{visitor.deviceLabel}</span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>
                                    {visitor.city ? `${visitor.city}, ${visitor.country}` : (visitor.country || 'Global Internet')}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--apple-blue)' }}>
                                  {visitor.totalHits}
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>
                                  {visitor.lastTimestamp?.seconds ? new Date(visitor.lastTimestamp.seconds * 1000).toLocaleTimeString() : 'Just now'}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                    {Array.from(visitor.paths).slice(0, 3).map((p, i) => (
                                      <code key={i} style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px' }}>
                                        {p}
                                      </code>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 7: USERS */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="admin-card">
                  <div className="config-section-title">
                    <Users size={18} /> USER DIRECTORY & ACCESS CONTROL ({usersList.length})
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>USER</th>
                          <th>EMAIL</th>
                          <th>ROLE</th>
                          <th>JOINED DATE</th>
                          <th style={{ width: '80px', textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img src={user.photoURL || '/logobct.png'} alt={user.displayName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                <div style={{ fontWeight: 600, color: 'var(--apple-text-primary)' }}>{user.displayName || 'Unnamed User'}</div>
                              </div>
                            </td>
                            <td style={{ color: 'var(--apple-text-secondary)' }}>{user.email}</td>
                            <td>
                              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 113, 227, 0.1)', color: user.role === 'admin' ? 'var(--apple-red)' : 'var(--apple-blue)', fontWeight: 600 }}>
                                {user.role?.toUpperCase() || 'MEMBER'}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--apple-text-secondary)' }}>
                              {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="delete-btn" onClick={() => deleteUserRecord(user.id)}>
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {cropperModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cropper-backdrop">
            <div className="cropper-dialog">
              <div className="cropper-header">
                <h3>ADJUST & CROP IMAGE</h3>
                <button onClick={() => setCropperModal(prev => ({ ...prev, isOpen: false }))}>
                  <X size={18} />
                </button>
              </div>

              <div
                className="cropper-viewport"
                style={{ aspectRatio: cropperModal.aspectRatio }}
                onMouseDown={(e) => {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - cropperModal.pan.x, y: e.clientY - cropperModal.pan.y });
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  setCropperModal(prev => ({ ...prev, pan: { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y } }));
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <img
                  src={cropperModal.imageSrc}
                  alt="Crop Preview"
                  style={{
                    transform: `translate(${cropperModal.pan.x}px, ${cropperModal.pan.y}px) scale(${cropperModal.zoom})`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  draggable={false}
                />
              </div>

              <div className="cropper-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--apple-text-secondary)' }}>Zoom:</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cropperModal.zoom}
                    onChange={(e) => setCropperModal(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{Math.round(cropperModal.zoom * 100)}%</span>
                </div>
              </div>

              <div className="cropper-actions">
                <button className="btn-secondary" onClick={() => setCropperModal(prev => ({ ...prev, isOpen: false }))}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleCropSave}>
                  Apply & Save Image
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

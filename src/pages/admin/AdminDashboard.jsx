import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Globe, 
  Palette, 
  Key, 
  FileText, 
  Layout, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle,
  ExternalLink,
  Bot,
  Users,
  Home,
  Activity,
  Edit,
  X,
  Upload,
  Image as ImageIcon,
  Zap,
  MessageSquare,
  ChevronDown,
  Brain,
  Sparkles,
  Crop,
  Mail,
  BarChart3,
  Lock,
  Unlock,
  TrendingUp,
  Smartphone,
  Monitor,
  Eye,
  Clock,
  Package,
  Download,
  ExternalLink as LinkIcon,
  Menu,
  Box
} from 'lucide-react';

import { db } from '../../firebase';
import { doc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import SocialIcon from '../../components/SocialIcon';
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
  const [adjustmentModal, setAdjustmentModal] = useState({ isOpen: false, src: '', callback: null, aspect: 2 });
  const [activeIconPickerIdx, setActiveIconPickerIdx] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  
  // Users state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModal, setUserModal] = useState({ isOpen: false, mode: 'add', data: {} });

  const [analyticsData, setAnalyticsData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState('all'); // 'all' | 'guest' | 'admin'
  const [analyticsViewMode, setAnalyticsViewMode] = useState('grouped'); // 'grouped' | 'raw'

  const [apiTestStatus, setApiTestStatus] = useState({ gemini: '', groq: '', tavily: '' });
  
  // Newsletter Logic
  const [newsletterContent, setNewsletterContent] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [isSyncingNews, setIsSyncingNews] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Blog State
  const [blogPosts, setBlogPosts] = useState([]);
  const [loadingBlog, setLoadingBlog] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState('');

  // Projects State
  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectModal, setProjectModal] = useState({ isOpen: false, mode: 'add', data: {} });

  // Keyboard shortcut: Ctrl+S / Cmd+S to Save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localConfig]);

  useEffect(() => {
    if (config) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
    }
  }, [config]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'blog') {
      fetchBlogPosts();
    } else if (activeTab === 'projects') {
      fetchProjects();
    }
  }, [activeTab]);

  // Compute analytics grouped by unique visitor
  const groupedVisitors = React.useMemo(() => {
    const map = {};
    analyticsData.forEach(item => {
      const vid = item.visitorId || (item.isAdmin ? 'admin_session' : `guest_${item.userAgent?.slice(0, 25)}`);
      if (!map[vid]) {
        map[vid] = {
          visitorId: vid,
          isAdmin: Boolean(item.isAdmin),
          deviceLabel: item.deviceLabel || (/Android|iPhone/i.test(item.userAgent) ? 'Mobile' : 'Desktop · Browser'),
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

  const filteredVisitors = React.useMemo(() => {
    if (analyticsFilter === 'admin') return groupedVisitors.filter(v => v.isAdmin);
    if (analyticsFilter === 'guest') return groupedVisitors.filter(v => !v.isAdmin);
    return groupedVisitors;
  }, [groupedVisitors, analyticsFilter]);

  const fetchBlogPosts = useCallback(async () => {
    setLoadingBlog(true);
    try {
      const q = query(collection(db, 'blog_posts'), orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      setBlogPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBlog(false);
    }
  }, []);

  const deleteBlogPost = useCallback(async (id) => {
    if (!window.confirm('Ngài có chắc chắn muốn xoá bài viết này không?')) return;
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
      setBlogPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Lỗi xoá bài: " + err.message);
    }
  }, []);

  const seedBlogPosts = async () => {
    const integrations = localConfig?.integrations || {};
    const geminiEnabled = integrations.geminiEnabled !== false;
    const geminiKey = (geminiEnabled && integrations.geminiKey) || null;

    if (!geminiKey) {
      alert("Chưa bật hoặc chưa cấu hình Gemini Node (Bắt buộc cho Blog Seeder)!");
      return;
    }

    if (!window.confirm('Hệ thống sẽ thực hiện tạo 5 BÀI VIẾT mồi chuẩn SEO cùng lúc qua IRIS Gemini Core. Quá trình này mất khoảng 20-30 giây. Ngài đồng ý chứ?')) return;

    setSeedingProgress('Đang khởi động IRIS Content Factory...');
    setIsSyncingNews(true);

    try {
      const prompt = `Bạn là chuyên gia biên tập nội dung. Hãy tạo 5 bài viết blog CHẤT LƯỢNG CAO bằng Tiếng Việt về 5 chủ đề công nghệ khác nhau (AI, Web, Cybersecurity, Hardware, Future Tech).
      Mỗi bài viết cần: Title, Excerpt (mô tả hấp dẫn), Content (Markdown dài, tối ưu SEO với H2, H3), Category.
      Trả về JSON mảng 5 đối tượng:
      [ { "title": "...", "excerpt": "...", "content": "...", "category": "...", "slug": "tieu-de-khong-dau" } ]
      Lưu ý: Chỉ trả về JSON nguyên bản.`;

      setSeedingProgress(`--- ĐANG DÙNG IRIS GEMINI CORE ---`);
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const postsArray = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      setSeedingProgress(`Đã tạo nội dung 5 bài viết. Đang minh họa & lưu trữ...`);

      for (const [idx, post] of postsArray.entries()) {
        const seed = Math.floor(Math.random() * 1000000);
        const thumbnailUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(post.title)}?width=1280&height=720&nologo=true&seed=${seed}`;
        
        const docId = `seed-${Date.now()}-${idx}`;
        await setDoc(doc(db, 'blog_posts', docId), {
          ...post,
          date: new Date().toLocaleDateString('vi-VN'),
          author: 'IRIS Core Seeder',
          thumbnail: thumbnailUrl,
          published: true,
          timestamp: new Date()
        });
      }

      setSeedingProgress('✅ ĐÃ TẠO 5 BÀI VIẾT MỒI THÀNH CÔNG!');
      fetchBlogPosts();
    } catch (err) {
      setSeedingProgress('❌ LỖI SEEDING: ' + err.message);
    } finally {
      setIsSyncingNews(false);
      setTimeout(() => setSeedingProgress(''), 5000);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const q = query(collection(db, "system_analytics"), orderBy('timestamp', 'desc'), limit(1000));
      const snapshot = await getDocs(q);
      setAnalyticsData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const generateNewsletter = async () => {
    setNewsletterLoading(true);
    const groqEnabled = localConfig?.integrations?.groqEnabled !== false;
    const groqKey = localConfig?.integrations?.groqKey;
    if (!groqEnabled || !groqKey) {
      alert("Chức năng Newsletter đang bị khoá (Groq Node chưa được bật hoặc chưa có Key)!");
      setNewsletterLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { 
              role: "system", 
              content: "Bạn là chuyên gia viết Newsletter chuyên nghiệp cho IRIS AI Ecosystem. Hãy viết một bản tin ngắn gọn, lôi cuốn về các cập nhật mới nhất (Dark Mode, i18n, Chef AI) bằng tiếng Việt và Anh." 
            },
            { role: "user", content: "Hãy tạo một bản tin gửi khách hàng tuần này." }
          ]
        })
      });
      const data = await response.json();
      setNewsletterContent(data.choices[0].message.content);
    } catch (err) {
      alert("Lỗi generation: " + err.message);
    } finally {
      setNewsletterLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(query(collection(db, "users"), limit(50)));
      const usersData = [];
      querySnapshot.forEach((docSnap) => {
        usersData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsersList(usersData);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const deleteUserRecord = useCallback(async (userId) => {
    if (!window.confirm('Ngài có chắc chắn muốn xoá hồ sơ này khỏi Database?')) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsersList(prev => prev.filter(u => u.id !== userId));
      alert("Đã xoá hồ sơ thành công!");
    } catch (err) {
      alert("Lỗi khi xoá: " + err.message);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      setProjectsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const deleteProject = async (id) => {
    if (!window.confirm('Ngài có chắc chắn muốn xoá dự án này?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjectsList(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const saveProject = async (e) => {
    e.preventDefault();
    const data = projectModal.data;
    try {
      const docId = data.id || `proj-${Date.now()}`;
      const finalData = {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt : (data.createdAt ? new Date(data.createdAt) : new Date()),
        updatedAt: new Date(),
        downloadCount: data.downloadCount || 0,
        techStack: Array.isArray(data.techStack) ? data.techStack : (typeof data.techStack === 'string' ? data.techStack.split(',').map(s => s.trim()) : [])
      };
      await setDoc(doc(db, 'projects', docId), finalData, { merge: true });
      setProjectModal({ isOpen: false, mode: 'add', data: {} });
      fetchProjects();
    } catch (err) {
      alert("Lỗi lưu: " + err.message);
    }
  };
  
  const saveUserRecord = async (e) => {

    e.preventDefault();
    const { id, email, username, firstName, lastName, role, displayName, photoURL } = userModal.data;
    
    const finalPhotoURL = photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${email || Math.random()}`;
    const finalDisplayName = displayName || (firstName ? `${lastName || ''} ${firstName}`.trim() : 'Người Dùng');
    
    const docData = {
       email: email || '',
       username: username || '',
       firstName: firstName || '',
       lastName: lastName || '',
       displayName: finalDisplayName,
       role: role || 'user',
       photoURL: finalPhotoURL,
       updatedAt: new Date()
    };
    
    try {
       const targetId = id || `manual_${Date.now()}`;
       await setDoc(doc(db, "users", targetId), docData, { merge: true });
       setUserModal({ isOpen: false, mode: 'add', data: {} });
       fetchUsers();
    } catch (err) {
       alert("Lỗi khi lưu: " + err.message);
    }
  };

  const triggerAINewsSync = async () => {
    const key = localConfig?.integrations?.geminiKey;
    if (!key) {
        setSyncStatus('⚠️ Lỗi: Thiếu API Key!');
        return;
    }

    setIsSyncingNews(true);
    setSyncStatus('🔍 Đang thu thập tin tức công nghệ mới nhất...');

    try {
        const prompt = `Bạn là biên tập viên tin tức công nghệ. Hãy tìm và tổng hợp 3 tin tức công nghệ mới nhất (tháng 4/2026) tại Việt Nam và Thế giới. 
        Mỗi tin tức cần: Tiêu đề lôi cuốn, Tóm tắt ngắn gọn, Nội dung chi tiết (khoảng 200 chữ), Danh mục (AI, Web, Hardware, hoặc Software), và từ khóa.
        Trả về kết quả dưới dạng JSON mảng các đối tượng: 
        [ { "title": "...", "excerpt": "...", "content": "...", "category": "...", "keywords": ["..."] } ] 
        Lưu ý: Chỉ trả về JSON, không kèm văn bản khác.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) throw new Error('Không nhận được phản hồi từ AI');

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const newsArray = JSON.parse(jsonMatch ? jsonMatch[0] : text);

        setSyncStatus('🚀 Đang đăng bài lên Bảng tin...');

        for (const news of newsArray) {
            const docId = `ai-news-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const blogRef = doc(db, 'blog_posts', docId);
            await setDoc(blogRef, {
                ...news,
                date: new Date().toLocaleDateString('vi-VN'),
                author: 'IRIS Intelligence AI',
                thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800', 
                published: true
            });
        }

        setSyncStatus('✅ THÀNH CÔNG! Đã cập nhật 3 bản tin mới.');
        setTimeout(() => setSyncStatus(''), 5000);
    } catch (err) {
        console.error(err);
        setSyncStatus(`❌ THẤT BẠI: ${err.message}`);
    } finally {
        setIsSyncingNews(false);
    }
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
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleReAdjust = (imageUrl, callback, aspect = 1.5) => {
    setAdjustmentModal({ isOpen: true, src: imageUrl, callback, aspect });
    setZoom(1);
    setDragPos({ x: 0, y: 0 });
  };

  const handleFileUpload = (e, callback, aspect = 1.5) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Tệp quá lớn! Giới hạn tối đa là 50MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result;
        
        if (typeof result === 'string' && result.startsWith('data:image')) {
           handleReAdjust(result, callback, aspect);
        } else {
           callback(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImage = async () => {
    const img = new Image();
    img.src = adjustmentModal.src;
    await new Promise(r => img.onload = r);

    const canvas = document.createElement('canvas');
    const targetWidth = 1200;
    const targetHeight = targetWidth / adjustmentModal.aspect;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    const containerWidth = 600; 
    const containerHeight = containerWidth / adjustmentModal.aspect;

    const displayToReal = targetWidth / containerWidth;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    const drawWidth = img.width * (targetHeight / img.height) * zoom;
    const drawHeight = targetHeight * zoom;
    
    const x = (targetWidth - drawWidth) / 2 + (dragPos.x * displayToReal);
    const y = (targetHeight - drawHeight) / 2 + (dragPos.y * displayToReal);

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    
    const result = canvas.toDataURL('image/jpeg', 0.85);
    adjustmentModal.callback(result);
    setAdjustmentModal({ isOpen: false, src: '', callback: null, aspect: 1.5 });
  };

  const updateNested = useCallback((category, field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('SAVING...');
    try {
      // Deep sanitize to prevent Firebase: Property content contains an invalid nested entity
      const sanitize = (obj) => {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
          if (value === undefined) return null;
          if (value && typeof value === 'object' && value.$$typeof) return null;
          return value;
        }));
      };

      const cleanConfig = sanitize(localConfig);

      const { content, ...rest } = cleanConfig;
      const { quotes, filmStripImages, ...contentRest } = content || {};

      await setDoc(doc(db, 'system', 'config'), rest);

      await setDoc(doc(db, 'system', 'content'), { ...contentRest, quotes });

      if (filmStripImages) {
        
        const oldMems = await getDocs(collection(db, 'memories'));
        for (const m of oldMems.docs) {
          await deleteDoc(doc(db, 'memories', m.id));
        }

        for (let i = 0; i < filmStripImages.length; i++) {
           if (filmStripImages[i]) {
              await setDoc(doc(db, 'memories', `mem_${i}`), {
                url: filmStripImages[i],
                order: i,
                updatedAt: new Date().toISOString()
              });
           }
        }

        await setDoc(doc(db, 'system', 'memories'), { 
          lastUpdated: new Date().toISOString(),
          count: filmStripImages.length
        });
      }

      setStatus('CONFIG_UPDATED_SUCCESSFULLY');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('ERROR_SAVING_CONFIG');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'CÀI ĐẶT CHUNG', icon: <Globe size={18} /> },
    { id: 'appearance', label: 'GIAO DIỆN', icon: <Palette size={18} /> },
    { id: 'filmstrip', label: 'KỸ THUẬT SỐ & KÝ ỨC', icon: <ImageIcon size={18} /> },
    { id: 'apps', label: 'ỨNG DỤNG TIN DÙNG', icon: <Zap size={18} /> },
    { id: 'content', label: 'QUẢN LÝ DANH NGÔN', icon: <MessageSquare size={18} /> },
    { id: 'maintenance', label: 'QUẢN LÝ TRẠNG THÁI TRANG', icon: <Lock size={18} /> },
    { id: 'analytics', label: 'THỐNG KÊ TRAFFIC', icon: <BarChart3 size={18} /> },
    { id: 'blog', label: 'QUẢN LÝ BLOG', icon: <FileText size={18} /> },
    { id: 'projects', label: 'QUẢN LÝ DỰ ÁN', icon: <Package size={18} /> },
    { id: 'users', label: 'QUẢN LÝ TÀI KHOẢN', icon: <Users size={18} /> }
  ];

  if (loading || !localConfig) {
    return <div className="admin-loading">Đang đồng bộ dữ liệu hệ thống BCT...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Mobile Drawer Toggle Button */}
      <button 
        className="mobile-sidebar-toggle" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle admin navigation menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Backdrop */}
      <div 
        className={`mobile-sidebar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-left">
            <Bot size={22} style={{ color: 'var(--admin-accent)' }} />
            <span>BCT STUDIO</span>
          </div>
        </div>
        
        <nav className="admin-nav" aria-label="Admin Navigation">
          <Link to="/" className="nav-item-link" style={{ marginBottom: '1.25rem' }}>
            <Home size={18} />
            <span>VỀ TRANG CHỦ</span>
          </Link>

          <div className="admin-nav-scroll">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <main className="admin-content">
        <header className="admin-header">
          <div className="admin-header-titles">
            <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
            <p>Studio Workspace · Cấu hình hệ thống BCT</p>
          </div>
          
          <div className="admin-header-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ textDecoration: 'none' }}>
              <ExternalLink size={16} />
              <span>Xem Web</span>
            </a>
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}</span>
              <span className="save-shortcut-badge">⌘S</span>
            </button>
          </div>
        </header>

        <div className="admin-frame">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                <div className="admin-card">
                  <div className="config-section-title">
                    <ImageIcon size={18} /> LOGO VÀ NHẬN DIỆN
                  </div>
                  
                  <div className="form-group">
                    <label>LOGO WEBSITE</label>
                    <div className="admin-input-row">
                       <input 
                         type="text" 
                         className="admin-input"
                         value={localConfig.appearance?.logoUrl || ''} 
                         onChange={(e) => updateNested('appearance', 'logoUrl', e.target.value)}
                         placeholder="URL Logo hoặc tải lên..."
                       />
                       <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <label className="btn-primary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                             <Upload size={18} /> TẢI LÊN
                             <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => updateNested('appearance', 'logoUrl', res), 1)} />
                          </label>
                          {localConfig.appearance?.logoUrl && (
                             <button className="btn-ghost" onClick={() => handleReAdjust(localConfig.appearance.logoUrl, (res) => updateNested('appearance', 'logoUrl', res), 1)}>
                                <Crop size={18} />
                             </button>
                          )}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                        <Globe size={18} /> QUẢN LÝ MẠNG XÃ HỘI ({(localConfig.social_links || []).length})
                      </div>
                      <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                        Chọn logo có sẵn hoặc tải ảnh logo riêng, sau đó nhập liên kết URL.
                      </p>
                    </div>
                    <button className="add-btn" onClick={() => {
                      const newSocials = [...(localConfig.social_links || [])];
                      newSocials.push({ icon: 'Globe', url: '', customIcon: '' });
                      setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                    }}>
                      <Plus size={16} /> Thêm Mạng Xã Hội
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(localConfig.social_links || []).map((social, idx) => (
                      <div key={idx} className="social-compact-row">
                        {/* Logo Trigger & Popover */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="social-logo-trigger"
                            onClick={() => setActiveIconPickerIdx(activeIconPickerIdx === idx ? null : idx)}
                            title="Bấm để đổi Logo / Icon"
                          >
                            {social.customIcon ? (
                              <img src={social.customIcon} alt="social-logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : social.icon ? (
                              <SocialIcon name={social.icon} size={22} color="#fff" />
                            ) : (
                              <Globe size={22} color="#fff" />
                            )}
                          </button>

                          {activeIconPickerIdx === idx && (
                            <div className="social-picker-dropdown">
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '0.6rem' }}>
                                CHỌN LOGO THÔNG DỤNG
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
                                    <SocialIcon name={platform.icon} size={18} color={platform.color || '#fff'} />
                                    <span>{platform.name}</span>
                                  </button>
                                ))}
                              </div>

                              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
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

                        {/* URL Input */}
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

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => {
                            const newSocials = (localConfig.social_links || []).filter((_, i) => i !== idx);
                            setLocalConfig(prev => ({ ...prev, social_links: newSocials }));
                          }}
                          aria-label="Xóa mạng xã hội"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
            </motion.div>
          )}

          {activeTab === 'filmstrip' && (
              <motion.div key="filmstrip" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                <div className="admin-card">
                  <div className="config-section-title">
                    <ImageIcon size={18} /> CẤU HÌNH DẢI PHIM KỸ THUẬT SỐ
                  </div>
                  
                  <div className="form-group">
                     <label>TỐC ĐỘ CUỘN PHIM (GIÂY)</label>
                     <input 
                       type="number" 
                       className="admin-input" 
                       value={localConfig.content?.filmStripSpeed || 45} 
                       onChange={(e) => updateNested('content', 'filmStripSpeed', Number(e.target.value))} 
                       min="10" 
                       max="120" 
                     />
                  </div>
                </div>

                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div className="config-section-title" style={{ margin: 0 }}>
                      <ImageIcon size={18} /> HÌNH ẢNH DẢI PHIM ({(localConfig.content?.filmStripImages || []).length})
                    </div>
                    <button className="add-btn" onClick={() => {
                       const newFilms = [...(localConfig.content?.filmStripImages || [])];
                       newFilms.push('');
                       updateNested('content', 'filmStripImages', newFilms);
                    }}>
                      <Plus size={16} /> THÊM ẢNH/VIDEO
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {(localConfig.content?.filmStripImages || []).map((imgUrl, idx) => {
                      const isVideo = imgUrl?.match(/\.(mp4|webm|ogg|mov)$|^data:video/i);
                      return (
                        <div key={idx} className="visitor-row-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                           <div style={{ height: '140px', background: '#000', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                              {isVideo ? (
                                <video src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop />
                              ) : (
                                <img src={imgUrl} alt="strip" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = '/placeholder.png'} />
                              )}
                           </div>
                           <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input 
                                type="text" 
                                className="admin-input" 
                                placeholder="URL ảnh hoặc Base64..." 
                                value={imgUrl} 
                                style={{ flex: 1, fontSize: '0.82rem', padding: '0.45rem 0.65rem' }} 
                                onChange={(e) => {
                                  const newFilms = [...(localConfig.content?.filmStripImages || [])];
                                  newFilms[idx] = e.target.value;
                                  updateNested('content', 'filmStripImages', newFilms);
                                }} 
                              />
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                 <label className="btn-primary" style={{ cursor: 'pointer', padding: '0.45rem 0.65rem', minHeight: 'auto' }}>
                                    <Upload size={14} />
                                    <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => {
                                       const newFilms = [...(localConfig.content?.filmStripImages || [])];
                                       newFilms[idx] = res;
                                       updateNested('content', 'filmStripImages', newFilms);
                                    }, 1.77)} />
                                 </label>
                                 {!isVideo && imgUrl && (
                                    <button className="btn-ghost" style={{ padding: '0.45rem 0.65rem', minHeight: 'auto' }} onClick={() => handleReAdjust(imgUrl, (res) => {
                                       const newFilms = [...(localConfig.content?.filmStripImages || [])];
                                       newFilms[idx] = res;
                                       updateNested('content', 'filmStripImages', newFilms);
                                    }, 1.77)}>
                                       <Crop size={14} />
                                    </button>
                                 )}
                              </div>
                              <button className="delete-btn" style={{ padding: '0.45rem', borderRadius: '6px' }} onClick={() => {
                                 const newFilms = (localConfig.content?.filmStripImages || []).filter((_, i) => i !== idx);
                                 updateNested('content', 'filmStripImages', newFilms);
                              }}><Trash2 size={15} /></button>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'apps' && (
              <motion.div key="apps" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                        <Box size={18} /> HỆ SINH THÁI ỨNG DỤNG ({(localConfig.apps || []).length})
                      </div>
                      <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                        Các phần mềm và công cụ tin dùng hiển thị trên trang chủ.
                      </p>
                    </div>
                    <button className="add-btn" onClick={() => {
                       const newApps = [...(localConfig.apps || [])];
                       newApps.push({ name: '', color: '#5e6ad2', iconUrl: '' });
                       setLocalConfig(prev => ({ ...prev, apps: newApps }));
                    }}>
                      <Plus size={16} /> Thêm Ứng Dụng
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(localConfig.apps || []).map((app, idx) => (
                      <div key={idx} className="app-compact-row">
                        {/* App Icon Box with Upload & Crop */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div className="app-icon-preview">
                            {app.iconUrl ? (
                              <img 
                                src={app.iconUrl} 
                                alt={app.name || 'App icon'} 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                              />
                            ) : (
                              <Box size={20} style={{ color: app.color || 'var(--admin-accent)' }} />
                            )}
                          </div>

                          <label className="btn-ghost" style={{ cursor: 'pointer', padding: '0.45rem', width: '36px', height: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Tải icon lên">
                            <Upload size={14} />
                            <input 
                              type="file" 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={(e) => handleFileUpload(e, (res) => {
                                const newApps = [...(localConfig.apps || [])];
                                newApps[idx] = { ...newApps[idx], iconUrl: res };
                                setLocalConfig(prev => ({ ...prev, apps: newApps }));
                              }, 1)} 
                            />
                          </label>

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
                        </div>

                        {/* App Name Input */}
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
                        
                        {/* Brand Color Picker */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="social-color-picker" style={{ background: app.color || '#5e6ad2' }}>
                            <input 
                              type="color" 
                              value={app.color || '#5e6ad2'} 
                              onChange={(e) => {
                                const newApps = [...(localConfig.apps || [])];
                                newApps[idx] = { ...newApps[idx], color: e.target.value };
                                setLocalConfig(prev => ({ ...prev, apps: newApps }));
                              }} 
                              title="Chọn màu nhận diện"
                            />
                          </div>
                          <code style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{app.color || '#5e6ad2'}</code>
                        </div>
                        
                        {/* Delete Button */}
                        <button 
                          type="button"
                          className="delete-btn" 
                          onClick={() => {
                            const newApps = (localConfig.apps || []).filter((_, i) => i !== idx);
                            setLocalConfig(prev => ({ ...prev, apps: newApps }));
                          }}
                          aria-label={`Xóa ứng dụng ${app.name || ''}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                <div className="admin-card">
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div className="config-section-title" style={{ margin: '0 0 0.35rem 0' }}>
                           <MessageSquare size={18} style={{ color: 'var(--admin-accent)' }} /> QUẢN LÝ DANH NGÔN TRANG CHỦ ({(localConfig.content?.quotes || []).length})
                        </div>
                        <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                          Các câu trích dẫn sẽ hiển thị tự động trên thanh tiêu đề và chân trang web. Bấm trực tiếp vào ô để sửa.
                        </p>
                      </div>
                      <button className="add-btn" onClick={() => {
                        const newQuotes = [...(localConfig.content?.quotes || [])];
                        newQuotes.push('Danh ngôn mới...');
                        updateNested('content', 'quotes', newQuotes);
                      }}>
                        <Plus size={16} /> Thêm Câu Mới
                      </button>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '65vh', overflowY: 'auto' }} className="admin-nav-scroll">
                      {(localConfig.content?.quotes || []).map((quote, idx) => (
                        <div key={idx} className="quote-item-card">
                           <span className="quote-index">{String(idx + 1).padStart(2, '0')}</span>
                           <div className="quote-text-container">
                             <textarea 
                               className="quote-edit-input"
                               value={quote} 
                               onChange={(e) => {
                                 const newQuotes = [...(localConfig.content?.quotes || [])];
                                 newQuotes[idx] = e.target.value;
                                 updateNested('content', 'quotes', newQuotes);
                               }} 
                               rows={2} 
                               aria-label={`Câu danh ngôn số ${idx + 1}`}
                             />
                           </div>
                           <button 
                             className="delete-btn" 
                             onClick={() => {
                               const newQuotes = (localConfig.content?.quotes || []).filter((_, i) => i !== idx);
                               updateNested('content', 'quotes', newQuotes);
                             }}
                             aria-label={`Xóa danh ngôn số ${idx + 1}`}
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                <div className="admin-card">
                  <div className="config-section-title">
                    <Palette size={18} /> THEME COLOR ENGINE
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div className="form-group">
                      <label>CHẾ ĐỘ GIAO DIỆN</label>
                      <select 
                        className="admin-select"
                        value={localConfig.appearance.theme || 'dark'} 
                        onChange={(e) => updateNested('appearance', 'theme', e.target.value)}
                      >
                         <option value="dark">Tối (Cyber Dark)</option>
                         <option value="light">Sáng (Pure Light)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>MÀU CHỦ ĐẠO</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="social-color-picker" style={{ background: localConfig.appearance.primaryColor }}>
                          <input type="color" value={localConfig.appearance.primaryColor} onChange={(e) => updateNested('appearance', 'primaryColor', e.target.value)} />
                        </div>
                        <code style={{ fontSize: '0.9rem', background: 'var(--bg-glass)', padding: '0.5rem 1rem', borderRadius: '8px' }}>{localConfig.appearance.primaryColor}</code>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>MÀU NHẤN MẠNH</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="social-color-picker" style={{ background: localConfig.appearance.accentColor }}>
                          <input type="color" value={localConfig.appearance.accentColor} onChange={(e) => updateNested('appearance', 'accentColor', e.target.value)} />
                        </div>
                        <code style={{ fontSize: '0.9rem', background: 'var(--bg-glass)', padding: '0.5rem 1rem', borderRadius: '8px' }}>{localConfig.appearance.accentColor}</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="config-section-title">
                    <Layout size={18} /> CẤU HÌNH NỀN AI & TIỆN ÍCH
                  </div>
                  
                  <div className="form-group">
                    <label>HÌNH NỀN CHỦ ĐẠO (PNG / GIF / MP4)</label>
                    <div className="admin-input-row">
                       <input type="text" className="admin-input" value={localConfig.appearance.utilityBackground || ''} onChange={(e) => updateNested('appearance', 'utilityBackground', e.target.value)} placeholder="Dán URL hoặc Upload..." />
                       <label className="btn-primary" style={{ cursor: 'pointer' }}>
                          <Upload size={18} /> TẢI LÊN
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => updateNested('appearance', 'utilityBackground', res))} />
                       </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ĐỘ MỜ KÍNH (BLUR: {localConfig.appearance.utilityGlassBlur || 15}PX)</label>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <input 
                        type="range" 
                        min="0" max="40" 
                        value={localConfig.appearance.utilityGlassBlur || 15} 
                        onChange={(e) => updateNested('appearance', 'utilityGlassBlur', Number(e.target.value))} 
                        style={{ flex: 1, accentColor: 'var(--admin-accent)' }}
                      />
                      <code style={{ width: '40px', textAlign: 'right' }}>{localConfig.appearance.utilityGlassBlur || 15}</code>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">

                {/* Top Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div className="admin-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--admin-accent)', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)', fontSize: '0.75rem', marginBottom: '0.6rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                       <span>NGƯỜI TRUY CẬP (UNIQUE)</span>
                       <Users size={16} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--admin-accent)', letterSpacing: '-0.03em' }}>
                      {groupedVisitors.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem' }}>
                      {groupedVisitors.filter(v => !v.isAdmin).length} Khách ngoài · {groupedVisitors.filter(v => v.isAdmin).length} Admin
                    </div>
                  </div>

                  <div className="admin-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)', fontSize: '0.75rem', marginBottom: '0.6rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                       <span>TỔNG LƯỢT XEM (HITS)</span>
                       <Eye size={16} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em' }}>
                      {analyticsData.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem' }}>
                      Toàn bộ lượt tải trang ghi nhận
                    </div>
                  </div>
                  
                  <div className="admin-card" style={{ padding: '1.5rem', borderLeft: '4px solid #6366f1', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)', fontSize: '0.75rem', marginBottom: '0.6rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                       <span>TRANG ĐƯỢC XEM NHẤT</span>
                       <TrendingUp size={16} />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--admin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.25rem' }}>
                      {(() => {
                        const counts = {};
                        analyticsData.forEach(d => { if (d.path) counts[d.path] = (counts[d.path] || 0) + 1; });
                        const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
                        return top ? `${top[0]} (${top[1]} hits)` : 'N/A';
                      })()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem' }}>
                      Điểm đến phổ biến nhất
                    </div>
                  </div>

                  <div className="admin-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-muted)', fontSize: '0.75rem', marginBottom: '0.6rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                       <span>THIẾT BỊ DI ĐỘNG</span>
                       <Smartphone size={16} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.03em' }}>
                      {(() => {
                        let mob = 0;
                        analyticsData.forEach(d => { if(d.isMobile || /Android|iPhone/i.test(d.userAgent)) mob++; });
                        return analyticsData.length ? `${Math.round((mob/analyticsData.length)*100)}%` : '0%';
                      })()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem' }}>
                      Tỷ lệ truy cập từ Mobile / Tablet
                    </div>
                  </div>
                </div>

                {/* Analytics List & Controls */}
                <div className="admin-card" style={{ padding: '2rem' }}>
                  <div className="analytics-filter-bar">
                     <div>
                        <div className="config-section-title" style={{ margin: '0 0 0.3rem 0' }}>
                           <Activity size={18} style={{ color: 'var(--admin-accent)' }} /> LƯU LƯỢNG TRUY CẬP ĐÃ GOM NHÓM
                        </div>
                        <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                          Mỗi hàng đại diện cho 1 người/thiết bị riêng biệt. Bấm Refresh để cập nhật dữ liệu mới nhất.
                        </p>
                     </div>

                     <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="filter-pills">
                          <button 
                            className={`filter-pill ${analyticsFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setAnalyticsFilter('all')}
                          >
                            Tất cả ({groupedVisitors.length})
                          </button>
                          <button 
                            className={`filter-pill ${analyticsFilter === 'guest' ? 'active' : ''}`}
                            onClick={() => setAnalyticsFilter('guest')}
                          >
                            👤 Khách ({groupedVisitors.filter(v => !v.isAdmin).length})
                          </button>
                          <button 
                            className={`filter-pill ${analyticsFilter === 'admin' ? 'active' : ''}`}
                            onClick={() => setAnalyticsFilter('admin')}
                          >
                            👑 Admin ({groupedVisitors.filter(v => v.isAdmin).length})
                          </button>
                        </div>

                        <button className="add-btn" onClick={fetchAnalytics} disabled={loadingAnalytics}>
                          <Activity size={16} className={loadingAnalytics ? "spin" : ""} /> REFRESH
                        </button>
                     </div>
                  </div>

                  {filteredVisitors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--admin-text-muted)' }}>
                      Không tìm thấy dữ liệu lưu lượng phù hợp với bộ lọc.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {filteredVisitors.map((v, i) => (
                        <div key={v.visitorId || i} className="visitor-row-card">
                          <div className="visitor-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                              {v.isAdmin ? (
                                <span className="visitor-badge-admin">👑 CHÍNH BẠN (ADMIN)</span>
                              ) : (
                                <span className="visitor-badge-guest">👤 KHÁCH #{String(v.visitorId || 'guest').slice(-6).toUpperCase()}</span>
                              )}
                              <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                                {v.deviceLabel}
                              </span>
                              {(v.city || v.country) && (
                                <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  📍 {[v.city, v.country].filter(Boolean).join(', ')} {v.countryCode === 'VN' ? '🇻🇳' : ''}
                                </span>
                              )}
                              {v.ip && (
                                <code style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px' }}>
                                  🌐 {v.ip}
                                </code>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                              <span className="visitor-hits">
                                {v.totalHits} lượt xem
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                                {v.lastTimestamp?.toDate ? v.lastTimestamp.toDate().toLocaleString() : 'Vừa xong'}
                              </span>
                            </div>
                          </div>

                          <div className="visitor-paths">
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginRight: '0.25rem', display: 'flex', alignItems: 'center' }}>
                              Trang đã xem:
                            </span>
                            {Array.from(v.paths).map((p, pIdx) => (
                              <span key={pIdx} className="path-chip">{p}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'blog' && (
              <motion.div key="blog" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                     <div className="config-section-title" style={{ margin: 0 }}>
                        <FileText size={18} /> QUẢN LÝ BÀI VIẾT & BLOG
                     </div>
                     <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/admin/cms/new" className="btn-primary" style={{ textDecoration: 'none' }}>
                          <Edit size={16} /> VIẾT BÀI MỚI
                        </Link>
                        <button className="btn-ghost" onClick={fetchBlogPosts}><Activity size={16} /></button>
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
                                <img src={post.thumbnail} style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--admin-border)' }} alt={post.title || 'Thumbnail bài viết'} />
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{post.title}</div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.7rem', color: post.published ? 'var(--admin-accent)' : '#f59e0b', background: 'var(--bg-glass)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--admin-border)' }}>
                                {post.category?.toUpperCase() || 'TECH'} | {post.published ? 'PUBLIC' : 'DRAFT'}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', opacity: 0.6 }}>{post.date}</td>
                            <td>
                              <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                <Link to={`/admin/cms/${post.id}`} className="edit-btn" aria-label={`Edit post ${post.title}`}><Edit size={16} /></Link>
                                <button className="delete-btn" onClick={() => deleteBlogPost(post.id)} aria-label={`Delete post ${post.title}`}><Trash2 size={16} /></button>
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

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                 <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                       <div className="config-section-title" style={{ margin: 0 }}>
                          <Users size={18} /> QUẢN LÝ TÀI KHOẢN ({usersList.length})
                       </div>
                       <button className="add-btn" onClick={() => setUserModal({ isOpen: true, mode: 'add', data: { role: 'user' } })}>
                         <Plus size={16} /> THÊM MỚI
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
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                         <img src={user.photoURL} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} alt={user.displayName || 'Avatar'} />
                                         <div>
                                            <div style={{ fontWeight: 700 }}>{user.displayName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-accent)' }}>@{user.username}</div>
                                         </div>
                                      </div>
                                   </td>
                                   <td style={{ fontSize: '0.9rem', opacity: 0.8 }}>{user.email}</td>
                                   <td><span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: user.role === 'admin' ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.05)', color: user.role === 'admin' ? 'var(--admin-accent)' : '#fff' }}>{user.role?.toUpperCase()}</span></td>
                                   <td>
                                      <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                         <button onClick={() => setUserModal({ isOpen: true, mode: 'edit', data: user })} aria-label={`Edit user ${user.displayName}`}><Edit size={16} /></button>
                                         <button onClick={() => deleteUserRecord(user.id)} className="delete-btn" aria-label={`Delete user ${user.displayName}`}><Trash2 size={16} /></button>
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



            {activeTab === 'maintenance' && (
              <motion.div key="maintenance" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                <div className="admin-card">
                  <div className="config-section-title">
                    <Lock size={18} /> QUẢN LÝ TRẠNG THÁI HỆ THỐNG
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {['blog', 'chronicles', 'about', 'skills'].map(key => (
                      <div key={key} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--admin-border)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--admin-accent)' }}>{key.toUpperCase()}</span>
                          {(localConfig.maintenance && localConfig.maintenance[key]) ? <Lock size={16} color="#ef4444" /> : <Unlock size={16} color="#10b981" />}
                        </div>
                        
                        <button 
                          className="btn-ghost"
                          onClick={() => updateNested('maintenance', key, !((localConfig.maintenance && localConfig.maintenance[key]) || false))}
                          style={{ background: (localConfig.maintenance && localConfig.maintenance[key]) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: (localConfig.maintenance && localConfig.maintenance[key]) ? '#ef4444' : '#10b981', border: 'none', fontWeight: 800 }}
                        >
                          {(localConfig.maintenance && localConfig.maintenance[key]) ? 'HỆ THỐNG ĐANG KHÓA' : 'ĐANG TRẠNG THÁI CÔNG KHAI'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div key="projects" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="config-section">
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div className="config-section-title" style={{ margin: 0 }}>
                      <Package size={18} /> QUẢN LÝ DỰ ÁN & PHẦN MỀM
                    </div>
                    <button className="add-btn" onClick={() => setProjectModal({ isOpen: true, mode: 'add', data: { techStack: '' } })}>
                      <Plus size={16} /> THÊM DỰ ÁN MỚI
                    </button>
                  </div>

                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>DỰ ÁN</th>
                          <th>PHIÊN BẢN</th>
                          <th>LƯỢT TẢI</th>
                          <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectsList.map(proj => (
                          <tr key={proj.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={proj.thumbnail} style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--admin-border)' }} alt={proj.title || 'Dự án'} />
                                <div>
                                  <div style={{ fontWeight: 700 }}>{proj.title}</div>
                                  <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}</div>
                                </div>
                              </div>
                            </td>
                            <td><code style={{ fontSize: '0.8rem', background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: '4px' }}>v{proj.version}</code></td>
                            <td style={{ fontWeight: 800, color: 'var(--admin-text-secondary)' }}>{proj.downloadCount || 0}</td>
                            <td>
                              <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                <button onClick={() => setProjectModal({ isOpen: true, mode: 'edit', data: { ...proj, techStack: Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack } })} aria-label={`Edit project ${proj.title}`}><Edit size={16} /></button>
                                <button onClick={() => deleteProject(proj.id)} className="delete-btn" aria-label={`Delete project ${proj.title}`}><Trash2 size={16} /></button>
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

          </AnimatePresence>

        </div>
      </main>

      {projectModal.isOpen && (
        <div className="admin-modal-overlay">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="admin-modal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-tech)', color: 'var(--admin-accent)' }}>
                  {projectModal.mode === 'add' ? 'KHỞI TẠO' : 'HIỆU CHỈNH'} DỰ ÁN
                </h2>
                <button className="btn-ghost" onClick={() => setProjectModal({ isOpen: false, mode: 'add', data: {} })}><X size={20} /></button>
              </div>

              <form onSubmit={saveProject}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                       <label>TÊN DỰ ÁN</label>
                       <input type="text" className="admin-input" value={projectModal.data.title || ''} onChange={(e) => setProjectModal({ ...projectModal, data: { ...projectModal.data, title: e.target.value } })} required />
                    </div>
                    <div className="form-group">
                       <label>PHIÊN BẢN</label>
                       <input type="text" className="admin-input" placeholder="1.0.0" value={projectModal.data.version || ''} onChange={(e) => setProjectModal({ ...projectModal, data: { ...projectModal.data, version: e.target.value } })} required />
                    </div>
                 </div>

                 <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>MÔ TẢ NGẮN</label>
                    <input type="text" className="admin-input" value={projectModal.data.description || ''} onChange={(e) => setProjectModal({ ...projectModal, data: { ...projectModal.data, description: e.target.value } })} required />
                 </div>

                 <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>NỘI DUNG CHI TIẾT (MARKDOWN)</label>
                    <textarea 
                      className="admin-textarea"
                      rows={4}
                      value={projectModal.data.longDescription || ''} 
                      onChange={(e) => setProjectModal({ ...projectModal, data: { ...projectModal.data, longDescription: e.target.value } })} 
                      placeholder="Hướng dẫn sử dụng, tính năng..."
                    />
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                       <label>LINK DOWNLOAD</label>
                       <input type="text" className="admin-input" value={projectModal.data.downloadUrl || ''} onChange={(e) => setProjectModal({ ...projectModal, data: { ...projectModal.data, downloadUrl: e.target.value } })} required />
                    </div>
                    <div className="form-group">
                       <label>TECH STACK</label>
                       <input type="text" className="admin-input" placeholder="React, AI, Cloud..." value={projectModal.data.techStack || ''} onChange={(e) => setProjectModal({ ...projectModal, data: { ...projectModal.data, techStack: e.target.value } })} />
                    </div>
                 </div>

                 <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>URL HÌNH ẢNH (THUMBNAIL)</label>
                    <div className="admin-input-row">
                       <input type="text" className="admin-input" value={projectModal.data.thumbnail || ''} onChange={(e) => setProjectModal({ ...projectModal, data: { ...projectModal.data, thumbnail: e.target.value } })} />
                       <label className="btn-primary" style={{ cursor: 'pointer' }}>
                          <Upload size={18} /> UPLOAD
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, (res) => setProjectModal({ ...projectModal, data: { ...projectModal.data, thumbnail: res } }), 1.77)} />
                       </label>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      <Save size={18}/> XÁC NHẬN LƯU
                    </button>
                    <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setProjectModal({ isOpen: false, mode: 'add', data: {} })}>HỦY BỎ</button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}

      {userModal.isOpen && (
        <div className="admin-modal-overlay">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="admin-modal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-tech)', color: 'var(--admin-accent)' }}>HỒ SƠ NGƯỜI DÙNG</h2>
                <button className="btn-ghost" onClick={() => setUserModal({ isOpen: false, mode: 'add', data: {} })}><X size={20} /></button>
              </div>

              <form onSubmit={saveUserRecord}>
                 <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                       <label>TÊN HIỂN THỊ</label>
                       <input type="text" className="admin-input" value={userModal.data.displayName || ''} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, displayName: e.target.value } })} required />
                    </div>
                    <div className="form-group">
                       <label>VAI TRÒ</label>
                       <select className="admin-select" value={userModal.data.role || 'user'} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, role: e.target.value } })}>
                          <option value="user">USER</option>
                          <option value="admin">ADMIN</option>
                       </select>
                    </div>
                 </div>
                 <div className="form-group">
                    <label>EMAIL HỆ THỐNG</label>
                    <input type="email" className="admin-input" value={userModal.data.email || ''} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })} required />
                 </div>
                 <div className="form-group">
                    <label>USERNAME @</label>
                    <input type="text" className="admin-input" value={userModal.data.username || ''} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, username: e.target.value } })} />
                 </div>
                 <div className="form-group">
                    <label>URL AVATAR</label>
                    <input type="text" className="admin-input" value={userModal.data.photoURL || ''} onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, photoURL: e.target.value } })} />
                 </div>
                 <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                   <Save size={18}/> CẬP NHẬT DỮ LIỆU
                 </button>
              </form>
           </motion.div>
        </div>
      )}

      {}
      <AnimatePresence>
        {adjustmentModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="admin-modal-overlay"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="admin-modal-card" 
               style={{ maxWidth: '700px', width: '90%' }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <h2 style={{ margin: 0 }}>CĂN CHỈNH VÙNG HIỂN THỊ</h2>
                   <button className="modal-close" onClick={() => setAdjustmentModal({ ...adjustmentModal, isOpen: false })}><X size={20} /></button>
                </div>

                <div className="adjuster-viewport-wrapper" style={{ 
                  width: '100%', 
                  aspectRatio: adjustmentModal.aspect, 
                  background: '#0a0a0a', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  position: 'relative',
                  border: '2px solid var(--accent-main)',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)'
                }}>
                   <motion.img 
                     src={adjustmentModal.src}
                     drag
                     dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }} 
                     onDragEnd={(e, info) => setDragPos(prev => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }))}
                     style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%',
                        x: '-50%',
                        y: '-50%',
                        cursor: 'move',
                        scale: zoom,
                        maxHeight: '100%'
                     }} 
                   />
                   
                   {}
                   <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                   </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                      <span>MỨC PHÓNG ĐẠI: {Math.round(zoom * 100)}%</span>
                      <span>KÉO ẢNH ĐỂ CĂN GIỮA KHUÔN MẶT</span>
                   </div>
                   <input 
                     type="range" 
                     min="1" max="3" step="0.01" 
                     value={zoom} 
                     onChange={(e) => setZoom(parseFloat(e.target.value))}
                     style={{ width: '100%', height: '6px', appearance: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', cursor: 'pointer' }}
                   />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                   <button className="add-btn" style={{ flex: 1, padding: '1rem' }} onClick={getCroppedImage}>
                      <CheckCircle size={18} /> HOÀN TẤT CĂN CHỈNH
                   </button>
                   <button className="modal-close" style={{ position: 'relative', top: 0, right: 0, padding: '1rem', background: 'rgba(255,255,255,0.05)' }} onClick={() => setAdjustmentModal({ ...adjustmentModal, isOpen: false })}>
                      HỦY
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

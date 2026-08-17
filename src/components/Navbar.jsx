import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun, Globe, User, Zap, LogOut, Settings, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Navbar = () => {
  const { config } = useConfig();
  const { currentUser, isAdmin, logout } = useAuth();
  const logoUrl = config?.appearance?.logoUrl || '/logobct.png';
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const dropdownRef = useRef(null);

  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser) {
       setEditName(currentUser.displayName || '');
       setEditAvatar(currentUser.photoURL || '');
    }
  }, [currentUser]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  const getAvatarFallback = () => {
     if (currentUser?.photoURL) return currentUser.photoURL;
     return `https://api.dicebear.com/7.x/shapes/svg?seed=${currentUser?.email || 'default'}`;
  };

  const handleSaveSettings = async (e) => {
     e.preventDefault();
     setIsSaving(true);
     try {
        await updateProfile(currentUser, {
           displayName: editName,
           photoURL: editAvatar || getAvatarFallback()
        });
        
        await updateDoc(doc(db, 'users', currentUser.uid), {
           displayName: editName,
           photoURL: editAvatar || getAvatarFallback(),
           updatedAt: new Date()
        });
        
        alert("Cập nhật thông tin thành công!");
        setShowSettingsModal(false);
     } catch (err) {
        alert("Lỗi khi cập nhật: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  const executeLogout = async () => {
     await logout();
     setShowLogoutConfirm(false);
     setDropdownOpen(false);
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-panel home-navbar"
        style={{
          position: 'fixed',
          top: '1rem',
          left: '0',
          right: '0',
          margin: '0 auto',
          width: '98%',
          maxWidth: '1450px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.8rem 1.5rem',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px var(--accent-glow)'
        }}
      >
        <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: '"Share Tech Mono", monospace', fontSize: '1.6rem', fontWeight: 400, minWidth: 0 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }} className="text-gradient">
            <div className="logo-glow-effect" style={{ display: 'flex', borderRadius: '50%', padding: '2px' }}>
              <img src={logoUrl} alt="Logo" style={{ height: '36px', width: 'auto', borderRadius: '50%', flexShrink: 0 }} />
            </div>
            <span style={{ whiteSpace: 'nowrap' }}>BCT0902</span>
          </Link>
        </div>

        <ul style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'center', gap: '1.5rem', listStyle: 'none', alignItems: 'center' }}>
            {['home', 'chronicles', 'showcase', 'blog', 'shortener', 'quiz'].map((link) => (
              <li key={link}>
                {(link === 'blog' || link === 'chronicles' || link === 'shortener' || link === 'quiz' || link === 'showcase' || link === 'home') ? (
                  <Link 
                    to={link === 'home' ? "/" : link === 'blog' ? "/blog" : link === 'shortener' ? "/shortener" : link === 'quiz' ? "/quiz-maker" : link === 'showcase' ? "/showcase" : "/chronicles"}
                    style={{ 
                      fontFamily: 'var(--font-tech)', 
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      opacity: 0.8,
                      textDecoration: 'none',
                      color: 'inherit',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.opacity = 1;
                      e.target.style.color = 'var(--accent-main)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.opacity = 0.8;
                      e.target.style.color = 'inherit';
                    }}
                  >
                    {link === 'quiz' ? 'QUIZ MAKER' : link === 'showcase' ? t('nav.utilities') : t(`nav.${link}`)}
                  </Link>
                ) : (
                  <a 
                    href={`/#${link}`} 
                    style={{ 
                      fontFamily: 'var(--font-tech)', 
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      opacity: 0.8,
                      textDecoration: 'none',
                      color: 'inherit',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.opacity = 1;
                      e.target.style.color = 'var(--accent-main)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.opacity = 0.8;
                      e.target.style.color = 'inherit';
                    }}
                  >
                    {t(`nav.${link}`)}
                  </a>
                )}
              </li>
            ))}

        </ul>

        <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end', gap: '1.2rem', alignItems: 'center', minWidth: 0 }}>
          <button 
            onClick={toggleTheme} 
            aria-label={theme === 'dark' ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
            title={theme === 'dark' ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
            style={{ 
              color: 'var(--text-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--bg-glass-border)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            {theme === 'dark' ? <Sun size={20} color="var(--accent-gold)" /> : <Moon size={20} color="var(--accent-main)" />}
          </button>

          <button 
            onClick={toggleLanguage} 
            aria-label="Chuyển đổi Ngôn ngữ Language"
            title="Chuyển đổi Ngôn ngữ Language"
            style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, height: '44px', padding: '0 0.5rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            <Globe size={20} />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{i18n.language.toUpperCase()}</span>
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--bg-glass-border)', flexShrink: 0 }} />

          {(currentUser || isAdmin) ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Menu Tài Khoản Cá Nhân"
                aria-expanded={dropdownOpen}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.3rem 0.8rem 0.3rem 0.3rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                 <img src={getAvatarFallback()} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#fff', border: '2px solid var(--accent-main)' }} />
                 <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isAdmin ? 'var(--accent-gold, #ffd700)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {isAdmin ? "BCT_ADMIN" : (currentUser?.displayName || currentUser?.email?.split('@')[0])}
                 </span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, background: 'rgba(15, 15, 20, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', minWidth: '180px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  >
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.logged_in_as')}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', wordBreak: 'break-all' }}>{currentUser?.email}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setDropdownOpen(false)} style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-main)', textDecoration: 'none', fontSize: '0.85rem', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                           <Zap size={16} /> TRANG QUẢN TRỊ ADMIN
                        </Link>
                      )}
                      {currentUser && (
                        <button onClick={() => { setShowSettingsModal(true); setDropdownOpen(false); }} style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                          <Settings size={16} /> Cài đặt hồ sơ
                        </button>
                      )}
                      <button onClick={() => { setShowLogoutConfirm(true); setDropdownOpen(false); }} style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', background: 'transparent', border: 'none', fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <LogOut size={16} /> Đăng xuất phiên
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: 'var(--accent-main)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 15px var(--accent-glow)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <User size={18} />
              <span>LOGIN</span>
            </Link>
          )}
        </div>
      </motion.nav>

      {}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
          >
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: '#111', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.4)', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
               <LogOut size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
               <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Xác Nhận Đăng Xuất</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Ngài có chắc chắn muốn ngắt kết nối khỏi hệ thống BCT0902 ngay bây giờ?</p>
               <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                 <button onClick={() => setShowLogoutConfirm(false)} style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>ĐÓNG</button>
                 <button onClick={executeLogout} style={{ padding: '0.8rem 1.5rem', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>ĐĂNG XUẤT</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#111', padding: '2.5rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '450px', width: '90%', position: 'relative' }}>
               <button onClick={() => setShowSettingsModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
               <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>CÀI ĐẶT HỒ SƠ</h3>
               
               <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <img src={editAvatar || getAvatarFallback()} alt="preview" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-main)', background: '#fff' }} />
                  </div>

                  <div>
                     <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ĐƯỜNG DẪN ẢNH ĐẠI DIỆN</label>
                     <input type="text" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="Nhập API URL hoặc link ảnh" style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>TÊN HIỂN THỊ (*)</label>
                     <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>EMAIL HỆ THỐNG</label>
                     <input type="text" value={currentUser?.email || ''} disabled style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', cursor: 'not-allowed' }} />
                     <small style={{ color: 'var(--accent-gold)', fontSize: '0.7rem', marginTop: '0.3rem', display: 'block' }}>* Email là định danh cố định. Muốn gắn tên miền mới vui lòng liên hệ Admin.</small>
                  </div>

                  <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '1rem', background: 'var(--accent-main)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '1rem', opacity: isSaving ? 0.7 : 1 }}>
                     <Save size={18} /> {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                  </button>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

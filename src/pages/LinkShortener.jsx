import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Copy, Check, RotateCcw, ExternalLink, Globe, Zap,
  ShieldCheck, Trash2, Edit3, Clock, Lock, Unlock, User, Info, X, Save,
  QrCode, Download, Menu, Home, Layout, ClipboardList, GraduationCap, Users, HelpCircle
} from 'lucide-react';
import { db } from '../firebase';
import {
  doc, setDoc, getDoc, collection, query, where, getDocs,
  deleteDoc, updateDoc, orderBy, onSnapshot
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MobileBottomNav from '../components/MobileBottomNav';
import './LinkShortener.css';

const LinkShortener = () => {
  const { t } = useTranslation();
  const { currentUser, isAdmin } = useAuth();
  const [longUrl, setLongUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // UI States
  const [showPopup, setShowPopup] = useState(false);
  const [userLinks, setUserLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [editingLink, setEditingLink] = useState(null);
  const [editForm, setEditForm] = useState({ longUrl: '', slug: '' });
  const [qrModalLink, setQrModalLink] = useState(null);
  const [activeTab, setActiveTab] = useState('shorten');

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('bct_shortener_popup');
    if (!hasSeenPopup) {
      setShowPopup(true);
      sessionStorage.setItem('bct_shortener_popup', 'true');
    }
  }, []);

  useEffect(() => {
    let unsubscribe;

    const fetchLinks = () => {
      setLoadingLinks(true);
      let q;
      if (isAdmin) {

        q = query(collection(db, 'short_links'));
      } else if (currentUser) {

        q = query(collection(db, 'short_links'), where('createdBy', '==', currentUser.uid));
      } else {

        setLoadingLinks(false);
        setUserLinks([]);
        return;
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        links.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setUserLinks(links);
        setLoadingLinks(false);
      }, (err) => {
        console.error("Fetch links error:", err);
        setLoadingLinks(false);
      });
    };

    fetchLinks();
    return () => unsubscribe && unsubscribe();
  }, [currentUser, isAdmin]);

  const generateRandomSlug = async () => {
    try {
      const q = query(collection(db, 'short_links'));
      const snapshot = await getDocs(q);
      const count = snapshot.size + 1;

      let xxx = count.toString().padStart(3, '0');
      if (count > 999) {
        xxx = count.toString(36).toUpperCase();
      }

      let slug = `vn${xxx}`;

      const checkDoc = await getDoc(doc(db, 'short_links', slug));
      if (checkDoc.exists()) {
        return `vn${Math.random().toString(36).substring(2, 6)}`;
      }
      return slug;
    } catch (err) {
      return `vn${Math.random().toString(36).substring(2, 6)}`;
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');
    setShortUrl('');

    if (!longUrl) {
      setError('Vui lòng nhập đường dẫn gốc cần rút gọn.');
      return;
    }

    if (!validateUrl(longUrl)) {
      setError('Định dạng URL không hợp lệ (Ví dụ: https://...)');
      return;
    }

    setLoading(true);
    try {
      let slug = customSlug.trim() || await generateRandomSlug();

      const docRef = doc(db, 'short_links', slug);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && customSlug) {
        setError('Mã định danh này đã tồn tại. Vui lòng chọn mã khác.');
        setLoading(false);
        return;
      }

      if (docSnap.exists()) {
        slug = await generateRandomSlug();
      }

      const isPermanent = currentUser || isAdmin;
      const expirationDate = isPermanent ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      let creatorName = 'Khách';
      let createdBy = 'guest';

      if (isAdmin && !currentUser) {
        creatorName = 'BCT_ADMIN';
        createdBy = 'admin';
      } else if (currentUser) {
        createdBy = currentUser.uid;
        if (currentUser.displayName) {
          creatorName = currentUser.displayName;
        } else {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().username) {
            creatorName = userDoc.data().username;
          } else if (currentUser.email) {
            creatorName = currentUser.email.split('@')[0];
          } else {
            creatorName = 'User';
          }
        }
      }

      const linkData = {
        longUrl,
        slug,
        createdBy: createdBy,
        creatorName: creatorName,
        createdAt: new Date(),
        expiresAt: expirationDate,
        clicks: 0
      };

      await setDoc(doc(db, 'short_links', slug), linkData);

      const domain = window.location.origin.replace('www.', '');
      setShortUrl(`${domain}/${slug}`);
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi tạo liên kết: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Có chắc chắn muốn xóa liên kết này vĩnh viễn?')) return;
    try {
      await deleteDoc(doc(db, 'short_links', slug));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const startEdit = (link) => {
    setEditingLink(link);
    setEditForm({ longUrl: link.longUrl, slug: link.slug });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateUrl(editForm.longUrl)) {
      alert("URL không hợp lệ!");
      return;
    }

    try {
      const docRef = doc(db, 'short_links', editingLink.slug);

      if (editForm.slug !== editingLink.slug) {
        const newRef = doc(db, 'short_links', editForm.slug);
        const checkSnap = await getDoc(newRef);
        if (checkSnap.exists()) {
          alert("Mã định danh mới đã tồn tại!");
          return;
        }

        await setDoc(newRef, {
          ...editingLink,
          longUrl: editForm.longUrl,
          slug: editForm.slug,
          updatedAt: new Date()
        });
        await deleteDoc(docRef);
      } else {
        await updateDoc(docRef, {
          longUrl: editForm.longUrl,
          updatedAt: new Date()
        });
      }

      setEditingLink(null);
      alert("Cập nhật thành công!");
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert('Đã sao chép liên kết!');
    } else {
      let textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        alert('Đã sao chép liên kết!');
      } catch (err) {
        alert('Trình duyệt không hỗ trợ sao chép tự động.');
      }
      textArea.remove();
    }
  };

  const downloadQRCode = (id, slug) => {
    const canvas = document.getElementById(id);
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `bct_qr_${slug || 'short'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="shortener-page-wrapper" style={{ fontFamily: 'var(--font-tech)' }}>
      { }
      <div className="iris-mobile-header">
        <div className="m-header-left" style={{ width: '40px' }}></div>
        <div className="m-logo" style={{ fontFamily: 'var(--font-tech)' }}>BCT0902</div>
        <div className="m-header-right">
          <div className="m-admin-pill">
            <img
              src={currentUser?.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${currentUser?.email || 'default'}`}
              alt="avatar"
            />
            <span style={{ fontFamily: 'var(--font-tech)' }}>BCT_ADMIN</span>
          </div>
        </div>
      </div>

      { }
      <div className="iris-mobile-tabs">
        <button
          className={`m-tab-btn ${activeTab === 'shorten' ? 'active' : ''}`}
          onClick={() => setActiveTab('shorten')}
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          <Zap size={18} /> {t('shortener.btn_shorten')}
        </button>
        <button
          className={`m-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          <ShieldCheck size={18} /> {t('shortener.manage_title')}
        </button>
      </div>

      <div className="background-decor"></div>

      <div className="shortener-layout container">
        { }
        <div className={`shortener-main-col ${activeTab !== 'shorten' ? 'm-hide' : ''}`}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="shortener-card glass-panel"
          >
            <div className="card-header">
              <h1 className="desktop-title" style={{ fontFamily: 'var(--font-tech)', fontWeight: 800 }}>{t('shortener.title')}</h1>
              <h1 className="mobile-title" style={{ fontFamily: 'var(--font-tech)', fontWeight: 800, fontSize: '1.4rem', textAlign: 'center', width: '100%' }}>BCT_LINK_SHORTENER</h1>

              <p className="subtitle desktop-subtitle">{t('shortener.subtitle')}</p>
              <p className="subtitle mobile-subtitle" style={{ fontSize: '0.7rem', opacity: 0.6 }}>HỆ THỐNG RÚT GỌN LIÊN KẾT THÔNG MINH - IRIS ECOSYSTEM</p>
            </div>

            <form onSubmit={handleShorten} className="shortener-form">
              <div className="input-section">
                <div className="input-group">
                  <label htmlFor="shortener-long-url-input" className="desktop-label">{t('shortener.long_url_label')}</label>
                  <label htmlFor="shortener-long-url-input" className="mobile-label"><Link2 size={18} color="var(--accent-main)" /> {t('shortener.long_url_label')}</label>

                  <input
                    id="shortener-long-url-input"
                    type="url"
                    placeholder={t('shortener.long_url_placeholder')}
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    required
                    className="main-input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="shortener-custom-slug-input" className="desktop-label">{t('shortener.custom_slug_label')}</label>
                  <label htmlFor="shortener-custom-slug-input" className="mobile-label"><Globe size={18} color="var(--accent-main)" /> {t('shortener.custom_slug_label')}</label>

                  <div className="slug-input-wrapper">
                    <span>bct0902.top/</span>
                    <input
                      id="shortener-custom-slug-input"
                      type="text"
                      placeholder={t('shortener.custom_slug_placeholder')}
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      className="slug-input"
                    />
                  </div>
                </div>
              </div>

              <div className="action-section">
                <div className="input-row">
                  <button type="submit" className="btn-primary shorten-btn" disabled={loading}>
                    {loading ? <Zap className="spinning" size={24} /> : <Zap size={24} />}
                    <span>{t('shortener.btn_shorten')}</span>
                  </button>
                </div>
                <small className="hint">{t('shortener.hint')}</small>
              </div>
            </form>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="error-message"
                >
                  <ShieldCheck size={16} /> {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        { }
        <div className={`shortener-side-col ${activeTab !== 'manage' ? 'm-hide' : ''}`}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="management-panel glass-panel"
          >
            <div className="panel-header">
              <h3 style={{ fontFamily: 'var(--font-tech)', fontWeight: 700 }}><ShieldCheck size={20} /> {t('shortener.manage_title')}</h3>
              {isAdmin && <span className="admin-badge" style={{ fontFamily: 'var(--font-tech)' }}>ADMIN_ACCESS</span>}
            </div>

            <div className="links-list-container custom-scrollbar">
              {!currentUser && !isAdmin ? (
                <div className="login-prompt-empty">
                  <User size={40} />
                  <p>{t('shortener.login_prompt')}</p>
                  <button onClick={() => window.location.href = '/login'} className="btn-secondary">{t('shortener.btn_login_now')}</button>
                </div>
              ) : loadingLinks ? (
                <div className="loading-links">{t('shortener.loading')}</div>
              ) : userLinks.length === 0 ? (
                <div className="no-links">{t('shortener.empty')}</div>
              ) : (
                <div className="links-list">
                  {userLinks.map(link => (
                    <motion.div layout key={link.id} className="link-item">
                      <div className="link-slug-row">
                        <span className="link-slug">/{link.slug}</span>
                        <span className="link-clicks">{link.clicks} clicks</span>
                      </div>

                      <div className="link-url-row" title={link.longUrl}>
                        {link.longUrl}
                      </div>

                      <div className="link-footer">
                        <div className="link-meta">
                          <div className="meta-row">
                            <span className="meta-label">{t('shortener.status')}</span>
                            <span className={`meta-value ${link.expiresAt ? 'status-expiry' : 'status-perm'}`}>
                              {link.expiresAt ? (
                                <>{t('shortener.status_expired')} {new Date(link.expiresAt.seconds * 1000).toLocaleDateString('vi-VN')}</>
                              ) : (
                                <><Unlock size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> {t('shortener.status_perm')}</>
                              )}
                            </span>
                          </div>
                          {(isAdmin || (currentUser && link.createdBy !== currentUser.uid)) && (
                            <div className="meta-row">
                              <span className="meta-label">{t('shortener.owner')}</span>
                              <span className="meta-value owner">@{link.creatorName}</span>
                            </div>
                          )}
                        </div>

                        <div className="link-actions">
                          <button onClick={() => startEdit(link)} className="action-icon edit" title="Sửa"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(link.slug)} className="action-icon delete" title="Xóa"><Trash2 size={16} /></button>
                          <button onClick={() => setQrModalLink(link)} className="action-icon qr" title="Xem QR"><QrCode size={16} /></button>
                          <button onClick={() => copyToClipboard(`${window.location.origin.replace('www.', '')}/${link.slug}`)} className="action-icon copy" title="Sao chép"><Copy size={16} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      { }
      <AnimatePresence>
        {shortUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShortUrl('')}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="edit-popup glass-panel shadow-glow shortener-result-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '600px' }}
            >
              <button className="close-popup" onClick={() => setShortUrl('')}><X size={20} /></button>
              <h3 style={{ fontFamily: 'var(--font-tech)', marginBottom: '1.5rem', color: 'var(--accent-main)', textAlign: 'center' }}>
                {t('shortener.result_title')}
              </h3>

              <div className="result-main" style={{ flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block' }}>
                  <QRCodeCanvas
                    id="qr-gen"
                    value={shortUrl}
                    size={2048}
                    style={{ width: '200px', height: '200px' }}
                    bgColor={"#FFFFFF"}
                    fgColor={"#000000"}
                    level={"H"}
                    includeMargin={true}
                    imageSettings={{
                      src: "/logobct.png",
                      height: 256,
                      width: 256,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="url-display-wrapper" style={{ width: '100%' }}>
                  <div className="qr-link-info">
                    <p style={{ color: 'var(--accent-main)', fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '1rem' }}>{shortUrl}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={() => copyToClipboard(shortUrl)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      <span>{copied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP LINK'}</span>
                    </button>
                    <button onClick={() => downloadQRCode('qr-gen', customSlug || 'short')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                      <Download size={18} /> TẢI QR
                    </button>
                    <a href={`//${shortUrl}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="info-popup glass-panel shadow-glow"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}
            >
              <button className="close-popup" onClick={() => setShowPopup(false)}><X size={20} /></button>
              <div className="popup-icon">
                <Info size={40} className="text-glow" />
              </div>
              <h2>THÔNG BÁO HỆ THỐNG</h2>
              <div className="popup-content">
                <p>Chào mừng ngài đến với trình rút gọn liên kết <strong>BCT IRIS</strong>.</p>
                <ul>
                  <li><strong>Tài khoản khách:</strong> Liên kết sẽ tự động hết hạn sau <strong>30 ngày</strong>.</li>
                  <li><strong>Tài khoản thành viên:</strong> Lưu trữ <strong>vĩnh viễn</strong> và có quyền quản lý, chỉnh sửa liên kết.</li>
                </ul>
                <p className="highlight">Hãy đăng nhập để có quyền kiểm soát tối đa!</p>
              </div>
              <div className="popup-actions">
                {!currentUser && <button onClick={() => window.location.href = '/login'} className="btn-primary">ĐĂNG NHẬP NGAY</button>}
                <button onClick={() => setShowPopup(false)} className="btn-secondary">TÔI ĐÃ HIỂU</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        { }
        {editingLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="modal-overlay"
            onClick={() => setEditingLink(null)}
          >
            <motion.div
              className="edit-popup glass-panel shadow-glow"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}
            >
              <h3 style={{ fontFamily: 'var(--font-tech)', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} /> CHỈNH SỬA LIÊN KẾT
              </h3>
              <form onSubmit={handleUpdate} className="edit-form">
                <div className="edit-input-group">
                  <label>ĐƯỜNG DẪN GỐC</label>
                  <input
                    type="text"
                    value={editForm.longUrl}
                    onChange={(e) => setEditForm({ ...editForm, longUrl: e.target.value })}
                  />
                </div>
                <div className="edit-input-group">
                  <label>MÃ ĐỊNH DANH (SLUG)</label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  />
                  <small>* Thay đổi slug sẽ làm link cũ không hoạt động.</small>
                </div>
                <div className="edit-actions">
                  <button type="button" onClick={() => setEditingLink(null)} className="btn-secondary">HỦY</button>
                  <button type="submit" className="btn-primary"><Save size={16} /> LƯU THAY ĐỔI</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        { }
        {qrModalLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="modal-overlay"
            onClick={() => setQrModalLink(null)}
          >
            <motion.div
              className="edit-popup glass-panel shadow-glow"
              style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-popup" onClick={() => setQrModalLink(null)}><X size={20} /></button>
              <h3 style={{ fontFamily: 'var(--font-tech)', marginBottom: '1.5rem', color: 'var(--accent-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <QrCode size={24} /> MÃ QR CHI TIẾT
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px' }}>
                  <QRCodeCanvas
                    id="qr-modal-gen"
                    value={`${window.location.origin.replace('www.', '')}/${qrModalLink.slug}`}
                    size={2048}
                    style={{ width: '250px', height: '250px' }}
                    bgColor={"#FFFFFF"}
                    fgColor={"#000000"}
                    level={"H"}
                    includeMargin={true}
                    imageSettings={{
                      src: "/logobct.png",
                      height: 256,
                      width: 256,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="qr-link-info">
                  <p style={{ color: 'var(--accent-main)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>/{qrModalLink.slug}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '100%', wordBreak: 'break-all', opacity: 0.8 }}>{qrModalLink.longUrl}</p>
                </div>

                <button
                  onClick={() => downloadQRCode('qr-modal-gen', qrModalLink.slug)}
                  className="btn-primary"
                  style={{ width: '100%', height: '50px', fontSize: '0.9rem' }}
                >
                  <Download size={18} style={{ marginRight: '0.5rem' }} /> TẢI QR CHẤT LƯỢNG CAO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <MobileBottomNav />

    </div>
  );
};

export default LinkShortener;

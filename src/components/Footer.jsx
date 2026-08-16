import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, CheckCircle, Globe } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { useConfig } from '../context/ConfigContext';

const Footer = ({ technicalFont }) => {
  const { config } = useConfig();
  const configSocials = config?.socials || {};
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); 

  const displaySocials = (config?.social_links && config.social_links.length > 0) 
    ? config.social_links.filter(s => s.isVisible !== false).map(s => ({
        name: s.name,
        brandColor: s.color || 'var(--accent-main)',
        icon: s.iconUrl ? <img src={s.iconUrl} alt={s.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} /> : (
           
           s.name.toLowerCase().includes('messenger') ? <MessageSquare size={20} /> : (
             s.name.toLowerCase().includes('facebook') ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> :
             s.name.toLowerCase().includes('github') ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22"></path></svg> :
             s.name.toLowerCase().includes('linkedin') ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg> :
             s.name.toLowerCase().includes('youtube') ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg> :
             <Globe size={20} />
           )
        ),
        url: s.url
      }))
    : [
    { 
      name: "Facebook",
      brandColor: "#1877F2",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>, 
      url: configSocials.facebook || "#" 
    },
    { 
      name: "Github",
      brandColor: "#2ea44f",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22"></path></svg>, 
      url: configSocials.github || "#" 
    },
    { 
      name: "LinkedIn",
      brandColor: "#0A66C2",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, 
      url: configSocials.linkedin || "#" 
    },
    { 
      name: "Youtube",
      brandColor: "#FF0000",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>, 
      url: configSocials.youtube || "#" 
    },
    { 
      name: "Messenger",
      brandColor: "#0084FF",
      icon: <MessageSquare size={20} />, 
      url: `https://m.me/${configSocials.messenger || 'bct0902'}` 
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      alert("Vui lòng nhập nội dung tin nhắn!");
      return;
    }

    setStatus('sending');
    let firestoreSuccess = false;
    let emailSuccess = false;

    const firestorePromise = (async () => {
      try {
        await addDoc(collection(db, 'contact_messages'), {
          ...formData,
          timestamp: serverTimestamp()
        });
        return true;
      } catch (err) {
        console.error("Firestore Error:", err);
        return false;
      }
    })();

    const emailPromise = (async () => {
      try {
        
        const serviceID = config?.integrations?.emailjsServiceId || import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateID = config?.integrations?.emailjsTemplateId || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = config?.integrations?.emailjsPublicKey || import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceID && templateID && publicKey) {
          console.log("Đang gửi Email qua EmailJS...");
          await emailjs.send(
            serviceID,
            templateID,
            {
              name: formData.name || 'Khách truy cập',
              email: formData.email,
              message: formData.message,
              title: 'Tin nhắn từ Website Portfolio',
            },
            publicKey
          );
          console.log("EmailJS: OK!");
          return true;
        } else {
          console.error("Thiếu cấu hình EmailJS (Service/Template/Key)!");
          return false;
        }
      } catch (err) {
        console.error("EmailJS Error details:", err);
        return false;
      }
    })();

    const [firestoreRes, emailRes] = await Promise.all([firestorePromise, emailPromise]);

    if (firestoreRes && emailRes) {
      console.log("Kết thúc: Đã gửi thành công DB và Email.");
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } else if (firestoreRes && !emailRes) {
      console.warn("Kết thúc: Lưu DB thành công nhưng LỖI gửi Email.");
      setStatus('error');
      alert("Yêu cầu đã được ghi nhận vào hệ thống, nhưng gặp lỗi khi gửi Email thông báo. Ngài vui lòng kiểm tra lại cấu hình API Keys trong trang Admin!");
      setFormData({ name: '', email: '', message: '' }); // Vẫn clear form vì DB đã lưu
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      console.error("Kết thúc: Thất bại hoàn toàn.");
      setStatus('error');
      alert("Lỗi nghiêm trọng: Không thể lưu yêu cầu. Vui lòng thử lại sau!");
    }
  };

  return (
    <footer id="contact" className={technicalFont ? 'chakra-font' : ''} style={{ 
      borderTop: '1px solid var(--bg-glass-border)',
      padding: '2rem 2rem 1.5rem',
      marginTop: '1rem',
      background: 'rgba(var(--bg-rgb), 0.3)'
    }}>
      <div className="container" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '4rem',
        alignItems: 'start'
      }}>
        
        {}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ fontSize: '3.2rem', fontFamily: 'var(--font-tech)', margin: 0, letterSpacing: '2px' }} className="text-gradient">
            BCT0902
          </h2>
          
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
            {t('footer.description')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {displaySocials.map((social, idx) => (
              <a 
                key={idx} 
                href={social.url} 
                target="_blank"
                rel="noreferrer"
                className="glass-panel" 
                style={{ padding: '0.8rem', display: 'flex', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = social.brandColor;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--bg-glass-border)';
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>

          <div>
            <a href="#projects" className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '0.8rem' }}>
              {t('hero.cta_projects')}
            </a>
          </div>
        </div>

        {}
        <div className="glass-panel footer-contact-card" style={{ padding: '2rem', borderRadius: '24px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-tech)', fontSize: '1.4rem', color: 'var(--accent-main)', textTransform: 'uppercase' }}>
            {t('footer.form_title')}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="footer-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <input 
                id="footer-contact-name"
                type="text" 
                aria-label={t('footer.placeholder_name')}
                placeholder={t('footer.placeholder_name')}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--bg-glass-border)', 
                  borderRadius: '10px', 
                  padding: '1rem', 
                  color: 'var(--text-primary)', 
                  outline: 'none',
                  fontFamily: 'var(--font-tech)',
                  transition: 'all 0.3s ease',
                  width: '100%'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-main)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--bg-glass-border)'}
              />
              <input 
                id="footer-contact-email"
                type="email" 
                aria-label={t('footer.placeholder_email')}
                placeholder={t('footer.placeholder_email')}
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--bg-glass-border)', 
                  borderRadius: '10px', 
                  padding: '1rem', 
                  color: 'var(--text-primary)', 
                  outline: 'none',
                  fontFamily: 'var(--font-tech)',
                  transition: 'all 0.3s ease',
                  width: '100%'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-main)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--bg-glass-border)'}
              />
            </div>
            <textarea 
              id="footer-contact-message"
              aria-label={t('footer.placeholder_message')}
              placeholder={t('footer.placeholder_message')}
              rows="4"
              required
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--bg-glass-border)', 
                borderRadius: '10px', 
                padding: '1rem', 
                color: 'var(--text-primary)', 
                outline: 'none', 
                resize: 'none',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-main)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--bg-glass-border)'}
            ></textarea>
            
            <button 
              type="submit" 
              disabled={status === 'sending'}
              className="btn-primary" 
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.8rem',
                opacity: status === 'sending' ? 0.7 : 1
              }}
            >
              {status === 'success' ? <><CheckCircle size={18} /> {t('footer.success')}</> : <><Send size={18} /> {t('footer.submit')}</>}
            </button>
            {status === 'error' && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center' }}>{t('common.error')}</p>}
          </form>
        </div>

      </div>

      <div style={{ 
        marginTop: '4rem', 
        paddingTop: '2rem', 
        borderTop: '1px solid var(--bg-glass-border)',
        textAlign: 'center'
      }}>
        <p className="footer-scroll-up" style={{ 
          color: 'var(--text-secondary)', 
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          maxWidth: '100%',
          margin: '0 auto',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {t('footer.scroll_up')}
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
           <span className="footer-copyright-text" style={{ fontSize: '0.75rem', opacity: 0.6, color: 'var(--text-muted)' }}>
             &copy; {new Date().getFullYear()} BCT0902. {t('footer.rights')}
           </span>
           <span style={{ fontSize: '0.65rem', opacity: 0.4, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
             {t('footer.security_notice')} • {t('footer.session_active')}
           </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ShortLinkRedirect = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); 

  useEffect(() => {
    const findAndRedirect = async () => {
      try {
        const docRef = doc(db, 'short_links', slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          if (data.expiresAt) {
            const expiry = new Date(data.expiresAt.seconds * 1000);
            if (expiry < new Date()) {
              setStatus('expired');
              return;
            }
          }

          await updateDoc(docRef, {
            clicks: increment(1)
          });

          window.location.href = data.longUrl;
        } else {
          setStatus('not_found');
        }
      } catch (err) {
        console.error("Redirection error:", err);
        setStatus('error');
      }
    };

    if (slug) {
      findAndRedirect();
    }
  }, [slug]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ marginBottom: '1.5rem' }}
        >
          <Loader2 size={48} color="var(--accent-main)" />
        </motion.div>
        <h2 style={{ fontFamily: 'var(--font-heading)', letterSpacing: '2px' }}>REDIRECTING...</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Please wait a moment.</p>
      </div>
    );
  }

  if (status === 'not_found' || status === 'error' || status === 'expired') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '1rem' }}>
          {status === 'expired' ? 'LIÊN KẾT ĐÃ HẾT HẠN' : 'LIÊN KẾT KHÔNG TỒN TẠI'}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          {status === 'expired' 
            ? "This short link has expired after 30 days."
            : status === 'not_found' 
              ? t('redirect.not_found') 
              : t('redirect.error')}
        </p>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '1rem 2rem', 
            background: 'var(--accent-main)', 
            color: '#000', 
            borderRadius: '8px', 
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} /> QUAY LẠI TRANG CHỦ
        </button>
      </div>
    );
  }

  return null;
};

export default ShortLinkRedirect;

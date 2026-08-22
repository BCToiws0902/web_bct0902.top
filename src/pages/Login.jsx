import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowLeft, KeyRound, Smartphone, User, UserCircle, Eye, EyeOff } from 'lucide-react';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider, githubProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as OTPAuth from 'otpauth';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginAsAdminLocal } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdblockModal, setShowAdblockModal] = useState(false);
  
  // Custom Autofill CSS override injected locally to prevent white background
  const autofillFix = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active{
        -webkit-box-shadow: 0 0 0 30px #1e1e24 inset !important;
        -webkit-text-fill-color: white !important;
        transition: background-color 5000s ease-in-out 0s;
    }
  `;
  
  // Auth Modes
  const [authMode, setAuthMode] = useState('login'); 
  const [step, setStep] = useState('auth'); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 2FA State
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const toggleAuthMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setUsername('');
  };

  const validateEmail = (emailStr) => {
    return String(emailStr).toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const recoverPassword = async () => {
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address to reset password.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError('');
      alert('Password reset link sent! Please check your email inbox.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('This email is not registered in the system.');
      } else {
        setError('Unable to send request: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    const errorStr = err.toString().toLowerCase();
    console.error("Auth Error Object:", err);
    
    if (errorStr.includes('blocked')) {
      setShowAdblockModal(true);
    } else if (err.message === 'TIMEOUT_FIRESTORE') {
      setError("Database connection timeout (5s).");
    } else if (err?.code === 'unavailable') {
      setError("System is currently offline.");
      setShowAdblockModal(true);
    } else if (err?.code === 'auth/unauthorized-domain') {
      setError("This domain is unauthorized.");
    } else {
      setError('Connection error: ' + (err.message || err.toString()));
    }
  };

  const executeAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login' && email !== 'admin') {
      if (!validateEmail(email)) {
        setError('Invalid email format.');
        return;
      }
    } else if (authMode === 'register') {
      if (!validateEmail(email)) {
        setError('Invalid email format.');
        return;
      }
    }

    setLoading(true);

    if (authMode === 'login') {
      if (email === 'admin' && password === 'Buicongtoi0902') {
        try {
          const adminDoc = await Promise.race([
            getDoc(doc(db, 'system', 'admin_config')),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_FIRESTORE')), 5000))
          ]);

          if (adminDoc.exists() && adminDoc.data().totpSecret) {
            setTotpSecret(adminDoc.data().totpSecret);
            setStep('2fa_verify');
          } else {
            const secret = new OTPAuth.Secret({ size: 20 });
            const secretBase32 = secret.base32;
            const totp = new OTPAuth.TOTP({
              issuer: 'BCT0902_SYSTEM',
              label: 'admin',
              algorithm: 'SHA1',
              digits: 6,
              period: 30,
              secret: secretBase32,
            });
            setTotpSecret(secretBase32);
            setQrCodeUrl(totp.toString());
            setStep('2fa_setup');
          }
        } catch (err) {
          handleError(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
           setError('Incorrect email/username or password.');
        } else {
           handleError(err);
        }
      } finally {
        setLoading(false);
      }

    } else if (authMode === 'register') {
      if (!firstName || !lastName || !username) {
         setError('Please fill in all personal information.');
         setLoading(false);
         return;
      }
      if (password !== confirmPassword) {
         setError('Passwords do not match.');
         setLoading(false);
         return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await setDoc(doc(db, 'users', user.uid), {
          firstName,
          lastName,
          username,
          email,
          role: 'user',
          createdAt: new Date()
        });
        
        setError('');
        alert('Account created successfully! Welcome to BCT Studio.');
        navigate('/');
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
           setError('This email already exists (you may have signed in with Google previously). Forgot password?');
        } else if (err.code === 'auth/weak-password') {
           setError('Weak password. Please use at least 6 characters.');
        } else {
           handleError(err);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const verify2FA = async () => {
    setError('');
    if (otpCode.length !== 6) return;

    try {
      const secretObj = typeof totpSecret === 'string' 
        ? OTPAuth.Secret.fromBase32(totpSecret) 
        : totpSecret;

      const totp = new OTPAuth.TOTP({
        issuer: 'BCT0902_SYSTEM',
        label: 'admin',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secretObj,
      });

      let delta = totp.validate({ token: otpCode, window: 4 });

      if (delta === null && typeof totpSecret === 'string') {
        const fallbackTotp = new OTPAuth.TOTP({
          issuer: 'BCT0902_SYSTEM',
          label: 'admin',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: totpSecret,
        });
        delta = fallbackTotp.validate({ token: otpCode, window: 4 });
      }

      if (delta !== null) {
        if (step === '2fa_setup') {
          await setDoc(doc(db, 'system', 'admin_config'), {
            totpSecret: totpSecret,
            updatedAt: new Date()
          });
        }
        loginAsAdminLocal();
        navigate('/admin');
      } else {
        setError('Invalid 2FA verification code. Please check again.');
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      console.error(err);
      handleError(err);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(circle at center, #111 0%, #050505 100%)'
    }}>
      <style dangerouslySetInnerHTML={{ __html: autofillFix }} />
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'var(--accent-glow)', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px', background: 'var(--accent-secondary)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '450px', padding: '3rem 2.5rem', position: 'relative', background: 'rgba(10, 10, 12, 0.82)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      >
        <AnimatePresence mode="wait">
          {step === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <Link to="/" style={{ display: 'inline-block', marginBottom: '0.5rem', textDecoration: 'none' }}>
                  <h1 style={{ fontSize: '2rem', fontFamily: '"Share Tech Mono", monospace' }} className="text-gradient">
                    BCT0902 
                  </h1>
                </Link>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                   <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                     {authMode === 'login' ? 'PLEASE SIGN IN TO CONTINUE' : 'ENTER DETAILS TO CREATE YOUR ACCOUNT'}
                   </p>
                </div>
              </div>

              {error && <div className="error-box" style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <span>{error}</span>
                 {error.includes('already exists') && (
                    <button type="button" onClick={recoverPassword} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>FORGOT PASSWORD?</button>
                 )}
              </div>}

              <form onSubmit={executeAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {authMode === 'register' && (
                  <>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                      </div>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <UserCircle size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                    </div>
                  </>
                )}

                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder={authMode === 'login' ? "Email / ADMIN_NETWORK_ID" : "Valid Email Address"} value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type={showPassword ? "text" : "password"} placeholder={t('login.password_placeholder', 'Password')} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '1rem 3rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {authMode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showPassword ? "text" : "password"} placeholder={t('login.confirm_password', 'Confirm Password')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '1rem 3rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                  </div>
                )}
                
                {authMode === 'login' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="circular-checkbox" style={{ position: 'relative', width: '18px', height: '18px' }}>
                        <input type="checkbox" id="remember" style={{ opacity: 0, position: 'absolute', cursor: 'pointer', width: '100%', height: '100%', zIndex: 2 }} />
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--accent-main)', background: 'transparent', transition: 'all 0.3s' }}></div>
                      </div>
                      <label htmlFor="remember" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>{t('login.remember_me', 'Remember Me')}</label>
                    </div>
                    <button type="button" onClick={recoverPassword} style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>{t('login.forgot_password', 'Forgot Password?')}</button>
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', opacity: loading ? 0.7 : 1, marginTop: '0.5rem', fontFamily: "var(--font-heading), 'Chakra Petch', sans-serif", letterSpacing: '1px' }} disabled={loading}>
                  {loading ? t('login.loading', 'Loading...') : (authMode === 'login' ? t('login.btn_login', 'LOGIN') : t('login.btn_register', 'REGISTER'))}
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  {authMode === 'login' ? (
                    <button type="button" onClick={() => toggleAuthMode('register')} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--accent-secondary)', color: 'var(--accent-secondary)', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s', fontFamily: "var(--font-heading), 'Chakra Petch', sans-serif" }} onMouseOver={(e) => { e.target.style.background = 'var(--accent-secondary)'; e.target.style.color = '#000'; }} onMouseOut={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.05)'; e.target.style.color = 'var(--accent-secondary)'; }}>
                      {t('login.go_to_register', 'CREATE NEW ACCOUNT')}
                    </button>
                  ) : (
                    <button type="button" onClick={() => toggleAuthMode('login')} style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}>
                      {t('login.back_to_login', 'Back to Sign In')}
                    </button>
                  )}
                </div>
              </form>

              {authMode === 'login' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>OR SOCIAL LOGIN</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => handleSocialLogin(googleProvider)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: '#fff', color: '#000', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Google</button>
                    <button onClick={() => handleSocialLogin(githubProvider)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>GitHub</button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {(step === '2fa_setup' || step === '2fa_verify') && (
            <motion.div key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ textAlign: 'center' }}>
              <button onClick={() => setStep('auth')} style={{ position: 'absolute', left: 0, top: '-2rem', background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> BACK
              </button>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(var(--accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid var(--accent-main)' }}>
                  <Smartphone className="text-glow" size={30} color="var(--accent-main)" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-mono)', letterSpacing: '2px', fontSize: '1.2rem', color: '#fff' }}>
                  TWO-FACTOR AUTHENTICATION
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {step === '2fa_setup' ? 'Scan the QR code with Google Authenticator app' : 'Enter 6-digit verification code from your device'}
                </p>
              </div>

              {step === '2fa_setup' && (
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                  <QRCodeCanvas value={qrCodeUrl} size={150} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" maxLength="6" placeholder="000000" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(var(--accent-rgb), 0.3)', borderRadius: '8px', color: 'var(--accent-main)', fontFamily: 'var(--font-mono)', fontSize: '1.4rem', letterSpacing: '8px', textAlign: 'center', outline: 'none' }} />
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</p>}

                <button onClick={verify2FA} className="btn-primary" style={{ width: '100%', padding: '1rem', fontFamily: "var(--font-heading), 'Chakra Petch', sans-serif", letterSpacing: '1px' }} disabled={otpCode.length !== 6}>
                  VERIFY & CONTINUE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: '2rem', padding: '0.8rem', border: '1px dashed rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)', fontSize: '0.7rem', color: 'var(--success)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          SHELL_STATUS: [MODE: {authMode.toUpperCase()}]
        </div>
      </motion.div>

      {showAdblockModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ background: 'var(--bg-secondary)', width: '90%', maxWidth: '550px', padding: '3.5rem 3rem 3rem', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', textAlign: 'center', position: 'relative' }}
          >
             <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-secondary)', padding: '0 1.5rem', color: 'var(--accent-gold)' }}>
               <ShieldCheck size={36} />
             </div>
             
             <h2 style={{ fontFamily: "var(--font-heading), 'Chakra Petch', sans-serif", color: 'var(--accent-gold)', fontSize: '2.2rem', marginBottom: '1.5rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
               CONNECTION BLOCKED
             </h2>
             
             <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '2.5rem', fontFamily: 'system-ui, sans-serif' }}>
               An adblocker or shield is preventing network connection to the database.<br/><br/>
               Please disable adblocking for this domain or reload the page.
             </p>

             <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
               <button 
                 onClick={() => { setShowAdblockModal(false); window.location.reload(); }} 
                 style={{ background: 'var(--accent-gold)', padding: '1rem 2rem', border: '1px solid var(--accent-gold)', color: '#000', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 'bold' }}
               >
                 RELOAD PAGE
               </button>
             </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Login;

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Settings, Layout, Image as ImageIcon, Check, Save, X, Trophy, Download, Play, Pause, CircleStop, Trash2, QrCode, Copy, User, Search, RotateCcw } from 'lucide-react';
import mammoth from 'mammoth';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import MobileBottomNav from '../components/MobileBottomNav';
import './QuizMaker.css';

const QuizMaker = () => {
  const { currentUser, isAdmin } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0); 
  const [fileName, setFileName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [answerFormat, setAnswerFormat] = useState('bold'); 
  const [filterMode, setFilterMode] = useState('all'); 
  const [editingQuestion, setEditingQuestion] = useState(null); 
  const [userQuizzes, setUserQuizzes] = useState([]);
  const [quizId, setQuizId] = useState(null); 
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);

  const [config, setConfig] = useState({
    title: 'Bài thi trắc nghiệm',
    description: '',
    bannerUrl: '',
    backgroundUrl: '',
    timeLimit: 45,
    questionsCount: 40,
    isScored: true,
    hasLeaderboard: true,
    allowRetry: true, // New: Allow retake
    retryLimit: 1,    // New: Number of retakes
    expiryDate: '' // New: Deadline
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentLeaderboard, setCurrentLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [activeQuizTitle, setActiveQuizTitle] = useState('');
  const [activeQuizSlug, setActiveQuizSlug] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [quizToShare, setQuizToShare] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showAdminReview, setShowAdminReview] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const fetchUserQuizzes = React.useCallback(async () => {
    setIsLoadingQuizzes(true);
    try {
      const quizzesRef = collection(db, 'quizzes');
      let q;
      if (isAdmin) {
        q = query(quizzesRef);
      } else {
        q = query(quizzesRef, where('creatorId', '==', currentUser?.uid));
      }
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setUserQuizzes(fetched);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      setError("Không thể tải danh sách bài thi.");
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [currentUser, isAdmin]);

  // --- Dashboard Logic ---
  useEffect(() => {
    if (currentUser || isAdmin) {
      fetchUserQuizzes();
    }
  }, [currentUser, isAdmin, fetchUserQuizzes]);

  const handleViewLeaderboard = async (slug, title) => {
    setLeaderboardLoading(true);
    setShowLeaderboard(true);
    setActiveQuizTitle(title);
    setActiveQuizSlug(slug);
    try {
      const resultsRef = collection(db, 'quiz_results');
      const q = query(resultsRef, where('quizSlug', '==', slug));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      results.sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent);
      setCurrentLeaderboard(results);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Không thể tải bảng xếp hạng!");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const quizRef = doc(db, 'quizzes', id);
      await updateDoc(quizRef, { status: newStatus });
      fetchUserQuizzes(); 
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Không thể cập nhật trạng thái bài thi!");
    }
  };

  const handleClearResults = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu xếp hạng của bài thi này? Thao tác này không thể hoàn tác!")) return;
    
    setLeaderboardLoading(true);
    try {
      const resultsRef = collection(db, 'quiz_results');
      const q = query(resultsRef, where('quizSlug', '==', activeQuizSlug));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'quiz_results', d.id)));
      await Promise.all(deletePromises);
      
      setCurrentLeaderboard([]);
      alert("Đã xóa toàn bộ dữ liệu xếp hạng.");
    } catch (err) {
      console.error("Error clearing results:", err);
      setError("Lỗi khi xóa dữ liệu!");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D')
              .replace(/[^a-zA-Z0-9\s,._-]/g, ''); // Keep safe chars
  };

  const exportToExcel = () => {
    if (currentLeaderboard.length === 0) return;

    let csv = '\uFEFF';
    csv += 'sep=,\n';
    
    const customFields = generatedQuiz?.config?.participantFields || [{ label: 'Thi sinh', key: 'userName' }];
    
    const headers = ['Hang', ...customFields.map(f => removeAccents(f.label)), 'Diem', 'So cau dung', 'Tong cau', 'Thoi gian (giay)', 'Ngay nop'];
    csv += headers.join(',') + '\n';
    
    currentLeaderboard.forEach((res, idx) => {
      const fieldValues = customFields.map(f => {
        const val = res.participantData ? res.participantData[f.key] : (f.key === 'userName' ? res.userName : '');
        return `"${removeAccents(String(val))}"`;
      });
      const row = [idx + 1, ...fieldValues, res.score, res.correctCount, res.totalCount, res.timeSpent, `"${res.submittedAt?.toDate().toLocaleString('vi-VN')}"` ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Leaderboard_${activeQuizSlug}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditQuiz = (quiz) => {
    setQuizId(quiz.id);
    setQuestions(quiz.questions);
    setConfig(quiz.config);
    setStep(3); // Go straight to config
    setError('');
  };

  const handleDeleteQuizRecord = async (id) => {
    if (window.confirm('Ngài có chắc muốn xóa vĩnh viễn bài thi này?')) {
      try {
        await deleteDoc(doc(db, 'quizzes', id));
        setUserQuizzes(userQuizzes.filter(q => q.id !== id));
      } catch (err) {
        console.error("Error deleting quiz:", err);
        alert("Lỗi khi xóa bài thi.");
      }
    }
  };

  const handleCloneQuiz = async (recipient) => {
    if (!quizToShare) return;
    
    setIsSaving(true);
    try {
      const newSlug = generateSlug();
      const cloneData = {
        ...quizToShare,
        slug: newSlug,
        creatorId: recipient.uid,
        creatorName: recipient.displayName || recipient.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };
      delete cloneData.id;
      
      await addDoc(collection(db, 'quizzes'), cloneData);
      alert(`Đã chia sẻ bài thi cho ${recipient.displayName || recipient.email} thành công!`);
      setShowShareModal(false);
      fetchUserQuizzes();
    } catch (err) {
      console.error("Error cloning quiz:", err);
      alert("Lỗi khi sao chép bài thi.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const list = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setAllUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    if (showShareModal) {
      fetchUsers();
    }
  }, [showShareModal]);

  const handleResetAttempt = async (quizSlug, userName, _participantData) => {
      if (!window.confirm(`Reset lượt thi cho thí sinh ${userName}?`)) return;
      
      try {
          // Find the attempt record
          const attemptsRef = collection(db, 'quiz_attempts');
          // Logic for finding specific participant (by name or custom ID if exists)
          const q = query(attemptsRef, where('quizSlug', '==', quizSlug), where('userName', '==', userName));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
              alert("Không tìm thấy dữ liệu lượt thi của thí sinh này.");
              return;
          }

          const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'quiz_attempts', d.id)));
          await Promise.all(deletePromises);
          alert("Đã reset lượt thi thành công!");
      } catch (err) {
          console.error("Reset error:", err);
          alert("Lỗi khi reset lượt thi.");
      }
  };

  const startNewQuiz = () => {
    setQuizId(null);
    setQuestions([]);
    setConfig({
      title: 'Bài thi trắc nghiệm',
      description: '',
      bannerUrl: '',
      backgroundUrl: '',
      timeLimit: 45,
      questionsCount: 40,
      isScored: true,
      hasLeaderboard: true,
      allowRetry: true,
      retryLimit: 1,
      expiryDate: '',
      participantFields: [{ label: 'Họ và Tên', key: 'userName', required: true }]
    });
    setStep(1);
    setError('');
  };

  // --- Parsing Logic ---
  const parseHtmlDocx = (htmlString, format) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    // mammoth mostly outputs <p> but sometimes lists <li>
    const elements = Array.from(doc.body.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6'));
    
    const parsedQuestions = [];
    let currentQuestion = null;

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const text = el.textContent.trim();
        if (!text) continue;
        
        // 1. Match start of question (e.g. "Câu 1:", "Question 1:", "1.")
        if (/^(Câu\s*\d+|Question\s*\d+|\d+)\s*[:.]/i.test(text)) {
            if (currentQuestion && currentQuestion.text) {
                parsedQuestions.push(currentQuestion);
            }
            currentQuestion = {
                id: parsedQuestions.length + 1,
                text: text.replace(/^(Câu\s*\d+|Question\s*\d+|\d+)\s*[:.]\s*/i, ''),
                options: [],
                correctAnswer: ''
            };
        } 
        // 2. Match options (A. B. C. D.)
        else if (/^[A-Z]\s*[.)]\s*/i.test(text)) {
            if (currentQuestion) {
                const optText = text.replace(/^[A-Z]\s*[.)]\s*/i, '');
                const optLetter = text.match(/^[A-Z]/i)[0].toUpperCase();
                currentQuestion.options.push({ letter: optLetter, text: optText });
                
                // Check format logic
                if (format === 'bold' && (el.querySelector('strong') || el.querySelector('b'))) {
                    currentQuestion.correctAnswer = optLetter;
                } else if (format === 'italic' && (el.querySelector('em') || el.querySelector('i'))) {
                    currentQuestion.correctAnswer = optLetter;
                }
            }
        } 
        // 3. Match answer (ANSWER: X) - Specifically for Aiken format
        else if (format === 'aiken' && /^(ANSWER|ĐÁP ÁN|DAPAN|ĐÁP ÁN ĐÚNG)\s*[:-]\s*[A-Z]/i.test(text)) {
            if (currentQuestion) {
                const ansMatch = text.match(/[A-Z]$/i);
                if (ansMatch) {
                    currentQuestion.correctAnswer = ansMatch[0].toUpperCase();
                    parsedQuestions.push(currentQuestion);
                    currentQuestion = null;
                }
            }
        } 
        // 4. Multi-line question text or skipped line
        else {
            if (currentQuestion && currentQuestion.options.length === 0) {
                // Still reading question text
                currentQuestion.text += '\n' + text;
            }
        }
    }
    
    // Push the last question
    if (currentQuestion && currentQuestion.text && !parsedQuestions.includes(currentQuestion)) {
        parsedQuestions.push(currentQuestion);
    }
    
    return parsedQuestions;
  };

  const handleManualStart = () => {
    setQuestions([]);
    setConfig(prev => ({ ...prev, questionsCount: 0 }));
    setStep(2);
    setError('');
  };

  const handleAddQuestionManual = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQ = {
      id: newId,
      text: 'Nội dung câu hỏi mới...',
      options: [
        { letter: 'A', text: 'Lựa chọn 1' },
        { letter: 'B', text: 'Lựa chọn 2' }
      ],
      correctAnswer: 'A'
    };
    setQuestions([...questions, newQ]);
    setEditingQuestion(newQ);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError('Vui lòng chỉ tải lên file Word (.docx)');
      return;
    }

    setError('');
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Use convertToHtml to preserve <strong> and <b> tags for bold answers
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const htmlText = result.value;
      
      const parsed = parseHtmlDocx(htmlText, answerFormat);
      if (parsed.length === 0) {
        setError('Không tìm thấy câu hỏi nào hợp lệ. Vui lòng kiểm tra lại định dạng file Word.');
        setStep(1);
      } else {
        setQuestions(parsed);
        setConfig(prev => ({ ...prev, questionsCount: parsed.length }));
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi đọc file Word. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateSlug = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateQuiz = async () => {
    if (!currentUser && !isAdmin) {
      setError('Vui lòng đăng nhập để lưu bài thi.');
      return;
    }

    // Check invalid questions
    const invalidCount = questions.filter(q => !q.correctAnswer || q.options.length < 2).length;
    if (invalidCount > 0) {
      setError(`Vẫn còn ${invalidCount} câu bị lỗi. Bạn cần sửa hoặc xóa chúng trước khi tạo bài thi.`);
      return;
    }

    // Validate Config
    if (config.questionsCount > questions.length) {
       setError(`Số lượng câu hỏi hiển thị (${config.questionsCount}) không được lớn hơn tổng số câu hỏi trong ngân hàng (${questions.length}).`);
       return;
    }

    setIsSaving(true);
    setError('');

    try {
      const slug = quizId ? userQuizzes.find(q => q.id === quizId).slug : generateSlug();
      const quizData = {
        slug: slug,
        creatorId: isAdmin ? 'admin' : currentUser.uid,
        creatorName: isAdmin ? 'BCT_ADMIN' : (currentUser.displayName || currentUser.email),
        config: config,
        questions: questions,
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      if (quizId) {
        await updateDoc(doc(db, 'quizzes', quizId), quizData);
        setGeneratedQuiz({ id: quizId, ...quizData });
      } else {
        quizData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'quizzes'), quizData);
        setGeneratedQuiz({ id: docRef.id, ...quizData });
      }
      
      setShowSuccessModal(true);
      fetchUserQuizzes();
      
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi lưu bài thi. Vui lòng thử lại sau.');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.querySelector(".qr-wrapper svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${generatedQuiz.slug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDeleteQuestion = (id) => {
    if(window.confirm('Ngài có chắc muốn xóa câu hỏi này khỏi danh sách?')) {
        const newQs = questions.filter(q => q.id !== id);
        setQuestions(newQs);
        setConfig(prev => ({ ...prev, questionsCount: Math.min(prev.questionsCount, newQs.length) }));
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updatedQs = questions.map(q => q.id === editingQuestion.id ? editingQuestion : q);
    setQuestions(updatedQs);
    setEditingQuestion(null);
  };

  return (
    <div className="quiz-maker-wrapper" style={{ fontFamily: 'var(--font-tech)' }}>
      <div className="container">
        
        <div className="maker-header">
          <h1 className="text-gradient" style={{ fontFamily: 'var(--font-tech)', fontWeight: 800 }}>BCT QUIZ ENGINE</h1>
          <p className="subtitle">Hệ thống tạo bài thi trắc nghiệm tự động bằng AI</p>
          
          <div className="step-indicator">
            <div className={`step ${step === 0 ? 'active' : ''}`} onClick={() => setStep(0)} style={{ cursor: 'pointer' }}>
              <div className="step-num">0</div>
              <span>Quản lý</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-num">1</div>
              <span>Upload Word</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-num">2</div>
              <span>Kiểm tra & Sửa</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-num">3</div>
              <span>Cấu hình & Tạo link</span>
            </div>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="maker-error">
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        {}
        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-section glass-panel shadow-glow">
            <div className="dashboard-header">
              <h2 style={{ fontFamily: 'var(--font-tech)', fontWeight: 700 }}><Layout size={24} className="text-gradient" /> DANH SÁCH BÀI THI</h2>
              <button onClick={startNewQuiz} className="btn-primary">+ TẠO BÀI THI MỚI</button>
            </div>

            {isLoadingQuizzes ? (
              <div className="loading-state">Đang tải danh sách...</div>
            ) : userQuizzes.length === 0 ? (
              <div className="empty-state">Chưa có bài thi nào. Bấm nút phía trên để bắt đầu!</div>
            ) : (
              <div className="quiz-table-wrapper">
                <table className="quiz-table">
                  <thead>
                    <tr>
                      <th>TIÊU ĐỀ</th>
                      <th>SLUG / LINK</th>
                      <th>NGÀY TẠO</th>
                      <th>TRẠNG THÁI</th>
                      <th>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userQuizzes.map(quiz => (
                      <tr key={quiz.id}>
                        <td>
                          <div className="quiz-title-cell">
                            <strong>{quiz.config.title}</strong>
                            <small>{quiz.questions.length} câu hỏi</small>
                          </div>
                        </td>
                        <td>
                          <div className="quiz-link-cell">
                            <code>{quiz.slug}</code>
                            <button className="copy-btn" onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/quiz/${quiz.slug}`);
                              alert("Đã copy link!");
                            }}><Check size={14}/></button>
                          </div>
                        </td>
                        <td>{quiz.createdAt?.seconds ? new Date(quiz.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : '---'}</td>
                        <td>
                          <span className={`status-badge ${new Date(quiz.config.expiryDate) < new Date() && quiz.config.expiryDate ? 'expired' : 'active'}`}>
                            {new Date(quiz.config.expiryDate) < new Date() && quiz.config.expiryDate ? 'Hết hạn' : 'Đang mở'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="status-controls">
                            {quiz.status === 'paused' || quiz.status === 'ended' || !quiz.status ? (
                              <button onClick={() => handleUpdateStatus(quiz.id, 'open')} className="btn-icon play" title="Bắt đầu/Tiếp tục"><Play size={16} /></button>
                            ) : (
                              <button onClick={() => handleUpdateStatus(quiz.id, 'paused')} className="btn-icon pause" title="Tạm dừng"><Pause size={16} /></button>
                            )}
                            {quiz.status !== 'ended' && (
                              <button onClick={() => handleUpdateStatus(quiz.id, 'ended')} className="btn-icon stop" title="Kết thúc (Công bố BXH)"><CircleStop size={16} /></button>
                            )}
                          </div>
                          <div className="divider"></div>
                          <button onClick={() => { setQuizToShare(quiz); setShowShareModal(true); }} className="btn-icon share" title="Chia sẻ cho người khác"><Copy size={16} /></button>
                          <button onClick={() => { setGeneratedQuiz(quiz); setShowSuccessModal(true); }} className="btn-icon qrcode" title="Mã QR"><QrCode size={16} /></button>
                          <button onClick={() => handleViewLeaderboard(quiz.slug, quiz.config.title)} className="btn-icon leaderboard" title="Bảng xếp hạng"><Trophy size={16} /></button>
                          <button onClick={() => handleEditQuiz(quiz)} className="btn-icon edit" title="Sửa"><Settings size={16} /></button>
                          <button onClick={() => handleDeleteQuizRecord(quiz.id)} className="btn-icon delete" title="Xóa"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="upload-section glass-panel shadow-glow">
            
            <div className="format-selector" style={{ marginBottom: '2rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
               <h3 style={{ marginBottom: '1rem', color: 'var(--accent-main)' }}>1. CHỌN ĐỊNH DẠNG ĐÁP ÁN ĐÚNG TRONG FILE WORD CỦA BẠN</h3>
               <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                 <label className="radio-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', background: answerFormat === 'bold' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0,0,0,0.3)', border: `1px solid ${answerFormat === 'bold' ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', cursor: 'pointer' }}>
                   <input type="radio" name="format" value="bold" checked={answerFormat === 'bold'} onChange={(e) => setAnswerFormat(e.target.value)} style={{ width: '18px', height: '18px' }} />
                   <div>
                     <strong style={{ display: 'block' }}>In Đậm (Bold)</strong>
                     <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VD: <strong>A. Đáp án đúng</strong></span>
                   </div>
                 </label>
                 
                 <label className="radio-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', background: answerFormat === 'italic' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0,0,0,0.3)', border: `1px solid ${answerFormat === 'italic' ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', cursor: 'pointer' }}>
                   <input type="radio" name="format" value="italic" checked={answerFormat === 'italic'} onChange={(e) => setAnswerFormat(e.target.value)} style={{ width: '18px', height: '18px' }} />
                   <div>
                     <strong style={{ display: 'block' }}>In Nghiêng (Italic)</strong>
                     <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VD: <em>B. Đáp án đúng</em></span>
                   </div>
                 </label>

                 <label className="radio-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', background: answerFormat === 'aiken' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0,0,0,0.3)', border: `1px solid ${answerFormat === 'aiken' ? 'var(--accent-main)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', cursor: 'pointer' }}>
                   <input type="radio" name="format" value="aiken" checked={answerFormat === 'aiken'} onChange={(e) => setAnswerFormat(e.target.value)} style={{ width: '18px', height: '18px' }} />
                   <div>
                     <strong style={{ display: 'block' }}>Từ khóa Aiken</strong>
                     <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VD: ANSWER: C (Ở cuối câu)</span>
                   </div>
                 </label>
               </div>
            </div>

            <div 
              className="upload-dropzone" 
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".docx" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
              {isProcessing ? (
                <div className="processing">
                  <div className="spinner"></div>
                  <p>Đang bóc tách dữ liệu AI...</p>
                </div>
              ) : (
                <>
                  <UploadCloud size={64} className="upload-icon text-gradient" />
                  <h2>2. BẤM HOẶC KÉO THẢ FILE <code>.docx</code> VÀO ĐÂY ĐỂ PHÂN TÍCH</h2>
                </>
              )}
            </div>

            <div className="manual-divider">
               <span>HOẶC</span>
            </div>

            <button onClick={handleManualStart} className="btn-manual-start">
               <FileText size={20} /> TẠO BÀI THI THỦ CÔNG (TỰ NHẬP CÂU HỎI)
            </button>
          </motion.div>
        )}

        {}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="preview-section glass-panel shadow-glow">
            <div className="preview-header">
              <div className="preview-stats">
                <h2><FileText size={24} className="text-gradient" /> {fileName ? `FILE: ${fileName}` : 'TỔNG QUAN FILE TÀI LIỆU'}</h2>
                <div className="stats-row">
                  <span 
                    className={`stat-pill success ${filterMode === 'all' ? 'active' : ''}`} 
                    onClick={() => setFilterMode('all')}
                    style={{ cursor: 'pointer' }}
                  >
                    Tất cả: {questions.length} câu
                  </span>
                  <span 
                    className={`stat-pill warning ${filterMode === 'invalid' ? 'active' : ''}`} 
                    onClick={() => setFilterMode('invalid')}
                    style={{ cursor: 'pointer' }}
                  >
                    Câu lỗi: {questions.filter(q => !q.correctAnswer || q.options.length < 2).length}
                  </span>
                </div>
              </div>
              <div className="preview-actions">
                <button onClick={handleAddQuestionManual} className="btn-secondary" style={{ borderStyle: 'dashed' }}>+ THÊM CÂU HỎI MỚI</button>
                <button onClick={() => setStep(1)} className="btn-secondary">HỦY BỎ</button>
                <button onClick={() => {
                   const invalidCount = questions.filter(q => !q.correctAnswer || q.options.length < 2).length;
                   if (invalidCount > 0) {
                      setError(`Vui lòng sửa hoặc xóa ${invalidCount} câu bị lỗi trước khi tiếp tục!`);
                   } else {
                      setError('');
                      setStep(3);
                   }
                }} className="btn-primary">TIẾP TỤC CẤU HÌNH</button>
              </div>
            </div>

            <div className="questions-list">
              {questions
                .filter(q => {
                   if (filterMode === 'invalid') return (!q.correctAnswer || q.options.length < 2);
                   return true;
                })
                .map((q) => {
                const isValid = q.correctAnswer && q.options.length >= 2;
                
                if (editingQuestion && editingQuestion.id === q.id) {
                    return (
                        <div key={q.id} className="question-card editing glass-panel">
                            <form onSubmit={handleSaveEdit}>
                                <div className="form-group">
                                    <label>Nội dung câu hỏi</label>
                                    <textarea rows="2" value={editingQuestion.text} onChange={e => setEditingQuestion({...editingQuestion, text: e.target.value})} required />
                                </div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Các lựa chọn (Tick vào đáp án đúng)</label>
                                <div className="edit-options-grid">
                                    {editingQuestion.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="edit-option-row">
                                            <input 
                                                type="radio" 
                                                name="correctAnswer" 
                                                checked={editingQuestion.correctAnswer === opt.letter} 
                                                onChange={() => setEditingQuestion({...editingQuestion, correctAnswer: opt.letter})}
                                                required
                                            />
                                            <span className="opt-letter">{opt.letter}.</span>
                                            <input 
                                                type="text" 
                                                value={opt.text} 
                                                onChange={e => {
                                                    const newOpts = [...editingQuestion.options];
                                                    newOpts[oIdx].text = e.target.value;
                                                    setEditingQuestion({...editingQuestion, options: newOpts});
                                                }}
                                                required 
                                            />
                                            <button type="button" className="btn-icon delete" onClick={() => {
                                                const newOpts = editingQuestion.options.filter((_, i) => i !== oIdx);
                                                setEditingQuestion({...editingQuestion, options: newOpts});
                                            }}><X size={16}/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        const nextLetter = String.fromCharCode(65 + editingQuestion.options.length); 
                                        setEditingQuestion({...editingQuestion, options: [...editingQuestion.options, { letter: nextLetter, text: 'Lựa chọn mới' }]})
                                    }} className="btn-secondary add-opt-btn">+ Thêm lựa chọn</button>
                                </div>
                                <div className="edit-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setEditingQuestion(null)} className="btn-secondary">Hủy</button>
                                    <button type="submit" className="btn-primary">Lưu Câu Hỏi</button>
                                </div>
                            </form>
                        </div>
                    );
                }

                return (
                  <div key={q.id} className={`question-card ${isValid ? '' : 'invalid'}`}>
                    <div className="q-header">
                      <strong>Câu {q.id}:</strong>
                      <div className="q-badges">
                          {!isValid && <span className="error-badge">Thiếu đáp án/lựa chọn</span>}
                          <button onClick={() => setEditingQuestion(q)} className="btn-icon edit">Sửa</button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="btn-icon delete">Xóa</button>
                      </div>
                    </div>
                    <p className="q-text">{q.text}</p>
                    <div className="q-options">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`q-option ${opt.letter === q.correctAnswer ? 'correct' : ''}`}>
                          <span className="opt-letter">{opt.letter}.</span> {opt.text}
                        </div>
                      ))}
                    </div>
                    {q.correctAnswer ? (
                      <div className="q-answer">Đáp án đúng: <strong>{q.correctAnswer}</strong></div>
                    ) : (
                      <div className="q-answer error">Chưa cấu hình đáp án đúng!</div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="config-section glass-panel shadow-glow">
            <div className="config-layout">
              {}
              <div className="config-form">
                <h2><Settings size={24} className="text-gradient" /> CẤU HÌNH BÀI THI</h2>
                
                <div className="form-group">
                  <label className="contrast-label">TÊN BÀI THI (Tiêu đề)</label>
                  <input type="text" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} placeholder="Ví dụ: Kiểm tra an toàn thông tin" />
                </div>
                
                <div className="form-group">
                  <label className="contrast-label">MÔ TẢ (Tùy chọn)</label>
                  <textarea rows="3" value={config.description} onChange={e => setConfig({...config, description: e.target.value})} placeholder="Lời nhắn gửi tới người làm bài..."></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="contrast-label">THỜI GIAN LÀM BÀI (Phút)</label>
                    <input type="number" min="1" value={config.timeLimit} onChange={e => setConfig({...config, timeLimit: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label className="contrast-label">SỐ CÂU HỎI TRONG 1 ĐỀ</label>
                    <input type="number" min="1" max={questions.length} value={config.questionsCount} onChange={e => setConfig({...config, questionsCount: parseInt(e.target.value)})} />
                    <small>Sẽ lấy ngẫu nhiên {config.questionsCount} câu từ ngân hàng {questions.length} câu.</small>
                  </div>
                </div>

                <div className="switches-container">
                  <label className="switch-wrapper">
                    <div className="switch-info">
                      <strong className="contrast-label">Hiển thị kết quả (Chấm điểm)</strong>
                      <span>Cho phép thí sinh xem câu đúng/sai sau khi nộp</span>
                    </div>
                    <input type="checkbox" checked={config.isScored} onChange={e => setConfig({...config, isScored: e.target.checked})} />
                  </label>
                  
                  <div className="config-card glass-panel">
                    <h3><Trophy size={20} color="var(--accent-main)" /> Bảng xếp hạng & Kết quả</h3>
                    <div className="checkbox-group">
                      <label><input type="checkbox" checked={config.hasLeaderboard} onChange={e => setConfig({...config, hasLeaderboard: e.target.checked})} /> Cho phép lưu kết quả và hiện bảng xếp hạng</label>
                      <label><input type="checkbox" checked={config.allowRetry} onChange={e => setConfig({...config, allowRetry: e.target.checked})} /> Cho phép làm lại bài thi</label>
                    </div>
                     {config.allowRetry && (
                       <div className="retry-limit-config">
                         <label className="contrast-label">SỐ LẦN LÀM LẠI TỐI ĐA</label>
                         <input type="number" min="1" max="100" value={config.retryLimit} onChange={e => setConfig({...config, retryLimit: parseInt(e.target.value)})} />
                       </div>
                     )}
                  </div>

                  {}
                  <div className="setup-section-light" style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', marginTop: '2rem' }}>
                    <div className="section-header-compact" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="header-icon-box" style={{ width: '45px', height: '45px', background: 'rgba(251, 191, 36, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={24} color="#fbbf24" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem' }}>Thông tin thí sinh (Phiếu đăng ký)</h4>
                        <p style={{ margin: 0, opacity: 0.6, fontSize: '0.85rem' }}>Cấu hình các trường dữ liệu thí sinh cần khai báo trước khi thi.</p>
                      </div>
                    </div>

                    <div className="participant-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      {(config.participantFields || []).map((field, idx) => (
                        <motion.div 
                          layout
                          key={field.key} 
                          className="field-config-card" 
                          style={{ background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}
                        >
                          <div className="field-index" style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.5 }}>
                            {idx + 1}
                          </div>
                          
                          <div className="field-input-group" style={{ flex: 1 }}>
                            <input 
                              type="text" 
                              value={field.label}
                              placeholder="Tên trường (VD: Họ và tên, Đơn vị...)"
                              onChange={(e) => {
                                const newFields = [...config.participantFields];
                                newFields[idx].label = e.target.value;
                                setConfig({ ...config, participantFields: newFields });
                              }}
                              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.1)', padding: '0.5rem 0', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                              onFocus={(e) => e.target.style.borderColor = 'var(--accent-main)'}
                              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                          </div>

                          <div className="field-options" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                              <input 
                                type="checkbox" 
                                checked={field.required}
                                onChange={(e) => {
                                  const newFields = [...config.participantFields];
                                  newFields[idx].required = e.target.checked;
                                  setConfig({ ...config, participantFields: newFields });
                                }}
                              />
                              <span>Bắt buộc</span>
                            </label>
                            <button 
                              onClick={() => {
                                const newFields = config.participantFields.filter((_, i) => i !== idx);
                                setConfig({ ...config, participantFields: newFields });
                              }} 
                              className="btn-icon delete-small"
                              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <button 
                      onClick={() => {
                        const newFields = [...(config.participantFields || []), { label: '', required: true, key: `field_${Date.now()}` }];
                        setConfig({ ...config, participantFields: newFields });
                      }} 
                      className="btn-outline-glow full-width"
                      style={{ width: '100%', border: '2px dashed rgba(255,255,255,0.1)', background: 'transparent', padding: '1rem', borderRadius: '16px', color: 'var(--accent-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                      + THÊM TRƯỜNG THÔNG TIN
                    </button>
                  </div>
                </div>
              </div>

              {}
              <div className="config-visuals">
                <h2><ImageIcon size={24} className="text-gradient" /> HÌNH ẢNH & THỜI HẠN</h2>

                <div className="form-group deadline-group" style={{ marginBottom: '2rem' }}>
                    <label className="contrast-label">HẠN CHÓT NỘP BÀI (DEADLINE)</label>
                    <input 
                      type="datetime-local" 
                      value={config.expiryDate} 
                      onChange={e => setConfig({...config, expiryDate: e.target.value})} 
                      className="deadline-input"
                    />
                    <small className="deadline-tip">Hệ thống sẽ tự động đóng bài thi sau thời gian này.</small>
                </div>
                
                <div className="form-group">
                  <label className="contrast-label">BANNER (Logo/Hình ngang)</label>
                  <input type="text" value={config.bannerUrl} onChange={e => setConfig({...config, bannerUrl: e.target.value})} placeholder="Link ảnh Banner (PNG/JPG)" />
                  {config.bannerUrl && <img src={config.bannerUrl} alt="Banner Preview" className="img-preview banner" />}
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="contrast-label">HÌNH NỀN (Background)</label>
                  <input type="text" value={config.backgroundUrl} onChange={e => setConfig({...config, backgroundUrl: e.target.value})} placeholder="Link ảnh nền làm bài thi" />
                  {config.backgroundUrl && <img src={config.backgroundUrl} alt="BG Preview" className="img-preview bg" />}
                </div>

                <div className="config-actions">
                  <button onClick={() => setStep(2)} className="btn-secondary" disabled={isSaving}>QUAY LẠI</button>
                  <button onClick={handleCreateQuiz} className="btn-primary" disabled={isSaving}>
                     {isSaving ? 'ĐANG TẠO ĐƯỜNG DẪN...' : <><Save size={18} /> HOÀN TẤT & TẠO LINK</>}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {}
        <AnimatePresence>
          {showLeaderboard && (
            <div className="modal-overlay">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="leaderboard-modal glass-panel"
              >
                <div className="modal-header">
                  <div className="header-title">
                    <h3><Trophy size={24} className="text-gradient" /> BẢNG XẾP HẠNG: {activeQuizTitle}</h3>
                    <p className="slug-info">Slug: {activeQuizSlug}</p>
                  </div>
                  <div className="header-actions">
                    <button onClick={exportToExcel} className="btn-icon-text excel" disabled={currentLeaderboard.length === 0}>
                      <Download size={18} /> XUẤT EXCEL
                    </button>
                    <button onClick={handleClearResults} className="btn-icon-text delete">
                      <Trash2 size={18} /> XÓA DỮ LIỆU
                    </button>
                    <button onClick={() => setShowLeaderboard(false)} className="close-btn" aria-label="Đóng cửa sổ Bảng xếp hạng"><X size={24} /></button>
                  </div>
                </div>

                <div className="modal-body">
                  {leaderboardLoading ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                  ) : currentLeaderboard.length === 0 ? (
                    <div className="empty-state">Chưa có thí sinh nào làm bài thi này.</div>
                  ) : (
                    <div className="leaderboard-table-wrapper">
                      <table className="leaderboard-table">
                        <thead>
                          <tr>
                            <th>Hạng</th>
                            {(generatedQuiz?.config?.participantFields || [{label: 'Thí sinh'}]).map((f, i) => <th key={i}>{f.label}</th>)}
                            <th>Điểm</th>
                            <th>Ngày nộp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentLeaderboard.map((res, idx) => (
                            <tr key={res.id} className={idx < 3 ? `top-${idx+1}` : ''}>
                              <td>{idx + 1}</td>
                              <td>
                                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong>{res.userName}</strong>
                                    {res.participantData && (
                                       <small style={{ opacity: 0.6, fontSize: '0.7rem' }}>
                                          {Object.entries(res.participantData)
                                            .filter(([k]) => k !== 'userName')
                                            .map(([, v]) => `${v}`).join(' | ')}
                                       </small>
                                    )}
                                 </div>
                              </td>
                              <td className="score-cell">{res.score}</td>
                              <td>{res.correctCount} / {res.totalCount}</td>
                              <td>{Math.floor(res.timeSpent / 60)}p {res.timeSpent % 60}s</td>
                              <td>
                                 <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    {res.submittedAt?.toDate().toLocaleString('vi-VN')}
                                    
                                    <div className="action-divider" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }}></div>

                                    {res.userAnswers && (
                                      <button 
                                        onClick={() => { setSelectedResult(res); setShowAdminReview(true); }}
                                        className="btn-icon view-details" 
                                        title="Xem chi tiết bài làm"
                                        style={{ padding: '6px', background: 'rgba(37, 99, 235, 0.2)', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                      >
                                         <FileText size={16} />
                                      </button>
                                    )}

                                    <button 
                                      onClick={() => handleResetAttempt(activeQuizSlug, res.userName, res.participantData)} 
                                      className="btn-icon reset" 
                                      title="Reset lượt thi"
                                      style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                       <RotateCcw size={16} />
                                    </button>
                                 </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAdminReview && selectedResult && (
            <div className="modal-overlay" style={{ zIndex: 12000 }}>
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="review-modal glass-panel"
                style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', background: 'var(--accent-main)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900', fontSize: '1.2rem' }}>
                      {selectedResult.userName[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.3rem' }}>CHI TIẾT: {selectedResult.userName}</h3>
                      <p style={{ margin: 0, opacity: 0.6, fontSize: '0.85rem' }}>
                        Điểm: <span style={{ color: 'var(--accent-main)', fontWeight: 'bold' }}>{selectedResult.score}</span> | Đúng: {selectedResult.correctCount}/{selectedResult.totalCount}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowAdminReview(false)} className="close-btn" aria-label="Đóng cửa sổ Xem lại bài làm"><X size={24} /></button>
                </div>
                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'rgba(0,0,0,0.3)' }}>
                  {selectedResult.questions ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {selectedResult.questions.map((q, idx) => {
                        const userAns = selectedResult.userAnswers[q.id];
                        const isCorrect = userAns === q.correctAnswer;
                        return (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.8rem', borderRadius: '20px', border: '1px solid', borderColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', alignItems: 'center' }}>
                              <strong style={{ opacity: 0.6, fontSize: '0.9rem', letterSpacing: '1px' }}>CÂU HỎI {idx + 1}</strong>
                              <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isCorrect ? '#10b981' : '#ef4444', fontWeight: '900' }}>
                                {isCorrect ? 'ĐÚNG' : 'SAI'}
                              </span>
                            </div>
                            <p style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', lineHeight: '1.4' }}>{q.text}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              {q.options.map((opt, oIdx) => (
                                <div 
                                  key={oIdx} 
                                  style={{ 
                                    padding: '1rem', 
                                    borderRadius: '12px', 
                                    background: 'rgba(255,255,255,0.04)', 
                                    border: '1px solid',
                                    borderColor: opt.letter === q.correctAnswer ? '#10b981' : (opt.letter === userAns ? '#ef4444' : 'rgba(255,255,255,0.05)'),
                                    display: 'flex',
                                    gap: '1rem',
                                    opacity: (opt.letter === q.correctAnswer || opt.letter === userAns) ? 1 : 0.4,
                                    transition: 'all 0.3s'
                                  }}
                                >
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: opt.letter === q.correctAnswer ? '#10b981' : (opt.letter === userAns ? '#ef4444' : 'rgba(255,255,255,0.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: (opt.letter === q.correctAnswer || opt.letter === userAns) ? '#000' : '#fff' }}>
                                    {opt.letter}
                                  </div>
                                  <span style={{ flex: 1 }}>{opt.text}</span>
                                  {opt.letter === q.correctAnswer && <Check size={18} style={{ color: '#10b981' }} />}
                                  {opt.letter === userAns && !isCorrect && <X size={18} style={{ color: '#ef4444' }} />}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', opacity: 0.5 }}>
                      <AlertCircle size={64} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                      <h3 style={{ margin: 0 }}>Không có dữ liệu chi tiết</h3>
                      <p>Bài thi này được thực hiện trước khi tính năng Review được kích hoạt.</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => setShowAdminReview(false)} className="btn-primary" style={{ minWidth: '150px' }}>ĐÓNG</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccessModal && generatedQuiz && (
            <div className="quiz-success-modal-overlay" onClick={() => setShowSuccessModal(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="quiz-success-modal shadow-glow"
                onClick={e => e.stopPropagation()}
              >
                <div className="success-icon-bg">
                  <CheckCircle size={40} color="#10b981" />
                </div>
                <h2>BÀI THI ĐÃ SẴN SÀNG!</h2>
                <p>Mã tham gia: <strong style={{color: 'var(--accent-main)'}}>{generatedQuiz.slug}</strong></p>

                <div className="qr-wrapper">
                  <QRCodeSVG 
                    value={`${window.location.origin}/quiz/${generatedQuiz.slug}`} 
                    size={200}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: "/logobct.png",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>

                <button onClick={downloadQRCode} className="qr-download-btn">
                   <Download size={18} /> TẢI MÃ QR VỀ MÁY
                </button>

                <div className="share-link-box">
                  <input readOnly value={`${window.location.origin}/quiz/${generatedQuiz.slug}`} />
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/quiz/${generatedQuiz.slug}`);
                    alert("Đã copy link!");
                  }}>
                    <Copy size={16} /> COPY
                  </button>
                </div>

                <div className="modal-footer-actions">
                  <button onClick={() => { setShowSuccessModal(false); setStep(0); }} className="btn-primary">QUẢN LÝ</button>
                  <button onClick={() => window.open(`/quiz/${generatedQuiz.slug}`, '_blank')} className="btn-secondary">XEM BÀI THI</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showShareModal && (
            <div className="modal-overlay">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="share-selection-modal glass-panel shadow-glow"
                style={{ maxWidth: '500px', width: '90%' }}
              >
                <div className="modal-header">
                  <h3><User size={24} color="var(--accent-main)" /> CHỌN NGƯỜI NHẬN</h3>
                  <button onClick={() => setShowShareModal(false)} className="close-btn" aria-label="Đóng cửa sổ Chia sẻ"><X size={24} /></button>
                </div>
                <div className="modal-body">
                  <div className="search-box-light" style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm theo tên hoặc email..." 
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    />
                  </div>
                  <div className="user-selection-list" style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {allUsers
                      .filter(u => 
                        u.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                      )
                      .map(user => (
                        <div 
                          key={user.uid} 
                          className="user-selection-item"
                          onClick={() => handleCloneQuiz(user)}
                          style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}
                        >
                          <div className="user-avatar-mini" style={{ width: '40px', height: '40px', background: 'var(--accent-main)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
                            {(user.displayName || user.email || '?')[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>{user.displayName || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{user.email}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default QuizMaker;

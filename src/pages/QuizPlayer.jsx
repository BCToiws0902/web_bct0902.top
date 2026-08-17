import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, CheckCircle, ChevronRight, ChevronLeft, Send, AlertCircle, Award, Layout, LogOut, Trophy, Check, X } from 'lucide-react';

const QuizPlayer = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [gameQuestions, setGameQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    // Play State
    const [gameState, setGameState] = useState('lobby'); 
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); 
    const [timeLeft, setTimeLeft] = useState(0);
    const [participantData, setParticipantData] = useState({}); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [finalResult, setFinalResult] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [checkingAttempts, setCheckingAttempts] = useState(false);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const q = query(collection(db, 'quizzes'), where('slug', '==', slug));
                const snapshot = await getDocs(q);
                if (snapshot.empty) {
                    setError('Không tìm thấy bài thi hoặc bài thi đã bị xóa!');
                } else {
                    const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    setQuiz(data);
                    
                    if (data.status === 'ended') {
                        fetchPublicLeaderboard(data.slug);
                    }

                    const savedAttempts = parseInt(localStorage.getItem(`quiz_attempts_${slug}`)) || 0;
                    setAttempts(savedAttempts);
                    
                    if (data.config.expiryDate) {
                        const now = new Date();
                        const expiry = new Date(data.config.expiryDate);
                        if (now > expiry) {
                            setIsExpired(true);
                        }
                    }

                    if (data.config.participantFields) {
                        const initialData = {};
                        data.config.participantFields.forEach(f => {
                            initialData[f.key] = '';
                        });
                        setParticipantData(initialData);
                    }

                    // Fetch attempts from Firestore instead of localStorage
                    // We can only check this after participant enters their name, 
                    // so we'll move initial attempt check to a function
                }
            } catch (err) {
                console.error(err);
                setError('Lỗi kết nối máy chủ!');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [slug]);

    const fetchPublicLeaderboard = async (quizSlug) => {
        setLeaderboardLoading(true);
        try {
            const resultsRef = collection(db, 'quiz_results');
            const q = query(resultsRef, where('quizSlug', '==', quizSlug));
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            results.sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent);
            setLeaderboard(results);
        } catch (err) {
            console.error("Error fetching public leaderboard:", err);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    const handleFinishRef = React.useRef();
    handleFinishRef.current = handleFinish;

    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleFinishRef.current?.();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const handleStart = async () => {
        if (quiz?.config?.hasLeaderboard) {
            const fields = quiz.config.participantFields || [];
            const missing = fields.find(f => f.required && !participantData[f.key]?.trim());
            if (missing) {
                alert(`Vui lòng nhập ${missing.label} để bắt đầu!`);
                return;
            }
        }

        const all = [...quiz.questions];
        if (all.length === 0) {
            alert('Bài thi này chưa có câu hỏi!');
            return;
        }

        setCheckingAttempts(true);
        try {
            
            const attemptsRef = collection(db, 'quiz_attempts');
            const userName = participantData.userName || participantData[Object.keys(participantData)[0]] || 'Guest';
            
            const q = query(attemptsRef, where('quizSlug', '==', slug), where('userName', '==', userName));
            const snapshot = await getDocs(q);
            
            let currentAttempts = 0;
            let attemptDocId = null;

            if (!snapshot.empty) {
                currentAttempts = snapshot.docs[0].data().count || 0;
                attemptDocId = snapshot.docs[0].id;
            }

            if (currentAttempts >= (quiz.config.retryLimit || 1)) {
                alert("Ngài đã hết lượt làm bài thi này!");
                setCheckingAttempts(false);
                return;
            }

            if (attemptDocId) {
                await updateDoc(doc(db, 'quiz_attempts', attemptDocId), {
                    count: currentAttempts + 1,
                    lastAttemptAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'quiz_attempts'), {
                    quizSlug: slug,
                    userName: userName,
                    count: 1,
                    createdAt: serverTimestamp(),
                    lastAttemptAt: serverTimestamp()
                });
            }

            setAttempts(currentAttempts + 1);
            const questionsCount = Math.min(quiz.config.questionsCount || all.length, all.length);
            const shuffled = all.sort(() => 0.5 - Math.random()).slice(0, questionsCount);
            
            setGameQuestions(shuffled);
            setTimeLeft(quiz.config.timeLimit * 60);
            setGameState('playing');
        } catch (err) {
            console.error("Attempt check error:", err);
            alert("Lỗi kết nối máy chủ khi kiểm tra lượt thi!");
        } finally {
            setCheckingAttempts(false);
        }
    };

    const handleSelect = (questionId, letter) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: letter }));
    };

    const handleFinish = async () => {
        if (gameState === 'result') return;
        setIsSubmitting(true);

        let correctCount = 0;
        gameQuestions.forEach(q => {
            if (userAnswers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });

        const score = ((correctCount / (gameQuestions.length || 1)) * 10).toFixed(2);
        const resultData = {
            quizSlug: slug,
            quizTitle: quiz?.config?.title || 'Bài thi',
            userName: participantData.userName || (participantData[Object.keys(participantData)[0]]) || 'Thí sinh',
            participantData: participantData,
            score: parseFloat(score),
            correctCount,
            totalCount: gameQuestions.length,
            timeSpent: (quiz?.config?.timeLimit || 0) * 60 - timeLeft,
            userAnswers: userAnswers,
            questions: gameQuestions, 
            submittedAt: serverTimestamp()
        };

        try {
            if (quiz.config.hasLeaderboard) {
                await addDoc(collection(db, 'quiz_results'), resultData);
            }
            setFinalResult(resultData);
            setGameState('result');
        } catch (err) {
            console.error("Error saving result:", err);
            setFinalResult(resultData);
            setGameState('result');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const isOutOfAttempts = quiz ? (attempts >= (quiz?.config?.retryLimit || 1)) : false;
    const isExpiredLocally = isExpired;

    return (
        <div className="quiz-player-container light-mode" style={{ 
            backgroundImage: (quiz && quiz.config.backgroundUrl) ? `url(${quiz.config.backgroundUrl})` : 'none',
            fontFamily: 'var(--font-tech)'
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet" />
            <div className="quiz-overlay-light"></div>
            
            {}
            <div className="mobile-back-header">
                <button onClick={() => navigate('/')} className="btn-back-minimal">
                    <ChevronLeft size={20} /> QUAY LẠI
                </button>
            </div>
            {loading ? (
                <div className="quiz-loader-visible">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                        <Timer size={48} color="#2563eb" />
                    </motion.div>
                    <p>Đang chuẩn bị phòng thi...</p>
                </div>
            ) : error ? (
                <div className="quiz-error-page">
                    <AlertCircle size={48} color="#dc2626" />
                    <h2 style={{ color: '#1f2937' }}>{error}</h2>
                    <button onClick={() => navigate('/')} className="btn-secondary-light">Quay lại trang chủ</button>
                </div>
            ) : !quiz ? (
                <div className="quiz-error-page">
                    <AlertCircle size={48} color="#dc2626" />
                    <h2 style={{ color: '#1f2937' }}>Không thể tải dữ liệu bài thi.</h2>
                    <button onClick={() => navigate('/')} className="btn-secondary-light">Quay lại trang chủ</button>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {quiz.status === 'paused' && (
                        <motion.div key="paused" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="quiz-lobby glass-panel-light">
                            <AlertCircle size={64} color="#f59e0b" />
                            <h1>BÀI THI ĐANG TẠM DỪNG</h1>
                            <p className="description-light">Hệ thống đang tạm dừng để chỉnh sửa hoặc cập nhật. Vui lòng quay lại sau.</p>
                            <div className="lobby-actions" style={{ marginTop: '2rem' }}>
                                <button onClick={() => navigate('/')} className="btn-secondary-light">Quay lại trang chủ</button>
                            </div>
                        </motion.div>
                    )}

                    {quiz.status === 'ended' && (
                        <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="public-leaderboard-container">
                            <div className="leaderboard-intro glass-panel-light">
                                <Trophy size={64} color="#f59e0b" />
                                <h1 className="text-highlight">KẾT QUẢ CHUNG CUỘC</h1>
                                <h2 style={{ color: '#1f2937' }}>{quiz.config.title}</h2>
                                <p style={{ color: '#4b5563' }}>Bài thi đã kết thúc. Cảm ơn tất cả các thí sinh đã tham gia!</p>
                            </div>

                            {leaderboardLoading ? (
                                <div className="loading-state">Đang tổng hợp kết quả...</div>
                            ) : (
                                <div className="results-grid">
                                    <div className="top-podium-light">
                                        {leaderboard.slice(0, 3).map((res, idx) => (
                                            <motion.div 
                                                key={res.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.2 }}
                                                className={`podium-item-light rank-${idx + 1}`}
                                            >
                                                <div className="rank-badge-light">{idx + 1}</div>
                                                <div className="podium-avatar-light">{(res.userName || 'T').charAt(0).toUpperCase()}</div>
                                                <div className="podium-name-light">{res.userName}</div>
                                                <div className="podium-score-light">{res.score}</div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="other-ranks glass-panel-light">
                                        {leaderboard.slice(3).map((res, idx) => (
                                            <div key={res.id} className="rank-row-light">
                                                <span className="row-rank">{idx + 4}</span>
                                                <span className="row-name">{res.userName}</span>
                                                <span className="row-score">{res.score} đ</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <button onClick={() => navigate('/')} className="btn-secondary-light">Quay lại trang chủ</button>
                            </div>
                        </motion.div>
                    )}

                    {(!quiz.status || quiz.status === 'open' || quiz.status === 'active') && gameState === 'lobby' && (
                        <motion.div key="lobby" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="quiz-lobby glass-panel-light">
                            {quiz.config.bannerUrl && <img src={quiz.config.bannerUrl} alt="Banner" className="lobby-banner-light" />}
                            <h1 className="title-light" style={{ fontFamily: 'var(--font-tech)', fontWeight: 800 }}>{quiz.config.title}</h1>
                            <p className="description-light">{quiz.config.description}</p>
                            
                            <div className="lobby-info-grid-light">
                                <div className="info-item-light"><Timer size={24} /><strong>{quiz.config.timeLimit} Phút</strong></div>
                                <div className="info-item-light"><Award size={24} /><strong>{quiz.config.questionsCount} Câu hỏi</strong></div>
                            </div>

                            {quiz.config.hasLeaderboard && (
                                <div className="dynamic-form-light">
                                    {(quiz.config.participantFields || []).map((field, idx) => (
                                        <div key={idx} className="name-input-group-light">
                                            <label>{field.label.toUpperCase()} {field.required && <span style={{color: '#dc2626'}}>*</span>}</label>
                                            <input 
                                                type="text" 
                                                placeholder={`Nhập ${field.label.toLowerCase()}`}
                                                value={participantData[field.key] || ''} 
                                                onChange={e => setParticipantData({...participantData, [field.key]: e.target.value})} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="lobby-actions">
                                {isExpiredLocally ? (
                                    <div className="expiry-notice-light"><AlertCircle size={20} /> Bài thi đã đóng (Hết hạn)!</div>
                                ) : (
                                    <button 
                                      onClick={handleStart} 
                                      className="btn-start-light shadow-standard" 
                                      disabled={checkingAttempts}
                                    >
                                        {checkingAttempts ? 'ĐANG KIỂM TRA...' : 'BẮT ĐẦU LÀM BÀI'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="quiz-play-area-light fullscreen-play">
                            <header className="play-header-light glass-panel-light">
                                <div className="header-left">
                                    <h3>{quiz.config.title}</h3>
                                    <div className="progress-bar-light"><div className="progress-fill-light" style={{ width: `${((Object.keys(userAnswers).length) / (gameQuestions.length || 1)) * 100}%` }}></div></div>
                                </div>
                                <div className="header-right">
                                    <div className={`timer-light ${timeLeft < 60 ? 'urgent' : ''}`}><Timer size={24} /><span>{formatTime(timeLeft)}</span></div>
                                    <button onClick={() => {if(window.confirm('Xác nhận nộp bài?')) handleFinish()}} className="btn-submit-light">NỘP BÀI</button>
                                </div>
                            </header>

                            <div className="play-content-light">
                                <div className="question-navigation-light glass-panel-light">
                                    <h4>DANH SÁCH CÂU HỎI</h4>
                                    <div className="nav-grid-light">
                                        {gameQuestions.map((q, idx) => (
                                            <button key={idx} className={`nav-item-light ${currentIndex === idx ? 'active' : ''} ${userAnswers[q.id] ? 'answered' : ''}`} onClick={() => setCurrentIndex(idx)}>{idx + 1}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="question-display-light glass-panel-light">
                                    <motion.div key={currentIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="q-container-light">
                                        <span className="q-number-light">Câu {currentIndex + 1} / {gameQuestions.length}</span>
                                        <h2 className="q-text-light">{gameQuestions[currentIndex].text}</h2>
                                        <div className="options-grid-light">
                                            {gameQuestions[currentIndex].options.map((opt, idx) => (
                                                <button key={idx} className={`option-card-light ${userAnswers[gameQuestions[currentIndex].id] === opt.letter ? 'selected' : ''}`} onClick={() => handleSelect(gameQuestions[currentIndex].id, opt.letter)}>
                                                    <span className="opt-letter-light">{opt.letter}</span>
                                                    <span className="opt-text-light">{opt.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>

                                    <div className="q-actions-light">
                                        <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="btn-nav-light"><ChevronLeft /> CÂU TRƯỚC</button>
                                        {currentIndex === gameQuestions.length - 1 ? (
                                            <button onClick={handleFinish} className="btn-finish-light" disabled={isSubmitting}>{isSubmitting ? 'ĐANG NỘP...' : 'HOÀN THÀNH'}</button>
                                        ) : (
                                            <button onClick={() => setCurrentIndex(prev => prev + 1)} className="btn-nav-light">CÂU TIẾP <ChevronRight /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'result' && (
                        <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="quiz-result-light glass-panel-light">
                            <Award size={80} color="#f59e0b" />
                            <h2 style={{ color: '#1f2937', marginTop: '1.5rem' }}>KẾT QUẢ BÀI THI</h2>
                            <h1 className="score-light">{finalResult.score} / 10</h1>
                            <div className="result-stats-light">
                                <div className="stat-box-light success"><strong>{finalResult.correctCount}</strong> <span>CÂU ĐÚNG</span></div>
                                <div className="stat-box-light error"><strong>{finalResult.totalCount - finalResult.correctCount}</strong> <span>CÂU SAI</span></div>
                            </div>
                            <p className="congrats-light">Thí sinh <strong>{finalResult.userName}</strong> đã hoàn thành bài kiểm tra!</p>
                            <div className="result-actions-light">
                                {!isOutOfAttempts ? (
                                    <button onClick={() => window.location.reload()} className="btn-secondary-light">THI LẠI ({quiz.config.retryLimit - attempts})</button>
                                ) : <span className="no-retry-badge-light">HẾT LƯỢT THI LẠI</span>}
                                <button onClick={() => navigate('/')} className="btn-primary-light">TRANG CHỦ</button>
                            </div>
                            {quiz.config.isScored && (
                                <button 
                                  onClick={() => setShowReview(true)} 
                                  className="btn-review-light"
                                  style={{ marginTop: '1rem', width: '100%', padding: '1rem', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: 'bold', border: '1px dashed #2563eb' }}
                                >
                                    XEM LẠI ĐÁP ÁN CHI TIẾT
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {}
            <AnimatePresence>
                {showReview && (
                    <div className="modal-overlay-light">
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="review-modal-light glass-panel-light"
                        >
                            <div className="review-header-light">
                                <h3><Award size={24} /> CHI TIẾT BÀI LÀM</h3>
                                <button onClick={() => setShowReview(false)} className="close-btn-light"><X size={24} /></button>
                            </div>
                            <div className="review-body-light">
                                {gameQuestions.map((q, idx) => {
                                    const userAns = userAnswers[q.id];
                                    const isCorrect = userAns === q.correctAnswer;
                                    return (
                                        <div key={idx} className={`review-card-light ${isCorrect ? 'correct' : 'wrong'}`}>
                                            <div className="review-q-header">
                                                <strong>Câu {idx + 1}:</strong>
                                                <span className={`review-status-badge ${isCorrect ? 'correct' : 'wrong'}`}>
                                                    {isCorrect ? 'Đúng' : 'Sai'}
                                                </span>
                                            </div>
                                            <p className="review-q-text">{q.text}</p>
                                            <div className="review-options">
                                                {q.options.map((opt, oIdx) => (
                                                    <div 
                                                        key={oIdx} 
                                                        className={`review-opt ${opt.letter === q.correctAnswer ? 'is-correct' : ''} ${opt.letter === userAns && !isCorrect ? 'is-user-wrong' : ''}`}
                                                    >
                                                        <strong>{opt.letter}.</strong> {opt.text}
                                                        {opt.letter === q.correctAnswer && <Check size={16} style={{ marginLeft: 'auto' }} />}
                                                        {opt.letter === userAns && !isCorrect && <X size={16} style={{ marginLeft: 'auto' }} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="review-footer-light">
                                <button onClick={() => setShowReview(false)} className="btn-primary-light">ĐÓNG</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .quiz-player-container.light-mode {
                    min-height: 100vh;
                    background-color: #f3f4f6;
                    color: #1f2937;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    padding: 6rem 1rem 4rem;
                    position: relative;
                    font-family: 'Outfit', sans-serif;
                }
                .mobile-back-header { display: none; }
                
                @media (max-width: 768px) {
                    .quiz-player-container.light-mode {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 10000;
                        padding: 5rem 1rem 2rem;
                        overflow-y: auto;
                    }
                    .mobile-back-header {
                        display: flex;
                        position: fixed;
                        top: 1rem;
                        left: 1rem;
                        z-index: 10001;
                    }
                    .btn-back-minimal {
                        background: rgba(255,255,255,0.8);
                        backdrop-filter: blur(10px);
                        border: 1px solid #e5e7eb;
                        padding: 0.6rem 1rem;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 0.75rem;
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                        color: #4b5563;
                    }
                }

                .quiz-overlay-light {
                    position: absolute;
                    inset: 0;
                    background: rgba(255, 255, 255, 0.85);
                    z-index: 1;
                }
                .glass-panel-light {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    border-radius: 24px;
                    position: relative;
                    z-index: 2;
                }
                .quiz-lobby {
                    max-width: 650px;
                    width: 100%;
                    padding: 3rem;
                    text-align: center;
                }
                @media (max-width: 768px) {
                    .quiz-lobby { padding: 2rem 1.5rem; border-radius: 20px; }
                }
                .title-light { 
                    font-size: 2.8rem; 
                    font-weight: 800; 
                    color: #111827; 
                    margin: 1.5rem 0 1.5rem; 
                    line-height: 1.2;
                    letter-spacing: -0.5px;
                }
                @media (max-width: 768px) {
                    .title-light { font-size: 1.8rem; margin: 1rem 0; }
                }
                .description-light { color: #4b5563; line-height: 1.6; margin-bottom: 2rem; font-size: 1.1rem; }
                @media (max-width: 768px) {
                    .description-light { font-size: 0.95rem; margin-bottom: 1.5rem; }
                    .lobby-info-grid-light { gap: 1.5rem !important; }
                }
                .lobby-info-grid-light { display: flex; justify-content: center; gap: 2.5rem; margin-bottom: 3rem; }
                .info-item-light { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; color: #1f2937; }
                .info-item-light strong { font-size: 1.2rem; }
                .dynamic-form-light { text-align: left; margin-bottom: 2.5rem; display: flex; flex-direction: column; gap: 1.2rem; }
                .name-input-group-light { text-align: left; }
                .name-input-group-light label { font-size: 0.8rem; font-weight: 800; color: #374151; margin-bottom: 0.6rem; display: block; letter-spacing: 1px; }
                .name-input-group-light input { width: 100%; padding: 1.2rem; border-radius: 14px; border: 2px solid #e5e7eb; font-size: 1.1rem; outline: none; transition: all 0.2s; font-family: inherit; }
                .name-input-group-light input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
                .btn-start-light { width: 100%; background: #2563eb; color: #fff; padding: 1.4rem; border-radius: 16px; font-weight: 800; border: none; font-size: 1.3rem; cursor: pointer; transition: all 0.3s; }
                .btn-start-light:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2); }
                
                .quiz-play-area-light { width: 100%; max-width: 1300px; z-index: 2; display: flex; flex-direction: column; gap: 1.5rem; transition: all 0.3s; }
                .quiz-play-area-light.fullscreen-play { max-width: 96vw; }
                .play-header-light { padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; border-radius: 20px; }
                @media (max-width: 768px) {
                    .play-header-light { padding: 1rem; flex-direction: column; gap: 1rem; }
                    .progress-bar-light { width: 100% !important; }
                    .header-right { width: 100%; display: flex; justify-content: space-between; align-items: center; }
                }
                .header-left h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; }
                .progress-bar-light { width: 400px; height: 10px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
                .progress-fill-light { height: 100%; background: #2563eb; transition: width 0.4s ease; }
                .timer-light { display: flex; align-items: center; gap: 0.8rem; font-size: 2rem; font-weight: 800; color: #2563eb; font-variant-numeric: tabular-nums; }
                .timer-light.urgent { color: #dc2626; animation: pulse 1s infinite; }
                @keyframes pulse { 50% { opacity: 0.6; } }
                .btn-submit-light { background: #dc2626; color: #fff; padding: 0.8rem 2.5rem; border-radius: 12px; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; }
                .btn-submit-light:hover { background: #b91c1c; }

                .play-content-light { display: grid; grid-template-columns: 350px 1fr; gap: 1.5rem; }
                @media (max-width: 1024px) {
                    .play-content-light { grid-template-columns: 1fr; }
                    .question-navigation-light { order: 2; }
                    .question-display-light { order: 1; padding: 2rem !important; min-height: auto !important; }
                }
                .question-navigation-light { padding: 2rem; }
                .question-navigation-light h4 { font-size: 0.9rem; font-weight: 800; color: #6b7280; letter-spacing: 1px; margin-bottom: 1.5rem; }
                .nav-grid-light { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.8rem; }
                .nav-item-light { width: 100%; aspect-ratio: 1; border-radius: 12px; border: 2px solid #e5e7eb; background: #fff; font-weight: 800; cursor: pointer; transition: all 0.2s; font-family: inherit; }
                .nav-item-light.active { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
                .nav-item-light.answered { background: #2563eb; color: #fff; border-color: #2563eb; }

                .question-display-light { padding: 4rem; min-height: 600px; display: flex; flex-direction: column; justify-content: space-between; border-radius: 32px; }
                .q-number-light { color: #2563eb; font-weight: 800; letter-spacing: 1.5px; font-size: 0.9rem; }
                .q-text-light { font-size: 2.2rem; color: #111827; margin: 1.5rem 0 3.5rem; line-height: 1.3; font-weight: 700; }
                @media (max-width: 768px) {
                    .q-text-light { font-size: 1.4rem; margin: 1rem 0 2rem; }
                    .options-grid-light { grid-template-columns: 1fr !important; gap: 1rem !important; }
                    .option-card-light { padding: 1.2rem !important; border-radius: 16px !important; }
                }
                .options-grid-light { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .option-card-light { background: #f9fafb; border: 2px solid #e5e7eb; padding: 1.8rem; border-radius: 20px; text-align: left; cursor: pointer; display: flex; gap: 1.2rem; align-items: center; transition: all 0.2s; font-family: inherit; }
                .option-card-light:hover { background: #f3f4f6; border-color: #d1d5db; }
                .option-card-light.selected { border-color: #2563eb; background: #eff6ff; }
                .opt-letter-light { width: 45px; height: 45px; background: #fff; border: 2px solid #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; }
                .option-card-light.selected .opt-letter-light { background: #2563eb; color: #fff; border-color: #2563eb; }
                .opt-text-light { font-size: 1.2rem; font-weight: 600; color: #374151; }

                .q-actions-light { display: flex; justify-content: space-between; margin-top: 4rem; }
                @media (max-width: 768px) {
                    .q-actions-light { margin-top: 2rem; }
                    .btn-nav-light { padding: 0.8rem 1.2rem !important; font-size: 0.8rem; }
                }
                .btn-nav-light { display: flex; align-items: center; gap: 0.6rem; padding: 1.2rem 2.5rem; border: 2px solid #e5e7eb; border-radius: 16px; font-weight: 800; cursor: pointer; background: #fff; transition: all 0.2s; font-family: inherit; }
                .btn-nav-light:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; }
                .btn-finish-light { background: #2563eb; color: #fff; padding: 1.2rem 4rem; border-radius: 16px; font-weight: 800; border: none; cursor: pointer; transition: all 0.3s; font-size: 1.1rem; }

                .quiz-result-light { max-width: 650px; width: 100%; padding: 5rem 3rem; text-align: center; }
                @media (max-width: 768px) {
                    .quiz-result-light { padding: 3rem 1.5rem; }
                    .score-light { font-size: 4rem !important; }
                    .result-stats-light { gap: 1rem !important; }
                    .result-actions-light { flex-direction: column; }
                }
                .score-light { font-size: 6rem; font-weight: 900; color: #2563eb; margin: 1.5rem 0; letter-spacing: -2px; }
                .result-stats-light { display: flex; justify-content: center; gap: 2.5rem; margin-bottom: 2.5rem; }
                .stat-box-light { padding: 1.2rem 2.5rem; border-radius: 18px; display: flex; flex-direction: column; min-width: 140px; }
                .stat-box-light strong { font-size: 1.8rem; }
                .stat-box-light span { font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; }
                .stat-box-light.success { background: #dcfce7; color: #166534; }
                .stat-box-light.error { background: #fee2e2; color: #991b1b; }
                .congrats-light { font-size: 1.1rem; color: #4b5563; }
                .result-actions-light { display: flex; gap: 1.2rem; justify-content: center; margin-top: 3.5rem; }
                .btn-primary-light { background: #2563eb; color: #fff; padding: 1.2rem 3rem; border-radius: 16px; border: none; font-weight: 800; cursor: pointer; transition: all 0.2s; }
                .btn-secondary-light { background: #fff; color: #374151; padding: 1.2rem 3rem; border-radius: 16px; border: 2px solid #e5e7eb; font-weight: 800; cursor: pointer; transition: all 0.2s; }

                .attempts-hint { margin-top: 1rem; color: #9ca3af; font-size: 0.85rem; font-weight: 600; }
                .expiry-notice-light { display: flex; align-items: center; justify-content: center; gap: 0.6rem; color: #dc2626; background: #fee2e2; padding: 1rem; border-radius: 12px; font-weight: 700; margin-bottom: 1rem; }

                /* Review Modal Styles */
                .modal-overlay-light {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(5px);
                    z-index: 11000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 1rem;
                }
                .review-modal-light {
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border-radius: 20px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    background: #fff;
                }
                .review-header-light {
                    padding: 1.5rem;
                    background: #fff;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .review-header-light h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; color: #111827; }
                .review-body-light {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    background: #f9fafb;
                }
                .review-card-light {
                    background: #fff;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    border: 1px solid #e5e7eb;
                    text-align: left;
                }
                .review-card-light.correct { border-left: 5px solid #10b981; }
                .review-card-light.wrong { border-left: 5px solid #ef4444; }
                .review-q-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                    align-items: center;
                }
                .review-status-badge {
                    font-size: 0.75rem;
                    padding: 0.2rem 0.6rem;
                    border-radius: 20px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .review-status-badge.correct { background: #d1fae5; color: #065f46; }
                .review-status-badge.wrong { background: #fee2e2; color: #991b1b; }
                .review-q-text { font-size: 1.1rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem; }
                .review-options { display: flex; flex-direction: column; gap: 0.5rem; }
                .review-opt {
                    display: flex;
                    align-items: center;
                    padding: 0.8rem 1rem;
                    border-radius: 8px;
                    background: #f3f4f6;
                    border: 1px solid transparent;
                    font-size: 0.95rem;
                    color: #4b5563;
                }
                .review-opt.is-correct {
                    background: #d1fae5;
                    border-color: #10b981;
                    color: #065f46;
                    font-weight: 600;
                }
                .review-opt.is-user-wrong {
                    background: #fee2e2;
                    border-color: #ef4444;
                    color: #991b1b;
                    font-weight: 600;
                }
                .review-footer-light {
                    padding: 1.5rem;
                    background: #fff;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    justify-content: center;
                }
                .close-btn-light {
                    background: none; border: none; cursor: pointer; color: #6b7280;
                }
                .btn-review-light:hover {
                    background: rgba(37, 99, 235, 0.2) !important;
                    transform: translateY(-2px);
                    transition: all 0.3s;
                }

                .public-leaderboard-container { width: 100%; max-width: 1000px; z-index: 2; display: flex; flex-direction: column; gap: 2rem; }
                .top-podium-light { display: flex; justify-content: center; align-items: flex-end; gap: 2rem; margin-bottom: 2rem; padding: 2rem; }
                @media (max-width: 768px) {
                    .top-podium-light { flex-direction: column; align-items: center; gap: 3rem; }
                    .podium-item-light { width: 100% !important; max-width: 280px; }
                }
                .podium-item-light { display: flex; flex-direction: column; align-items: center; position: relative; padding: 2rem; background: #fff; border: 2px solid #e5e7eb; border-radius: 24px; width: 220px; }
                .rank-1 { order: 2; transform: scale(1.15); border-color: #fbbf24; background: #fffbeb; }
                .rank-badge-light { position: absolute; top: -15px; width: 40px; height: 40px; border-radius: 50%; background: #2563eb; color: #fff; font-weight: 900; display: flex; align-items: center; justify-content: center; }
                .rank-1 .rank-badge-light { background: #fbbf24; }
                .podium-avatar-light { width: 70px; height: 70px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin-bottom: 1rem; }
                .podium-name-light { font-weight: 800; color: #1f2937; margin-bottom: 0.5rem; }
                .podium-score-light { font-size: 2.5rem; font-weight: 900; color: #2563eb; }
                .rank-row-light { display: grid; grid-template-columns: 60px 1fr 100px; padding: 1.2rem 2rem; border-bottom: 1px solid #f3f4f6; align-items: center; }
                .row-rank { color: #6b7280; font-weight: bold; }
                .row-name { font-weight: 500; color: #1f2937; }
                .row-score { text-align: right; color: #2563eb; font-weight: 800; }

                .quiz-loader-visible {
                    position: relative;
                    z-index: 2;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    color: #1f2937;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
};

export default QuizPlayer;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Send, 
  Image as ImageIcon, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  List, 
  Table as TableIcon,
  Eye,
  Columns,
  Edit3,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import './BlogCMS.css';

const BlogCMS = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('Tech');
  const [thumbnail, setThumbnail] = useState('');
  const [published, setPublished] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(id !== 'new');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'

  useEffect(() => {
    if (id !== 'new') {
      fetchPost();
    }
  }, [id]);

  useEffect(() => {
    if (title && !slug && id === 'new') {
      const generatedSlug = title.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim().replace(/\s+/g, "-");
      setSlug(generatedSlug);
    }
  }, [title]);

  const fetchPost = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'blog_posts', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setSlug(data.slug || id);
        setContent(data.content || '');
        setExcerpt(data.excerpt || '');
        setCategory(data.category || 'Tech');
        setThumbnail(data.thumbnail || '');
        setPublished(data.published || false);
      } else {
        alert('Không tìm thấy bài viết này!');
        navigate('/admin');
      }
    } catch (err) {
      alert('Lỗi truy xuất hệ thống: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const handleSave = async (isPublishing = false) => {
    if (!title.trim() || !content.trim()) {
      alert("Vui lòng điền đủ Tiêu đề và Nội dung bài viết.");
      return;
    }
    
    setSaving(true);
    try {
      const targetId = id === 'new' ? (slug || Date.now().toString()) : id;
      const postData = {
        id: targetId,
        title,
        slug: slug || targetId,
        content,
        excerpt: excerpt || content.substring(0, 150) + '...',
        category,
        thumbnail,
        published: isPublishing,
        date: new Date().toLocaleDateString('vi-VN'),
        timestamp: new Date(),
        author: 'BCT0902 Admin'
      };

      await setDoc(doc(db, 'blog_posts', targetId), postData, { merge: true });
      setPublished(isPublishing);
      showStatus(isPublishing ? "✅ ĐÃ XUẤT BẢN THÀNH CÔNG!" : "💾 ĐÃ LƯU BẢN NHÁP!");
      
      if (id === 'new') {
        window.history.replaceState(null, '', `/admin/cms/${targetId}`);
      }
    } catch (err) {
      alert('Lỗi lưu bài viết: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh tối đa là 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_W = 1200;
          
          if (width > MAX_W) {
            height *= MAX_W / width;
            width = MAX_W;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Insert Markdown formatting at cursor position
  const insertMarkdown = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const replacement = prefix + selectedText + suffix;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090a0f', color: '#f4f4f5', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="spin" style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#5e6ad2', borderRadius: '50%' }} />
          <span>Đang khởi tạo không gian soạn thảo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-container">
      {/* Header Bar */}
      <header className="cms-header">
        <div className="cms-header-left">
          <button className="cms-back-btn" onClick={() => navigate('/admin')} title="Quay về Admin">
            <ArrowLeft size={16} />
            <span>Quản Trị</span>
          </button>
          <input 
            type="text" 
            className="cms-title-input" 
            placeholder="Nhập tiêu đề bài viết..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="cms-header-actions">
          {/* View Mode Switcher */}
          <div className="cms-view-mode-tabs">
            <button 
              className={`cms-view-mode-tab ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Xem chia đôi 50/50"
            >
              <Columns size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              <span>Chia Đôi</span>
            </button>
            <button 
              className={`cms-view-mode-tab ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => setViewMode('editor')}
              title="Toàn màn hình soạn thảo"
            >
              <Edit3 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              <span>Soạn Thảo</span>
            </button>
            <button 
              className={`cms-view-mode-tab ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Toàn màn hình xem trước"
            >
              <Eye size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              <span>Xem Trước</span>
            </button>
          </div>

          <button className="cms-btn draft" disabled={saving} onClick={() => handleSave(false)}>
            <Save size={15} />
            <span>{saving ? 'Đang lưu...' : 'Lưu Nháp'}</span>
          </button>
          <button className="cms-btn publish" disabled={saving} onClick={() => handleSave(true)}>
            <Send size={15} />
            <span>Xuất Bản Ngay</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="cms-body">
        {/* Left Sidebar Settings */}
        <aside className="cms-sidebar">
          {/* Cover Image */}
          <div className="cms-sidebar-section">
             <label>ẢNH BÌA (COVER IMAGE)</label>
             <label className="cms-img-uploader" style={{ backgroundImage: thumbnail ? `url(${thumbnail})` : 'none' }}>
                {!thumbnail && (
                  <>
                    <Upload size={22} style={{ color: 'var(--cms-text-secondary)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--cms-text-secondary)' }}>Click để tải ảnh lên</span>
                  </>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
             </label>
             {thumbnail && (
               <button 
                 onClick={() => setThumbnail('')} 
                 className="btn-ghost"
                 style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.45rem', fontSize: '0.75rem', gap: '0.4rem' }}
               >
                 <Trash2 size={13} />
                 <span>Gỡ ảnh bìa</span>
               </button>
             )}
          </div>

          {/* Slug */}
          <div className="cms-sidebar-section">
            <label>ĐƯỜNG DẪN BÀI VIẾT (SLUG)</label>
            <input 
              type="text" 
              className="cms-input" 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              placeholder="VD: cac-tinh-nang-react-19" 
            />
          </div>

          {/* Category */}
          <div className="cms-sidebar-section">
            <label>DANH MỤC LƯU TRỮ</label>
            <select className="cms-select" value={category} onChange={e => setCategory(e.target.value)}>
               <option value="Tech">Technology (Tech)</option>
               <option value="AI">AI & Trí Tuệ Nhân Tạo</option>
               <option value="Frontend">Web & Frontend</option>
               <option value="Backend">Lập Trình Backend</option>
               <option value="DevLife">Developer Life</option>
               <option value="Tips">Thủ thuật (Tips & Tricks)</option>
               <option value="Hardware">Phần cứng (Hardware)</option>
               <option value="Cybersec">An toàn thông tin</option>
            </select>
          </div>

          {/* Excerpt */}
          <div className="cms-sidebar-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>TÓM TẮT (SEO EXCERPT)</label>
              <span style={{ fontSize: '0.7rem', color: 'var(--cms-text-muted)' }}>{excerpt.length}/160</span>
            </div>
            <textarea 
              className="cms-textarea" 
              value={excerpt} 
              onChange={e => setExcerpt(e.target.value)} 
              placeholder="Mô tả ngắn gọn hiển thị trên Google và thẻ bài viết..." 
            />
          </div>
          
          {/* Status Badge */}
          <div className="cms-sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid var(--cms-border-subtle)', paddingTop: '1rem' }}>
             <label>TRẠNG THÁI HIỆN TẠI</label>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: published ? '#10b981' : '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: published ? '#10b981' : '#f59e0b' }} />
               <span>{published ? 'ĐÃ XUẤT BẢN (PUBLIC)' : 'BẢN NHÁP (DRAFT)'}</span>
             </div>
          </div>
        </aside>

        {/* Workspace: Toolbar + Editor + Live Preview */}
        <div className="cms-workspace">
          {/* Markdown Formatting Toolbar */}
          <div className="cms-toolbar">
            <button className="cms-tool-btn" onClick={() => insertMarkdown('# ', '', 'Tiêu đề 1')} title="Heading 1">
              <Heading1 size={15} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('## ', '', 'Tiêu đề 2')} title="Heading 2">
              <Heading2 size={15} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('### ', '', 'Tiêu đề 3')} title="Heading 3">
              <Heading3 size={15} />
            </button>

            <div className="cms-tool-divider" />

            <button className="cms-tool-btn" onClick={() => insertMarkdown('**', '**', 'chữ in đậm')} title="In đậm (Bold)">
              <Bold size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('*', '*', 'chữ in nghiêng')} title="In nghiêng (Italic)">
              <Italic size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('> ', '', 'Trích dẫn...')} title="Trích dẫn (Quote)">
              <Quote size={14} />
            </button>

            <div className="cms-tool-divider" />

            <button className="cms-tool-btn" onClick={() => insertMarkdown('```javascript\n', '\n```', '// Mã nguồn code')} title="Khối Code">
              <Code size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('[', '](https://example.com)', 'Tên liên kết')} title="Chèn Liên Kết">
              <LinkIcon size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('![', '](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe)', 'Mô tả hình ảnh')} title="Chèn Ảnh">
              <ImageIcon size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('- ', '', 'Mục danh sách')} title="Danh Sách">
              <List size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('\n| Cột 1 | Cột 2 | Cột 3 |\n|---|---|---|\n| Dữ liệu 1 | Dữ liệu 2 | Dữ liệu 3 |\n')} title="Chèn Bảng">
              <TableIcon size={14} />
            </button>
          </div>

          {/* Editor & Preview Split Pane */}
          <div className={`cms-editor-pane mode-${viewMode}`}>
            {viewMode !== 'preview' && (
              <textarea 
                ref={textareaRef}
                className="cms-markdown-input" 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="# Bắt đầu viết nội dung bài viết bằng Markdown tại đây..." 
              />
            )}

            {viewMode !== 'editor' && (
              <div className="cms-preview-pane">
                 <div className="cms-preview-content">
                   {content ? (
                     <ReactMarkdown
                       remarkPlugins={[remarkGfm]}
                       components={{
                         code({node, inline, className, children, ...props}) {
                           const match = /language-(\w+)/.exec(className || '');
                           return !inline && match ? (
                             <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                               {String(children).replace(/\n$/, '')}
                             </SyntaxHighlighter>
                           ) : (
                             <code className={className} {...props}>{children}</code>
                           );
                         }
                       }}
                     >
                       {content}
                     </ReactMarkdown>
                   ) : (
                     <div style={{ color: 'var(--cms-text-muted)', textAlign: 'center', marginTop: '6rem' }}>
                       <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--cms-text-secondary)', marginBottom: '0.5rem' }}>BẢN XEM TRƯỚC BÀI VIẾT</div>
                       <p style={{ fontSize: '0.85rem' }}>Nội dung Markdown bạn gõ ở khung bên trái sẽ hiển thị trực tiếp và sinh động tại đây.</p>
                     </div>
                   )}
                 </div>
              </div>
            )}
          </div>

          {/* Floating Toast Notification */}
          <div className={`cms-floating-status ${statusMsg ? 'show' : ''}`}>
             <span>{statusMsg}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCMS;

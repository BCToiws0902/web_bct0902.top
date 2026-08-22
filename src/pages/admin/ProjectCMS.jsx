import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Trash2,
  Plus,
  Package,
  Tag
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import remarkGfm from 'remark-gfm';

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('cs', csharp);

import './ProjectCMS.css';

const ProjectCMS = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  // Core fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Camera Tool / Hardware Utility');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  
  // Visuals & Gallery
  const [thumbnail, setThumbnail] = useState('');
  const [galleryImages, setGalleryImages] = useState([]); // [{ url, caption }]
  
  // Action Links & Buttons
  const [demoUrl, setDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [actionButtonLabel, setActionButtonLabel] = useState('');
  
  // Tech Specs & Metadata
  const [tags, setTags] = useState('');
  const [platform, setPlatform] = useState('Windows 10/11');
  const [version, setVersion] = useState('v1.0.0');
  const [fileSize, setFileSize] = useState('~50 MB');
  const [views, setViews] = useState(0);

  // Publishing
  const [order, setOrder] = useState(1);
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  // UI State
  const [loading, setLoading] = useState(Boolean(id && id !== 'new'));
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'editor' | 'preview'

  const fetchProject = useCallback(async () => {
    try {
      const docSnap = await getDoc(doc(db, 'projects', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setSlug(data.id || id);
        setCategory(data.category || 'Camera Tool / Hardware Utility');
        setDescription(data.description || data.shortDescription || '');
        setContent(data.content || data.fullDescription || '');
        setThumbnail(data.thumbnail || data.coverImage || data.image || '');
        setGalleryImages(Array.isArray(data.galleryImages) ? data.galleryImages : []);
        setDemoUrl(data.demoUrl || '');
        setGithubUrl(data.githubUrl || '');
        setDownloadUrl(data.downloadUrl || '');
        setActionButtonLabel(data.actionButtonLabel || data.buttonText || '');
        setTags(Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''));
        setPlatform(data.platform || 'Windows 10/11');
        setVersion(data.version || 'v1.0.0');
        setFileSize(data.fileSize || '');
        setViews(Number(data.views) || 0);
        setOrder(Number(data.order) || 1);
        setFeatured(Boolean(data.featured));
        setPublished(data.published !== false);
      } else {
        alert('Không tìm thấy dự án này!');
        navigate('/admin');
      }
    } catch (err) {
      alert('Lỗi tải dự án: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchProject();
    } else {
      setLoading(false);
    }
  }, [id, fetchProject]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!id || id === 'new') {
      setSlug(generateSlug(val));
    }
  };

  const insertMarkdown = (prefix, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || placeholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxWidth = 1280;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.85));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setThumbnail(compressed);
      setStatusMsg('Đã tải ảnh bìa thành công!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch {
      alert('Lỗi xử lý ảnh bìa!');
    }
  };

  const handleAddGalleryImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      const caption = prompt('Nhập chú thích (caption) cho ảnh này:', 'Ảnh thực tế sản phẩm') || '';
      setGalleryImages(prev => [...prev, { url: compressed, caption }]);
    } catch {
      alert('Lỗi tải ảnh vào thư viện!');
    }
  };

  const handleInsertImageToArticle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      const alt = prompt('Nhập chú thích ảnh minh họa:', 'Ảnh minh họa chi tiết') || 'Hình ảnh thực tế';
      insertMarkdown(`\n\n![${alt}](${compressed})\n*${alt}*\n\n`);
    } catch {
      alert('Lỗi chèn ảnh vào bài viết!');
    }
  };

  const handleSave = async (isPublishing = true) => {
    if (!title.trim()) {
      alert('Vui lòng nhập Tên dự án!');
      return;
    }
    const finalSlug = slug.trim() || generateSlug(title) || 'project-' + Date.now().toString(36);
    const targetDocId = (id && id !== 'new') ? id : finalSlug;

    setSaving(true);
    setStatusMsg('Đang lưu dữ liệu dự án...');

    try {
      const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

      const projectData = {
        id: targetDocId,
        slug: targetDocId,
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        shortDescription: description.trim(),
        content: content.trim(),
        fullDescription: content.trim(),
        thumbnail: thumbnail.trim(),
        coverImage: thumbnail.trim(),
        galleryImages: galleryImages,
        demoUrl: demoUrl.trim(),
        githubUrl: githubUrl.trim(),
        downloadUrl: downloadUrl.trim(),
        actionButtonLabel: actionButtonLabel.trim(),
        tags: parsedTags,
        platform: platform.trim(),
        version: version.trim(),
        fileSize: fileSize.trim(),
        views: Number(views) || 0,
        order: Number(order) || 1,
        featured: Boolean(featured),
        published: Boolean(isPublishing),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'projects', targetDocId), projectData, { merge: true });

      setStatusMsg('✅ Đã lưu dự án thành công!');
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (err) {
      alert('Lỗi lưu dự án: ' + err.message);
      setStatusMsg('');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="project-cms-loading">
        <div className="spinner" />
        <p>Đang tải dữ liệu dự án...</p>
      </div>
    );
  }

  return (
    <div className="project-cms-container">
      {/* TOPBAR */}
      <header className="project-cms-header">
        <div className="header-left">
          <Link to="/admin" className="back-btn" title="Quay lại Admin Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className="cms-title-info">
            <h1>{id === 'new' ? 'Soạn Dự Án Mới' : `Chỉnh Sửa: ${title || id}`}</h1>
            <span className="cms-badge">{category}</span>
          </div>
        </div>

        <div className="header-actions">
          {statusMsg && <span className="status-msg">{statusMsg}</span>}
          
          <div className="view-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => setViewMode('editor')}
              title="Chỉ hiện Soạn thảo"
            >
              <Edit3 size={15} />
            </button>
            <button 
              className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Chia đôi màn hình (Split-View)"
            >
              <Columns size={15} />
            </button>
            <button 
              className={`mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Chỉ hiện Xem trước"
            >
              <Eye size={15} />
            </button>
          </div>

          <button 
            className="btn-cms-secondary" 
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save size={15} /> Lưu Nháp
          </button>
          <button 
            className="btn-cms-primary" 
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Send size={15} /> {saving ? 'Đang Lưu...' : 'Xuất Bản'}
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="project-cms-workspace">
        
        {/* LEFT SIDEBAR: METADATA & GALLERY */}
        <aside className="project-cms-sidebar">
          
          {/* SECTION 1: NHẬN DIỆN */}
          <div className="sidebar-group">
            <h3><Package size={16} /> 1. Thông Tin Nhận Diện</h3>
            <div className="form-item">
              <label>Tên dự án *</label>
              <input 
                type="text" 
                placeholder="VD: PTZ Controller Portable" 
                value={title} 
                onChange={handleTitleChange} 
              />
            </div>
            <div className="form-item">
              <label>Đường dẫn tĩnh (Slug / ID) *</label>
              <input 
                type="text" 
                placeholder="ptz-controller-portable" 
                value={slug} 
                onChange={(e) => setSlug(generateSlug(e.target.value))} 
              />
            </div>
            <div className="form-item">
              <label>Chuyên mục</label>
              <input 
                type="text" 
                placeholder="VD: Camera Tool, IoT / Hardware, iOS Jailbreak..." 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
              />
            </div>
            <div className="form-item">
              <label>Mô tả ngắn (Hiển thị thẻ Card ngoài trang chủ)</label>
              <textarea 
                rows={3} 
                placeholder="Tóm tắt ngắn gọn 1-2 câu về giải pháp và tính năng cốt lõi..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
          </div>

          {/* SECTION 2: ẢNH BÌA & GALLERY */}
          <div className="sidebar-group">
            <h3><ImageIcon size={16} /> 2. Ảnh Bìa 16:9 & Thư Viện Ảnh Thật</h3>
            <div className="form-item">
              <label>Ảnh bìa đại diện (Thumbnail / Cover)</label>
              <div className="cover-uploader">
                {thumbnail ? (
                  <div className="cover-preview-wrapper">
                    <img src={thumbnail} alt="Cover preview" />
                    <button className="remove-cover-btn" onClick={() => setThumbnail('')} title="Xóa ảnh"><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <label className="upload-dropzone">
                    <Upload size={22} />
                    <span>Tải ảnh bìa 16:9 từ máy</span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
                  </label>
                )}
                <input 
                  type="text" 
                  placeholder="Hoặc dán URL ảnh trực tiếp..." 
                  value={thumbnail} 
                  onChange={(e) => setThumbnail(e.target.value)} 
                  style={{ marginTop: '0.45rem' }}
                />
              </div>
            </div>

            {/* GALLERY MANAGER */}
            <div className="form-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ margin: 0 }}>Bộ sưu tập ảnh thực tế ({galleryImages.length})</label>
                <label className="btn-add-gallery">
                  <Plus size={13} /> Thêm ảnh thật
                  <input type="file" accept="image/*" onChange={handleAddGalleryImage} hidden />
                </label>
              </div>
              <div className="gallery-grid-preview">
                {galleryImages.map((g, idx) => (
                  <div key={idx} className="gallery-thumb-item">
                    <img src={g.url} alt={g.caption || 'Gallery photo'} />
                    <span className="gallery-caption-badge">{g.caption || `Ảnh #${idx + 1}`}</span>
                    <button 
                      type="button"
                      className="btn-del-thumb" 
                      onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                      title="Xóa ảnh này"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: LIÊN KẾT HÀNH ĐỘNG */}
          <div className="sidebar-group">
            <h3><LinkIcon size={16} /> 3. Bộ Liên Kết & Nút Bấm</h3>
            <div className="form-item">
              <label>Tên nút hành động chính (Tùy biến)</label>
              <input 
                type="text" 
                placeholder="VD: Truy Cập Web App, Tải Bản .EXE, Thêm Vào Cydia..." 
                value={actionButtonLabel} 
                onChange={(e) => setActionButtonLabel(e.target.value)} 
              />
            </div>
            <div className="form-item">
              <label>Link Live Demo / Ứng dụng Web</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={demoUrl} 
                onChange={(e) => setDemoUrl(e.target.value)} 
              />
            </div>
            <div className="form-item">
              <label>Link Mã Nguồn GitHub</label>
              <input 
                type="text" 
                placeholder="https://github.com/..." 
                value={githubUrl} 
                onChange={(e) => setGithubUrl(e.target.value)} 
              />
            </div>
            <div className="form-item">
              <label>Link Tải Xuống File Cài Đặt (.exe, .zip, .deb)</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={downloadUrl} 
                onChange={(e) => setDownloadUrl(e.target.value)} 
              />
            </div>
          </div>

          {/* SECTION 4: THÔNG SỐ KỸ THUẬT */}
          <div className="sidebar-group">
            <h3><Tag size={16} /> 4. Thông Số Kỹ Thuật (Tech Specs)</h3>
            <div className="form-item">
              <label>Thẻ công nghệ (Tags, phân cách bằng dấu phẩy)</label>
              <input 
                type="text" 
                placeholder="C#, .NET WinForms, VISCA Serial, Always-On-Top" 
                value={tags} 
                onChange={(e) => setTags(e.target.value)} 
              />
            </div>
            <div className="form-row-2">
              <div className="form-item">
                <label>Hệ điều hành / Nền tảng</label>
                <input 
                  type="text" 
                  placeholder="Windows 10/11" 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)} 
                />
              </div>
              <div className="form-item">
                <label>Phiên bản</label>
                <input 
                  type="text" 
                  placeholder="v1.0.0" 
                  value={version} 
                  onChange={(e) => setVersion(e.target.value)} 
                />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-item">
                <label>Dung lượng file</label>
                <input 
                  type="text" 
                  placeholder="~50 MB" 
                  value={fileSize} 
                  onChange={(e) => setFileSize(e.target.value)} 
                />
              </div>
              <div className="form-item">
                <label>Thứ tự sắp xếp (STT)</label>
                <input 
                  type="number" 
                  value={order} 
                  onChange={(e) => setOrder(Number(e.target.value))} 
                />
              </div>
            </div>
            <div className="form-checkbox-row">
              <label>
                <input 
                  type="checkbox" 
                  checked={featured} 
                  onChange={(e) => setFeatured(e.target.checked)} 
                />
                ⭐ Ghim nổi bật trang chủ
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={published} 
                  onChange={(e) => setPublished(e.target.checked)} 
                />
                🌐 Công khai hiển thị
              </label>
            </div>
          </div>
        </aside>

        {/* CENTER / RIGHT: MARKDOWN STUDIO & LIVE PREVIEW */}
        <main className={`project-cms-editor-area mode-${viewMode}`}>
          
          {/* EDITOR PANE */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className="editor-pane">
              {/* TOOLBAR */}
              <div className="markdown-toolbar">
                <button type="button" onClick={() => insertMarkdown('## ', '', 'Tiêu Đề Mục')} title="Tiêu đề H2"><Heading2 size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('### ', '', 'Tiêu Đề Nhỏ')} title="Tiêu đề H3"><Heading3 size={16} /></button>
                <span className="toolbar-divider" />
                <button type="button" onClick={() => insertMarkdown('**', '**', 'chữ đậm')} title="In đậm"><Bold size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('*', '*', 'chữ nghiêng')} title="In nghiêng"><Italic size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('> ', '', 'Đoạn trích dẫn hoặc lưu ý')} title="Trích dẫn"><Quote size={16} /></button>
                <span className="toolbar-divider" />
                <button type="button" onClick={() => insertMarkdown('```csharp\n', '\n```', '// Code snippet')} title="Khối lệnh Code"><Code size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('[', '](https://...)', 'Tên liên kết')} title="Chèn Link"><LinkIcon size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('- ', '', 'Tính năng 1\n- Tính năng 2')} title="Danh sách"><List size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('| Thông Số | Chi Tiết |\n| :--- | :--- |\n| CPU | Dual-Core |\n| RAM | 4GB |\n')} title="Bảng so sánh"><TableIcon size={16} /></button>
                <span className="toolbar-divider" />
                <label className="toolbar-upload-btn" title="Tải ảnh minh họa chèn vào bài viết">
                  <ImageIcon size={16} /> <span>Chèn ảnh thực tế</span>
                  <input type="file" accept="image/*" onChange={handleInsertImageToArticle} hidden />
                </label>
              </div>

              <textarea 
                ref={textareaRef}
                className="markdown-textarea"
                placeholder={`# Giới thiệu chi tiết dự án\n\nViết bài viết chi tiết, giới thiệu vấn đề, giải pháp, công nghệ sử dụng và các hình ảnh chụp thật của sản phẩm...\n\n![Ảnh chụp thực tế](/link-anh.png)\n*Hình 1: Chú thích ảnh thực tế...*`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {/* PREVIEW PANE */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="preview-pane">
              <div className="preview-header-bar">
                <span>👁️ Xem Trước Thực Tế (Live Preview)</span>
                <span className="live-tag">Trực tiếp</span>
              </div>
              
              <div className="preview-content-rendered">
                {/* HERO PREVIEW */}
                <div className="preview-project-hero">
                  {thumbnail && (
                    <div className="preview-cover-box">
                      <img src={thumbnail} alt={title || 'Cover'} />
                    </div>
                  )}
                  <div className="preview-meta-chips">
                    <span className="chip-cat">{category}</span>
                    {version && <span className="chip-ver">{version}</span>}
                    {platform && <span className="chip-plat">💻 {platform}</span>}
                  </div>
                  <h1 className="preview-hero-title">{title || 'Tên Dự Án Chưa Đặt'}</h1>
                  <p className="preview-hero-desc">{description || 'Mô tả ngắn của dự án sẽ hiển thị tại đây...'}</p>
                </div>

                {/* GALLERY PREVIEW CAROUSEL */}
                {galleryImages.length > 0 && (
                  <div className="preview-gallery-section">
                    <h4>📸 Bộ Sưu Tập Ảnh Thực Tế ({galleryImages.length})</h4>
                    <div className="preview-gallery-scroll">
                      {galleryImages.map((g, i) => (
                        <div key={i} className="preview-gallery-card">
                          <img src={g.url} alt={g.caption} />
                          {g.caption && <div className="caption">{g.caption}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MARKDOWN BODY */}
                <div className="preview-markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {content || '*Chưa có nội dung bài viết. Hãy soạn thảo ở khung bên trái...*'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ProjectCMS;
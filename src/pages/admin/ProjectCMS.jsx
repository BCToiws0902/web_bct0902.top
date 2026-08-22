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
        alert('Project not found!');
        navigate('/admin');
      }
    } catch (err) {
      alert('Error loading project: ' + err.message);
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

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnail(event.target.result);
      setStatusMsg('Cover image loaded!');
      setTimeout(() => setStatusMsg(''), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleAddGalleryImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const caption = prompt('Enter a short caption for this photo (optional):') || '';
      setGalleryImages(prev => [...prev, { url: event.target.result, caption }]);
      setStatusMsg('Gallery photo added!');
      setTimeout(() => setStatusMsg(''), 2500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const insertMarkdown = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || defaultText;
    const replacement = prefix + selected + suffix;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const handleInsertImageToArticle = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const caption = prompt('Image description caption:') || 'Product Image';
      const imgMarkdown = `\n\n![${caption}](${event.target.result})\n*${caption}*\n\n`;
      insertMarkdown(imgMarkdown, '', '');
      setStatusMsg('Image inserted into markdown!');
      setTimeout(() => setStatusMsg(''), 2500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async (publishState = published) => {
    if (!title.trim()) {
      alert('Please enter a project title!');
      return;
    }
    const finalSlug = slug.trim() || generateSlug(title);
    if (!finalSlug) {
      alert('Invalid project slug/ID!');
      return;
    }

    setSaving(true);
    setStatusMsg('Saving to database...');

    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

      const projectData = {
        title: title.trim(),
        id: finalSlug,
        slug: finalSlug,
        category: category.trim() || 'Software Tool',
        description: description.trim(),
        content: content.trim(),
        thumbnail: thumbnail.trim(),
        galleryImages: galleryImages,
        demoUrl: demoUrl.trim(),
        githubUrl: githubUrl.trim(),
        downloadUrl: downloadUrl.trim(),
        actionButtonLabel: actionButtonLabel.trim(),
        tags: tagList,
        platform: platform.trim(),
        version: version.trim(),
        fileSize: fileSize.trim(),
        views: Number(views) || 0,
        order: Number(order) || 1,
        featured: Boolean(featured),
        published: Boolean(publishState),
        updatedAt: new Date().toISOString()
      };

      if (!id || id === 'new') {
        projectData.createdAt = new Date().toISOString();
      }

      await setDoc(doc(db, 'projects', finalSlug), projectData, { merge: true });

      setStatusMsg(publishState ? 'Published successfully!' : 'Draft saved successfully!');
      setTimeout(() => {
        navigate('/admin');
      }, 1200);
    } catch (err) {
      alert('Save error: ' + err.message);
      setStatusMsg('Error saving project.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="project-cms-loading">
        <div className="spinner" />
        <p>Loading project workspace...</p>
      </div>
    );
  }

  return (
    <div className="project-cms-container">
      {/* TOPBAR */}
      <header className="project-cms-header">
        <div className="header-left">
          <Link to="/admin" className="back-btn" title="Back to Admin Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className="cms-title-info">
            <h1>{id === 'new' ? 'New Project Case Study' : `Editing: ${title || id}`}</h1>
            <span className="cms-badge">{category}</span>
          </div>
        </div>

        <div className="header-actions">
          {statusMsg && <span className="status-msg">{statusMsg}</span>}
          
          <div className="view-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => setViewMode('editor')}
              title="Editor Only"
            >
              <Edit3 size={15} />
            </button>
            <button 
              className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Split View"
            >
              <Columns size={15} />
            </button>
            <button 
              className={`mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Preview Only"
            >
              <Eye size={15} />
            </button>
          </div>

          <button 
            className="btn-cms-secondary" 
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            <Save size={15} /> Save Draft
          </button>
          <button 
            className="btn-cms-primary" 
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <Send size={15} /> {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="project-cms-workspace">
        
        {/* LEFT SIDEBAR: METADATA & GALLERY */}
        <aside className="project-cms-sidebar">
          
          {/* SECTION 1: IDENTITY */}
          <div className="sidebar-group">
            <h3><Package size={16} /> 1. Project Identity</h3>
            <div className="form-item">
              <label>Project Title *</label>
              <input 
                type="text" 
                placeholder="e.g. PTZ Controller Portable" 
                value={title} 
                onChange={handleTitleChange} 
              />
            </div>
            <div className="form-item">
              <label>Static Slug / URL ID *</label>
              <input 
                type="text" 
                placeholder="ptz-controller-portable" 
                value={slug} 
                onChange={(e) => setSlug(generateSlug(e.target.value))} 
              />
            </div>
            <div className="form-item">
              <label>Category</label>
              <input 
                type="text" 
                placeholder="e.g. Camera Tool, IoT / Hardware, iOS Jailbreak..." 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
              />
            </div>
            <div className="form-item">
              <label>Short Description (Card summary on home & showcase)</label>
              <textarea 
                rows={3} 
                placeholder="Brief 1-2 sentence overview of the solution and core features..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
          </div>

          {/* SECTION 2: COVER & GALLERY */}
          <div className="sidebar-group">
            <h3><ImageIcon size={16} /> 2. 16:9 Cover & Gallery</h3>
            <div className="form-item">
              <label>Cover / Thumbnail Image</label>
              <div className="cover-uploader">
                {thumbnail ? (
                  <div className="cover-preview-wrapper">
                    <img src={thumbnail} alt="Cover preview" />
                    <button className="remove-cover-btn" onClick={() => setThumbnail('')} title="Remove image"><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <label className="upload-dropzone">
                    <Upload size={22} />
                    <span>Upload 16:9 Cover Image</span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
                  </label>
                )}
                <input 
                  type="text" 
                  placeholder="Or paste direct image URL..." 
                  value={thumbnail} 
                  onChange={(e) => setThumbnail(e.target.value)} 
                  style={{ marginTop: '0.45rem' }}
                />
              </div>
            </div>

            {/* GALLERY MANAGER */}
            <div className="form-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ margin: 0 }}>Product Gallery Photos ({galleryImages.length})</label>
                <label className="btn-add-gallery">
                  <Plus size={13} /> Add Photo
                  <input type="file" accept="image/*" onChange={handleAddGalleryImage} hidden />
                </label>
              </div>
              <div className="gallery-grid-preview">
                {galleryImages.map((g, idx) => (
                  <div key={idx} className="gallery-thumb-item">
                    <img src={g.url} alt={g.caption || 'Gallery photo'} />
                    <span className="gallery-caption-badge">{g.caption || `Photo #${idx + 1}`}</span>
                    <button 
                      type="button"
                      className="btn-del-thumb" 
                      onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                      title="Delete photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: ACTION BUTTONS & LINKS */}
          <div className="sidebar-group">
            <h3><LinkIcon size={16} /> 3. Actions & Links</h3>
            <div className="form-item">
              <label>Custom Main Button Label (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Open Web App, Download .EXE, View on GitHub..." 
                value={actionButtonLabel} 
                onChange={(e) => setActionButtonLabel(e.target.value)} 
              />
            </div>
            <div className="form-item">
              <label>Live Demo / Web App URL</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={demoUrl} 
                onChange={(e) => setDemoUrl(e.target.value)} 
              />
            </div>
            <div className="form-item">
              <label>GitHub Repository URL</label>
              <input 
                type="text" 
                placeholder="https://github.com/..." 
                value={githubUrl} 
                onChange={(e) => setGithubUrl(e.target.value)} 
              />
            </div>
            <div className="form-item">
              <label>Direct Download Link (.exe, .zip, .deb)</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={downloadUrl} 
                onChange={(e) => setDownloadUrl(e.target.value)} 
              />
            </div>
          </div>

          {/* SECTION 4: TECH SPECS & METADATA */}
          <div className="sidebar-group">
            <h3><Tag size={16} /> 4. Tech Specifications</h3>
            <div className="form-item">
              <label>Tech Stack Tags (Comma separated)</label>
              <input 
                type="text" 
                placeholder="C#, .NET WinForms, VISCA Serial, Always-On-Top" 
                value={tags} 
                onChange={(e) => setTags(e.target.value)} 
              />
            </div>
            <div className="form-row-2">
              <div className="form-item">
                <label>Platform / OS</label>
                <input 
                  type="text" 
                  placeholder="Windows 10/11" 
                  value={platform} 
                  onChange={(e) => setPlatform(e.target.value)} 
                />
              </div>
              <div className="form-item">
                <label>Version</label>
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
                <label>File Size</label>
                <input 
                  type="text" 
                  placeholder="~50 MB" 
                  value={fileSize} 
                  onChange={(e) => setFileSize(e.target.value)} 
                />
              </div>
              <div className="form-item">
                <label>Display Order (Priority)</label>
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
                ⭐ Feature on Homepage
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={published} 
                  onChange={(e) => setPublished(e.target.checked)} 
                />
                🌐 Publicly Visible
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
                <button type="button" onClick={() => insertMarkdown('## ', '', 'Section Title')} title="Heading 2"><Heading2 size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('### ', '', 'Subsection')} title="Heading 3"><Heading3 size={16} /></button>
                <span className="toolbar-divider" />
                <button type="button" onClick={() => insertMarkdown('**', '**', 'bold text')} title="Bold"><Bold size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('*', '*', 'italic text')} title="Italic"><Italic size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('> ', '', 'Callout note or quote')} title="Quote"><Quote size={16} /></button>
                <span className="toolbar-divider" />
                <button type="button" onClick={() => insertMarkdown('```csharp\n', '\n```', '// Code snippet')} title="Code Block"><Code size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('[', '](https://...)', 'Link text')} title="Insert Link"><LinkIcon size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('- ', '', 'Feature 1\n- Feature 2')} title="Bullet List"><List size={16} /></button>
                <button type="button" onClick={() => insertMarkdown('| Feature | Specification |\n| :--- | :--- |\n| CPU | Dual-Core |\n| RAM | 4GB |\n')} title="Table"><TableIcon size={16} /></button>
                <span className="toolbar-divider" />
                <label className="toolbar-upload-btn" title="Upload illustration image to article">
                  <ImageIcon size={16} /> <span>Insert Photo</span>
                  <input type="file" accept="image/*" onChange={handleInsertImageToArticle} hidden />
                </label>
              </div>

              <textarea 
                ref={textareaRef}
                className="markdown-textarea"
                placeholder={`# Project Overview\n\nWrite detailed case study documentation, problem analysis, architecture overview, and embed images...\n\n![Screenshot](/path-to-image.png)\n*Figure 1: Application interface.*`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {/* PREVIEW PANE */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="preview-pane">
              <div className="preview-header-bar">
                <span>👁️ Live Preview</span>
                <span className="live-tag">Live</span>
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
                  <h1 className="preview-hero-title">{title || 'Untitled Project'}</h1>
                  <p className="preview-hero-desc">{description || 'Short project description will appear here...'}</p>
                </div>

                {/* GALLERY PREVIEW CAROUSEL */}
                {galleryImages.length > 0 && (
                  <div className="preview-gallery-section">
                    <h4>📸 Product Gallery ({galleryImages.length})</h4>
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
                      code({ _node, inline, className, children, ...props }) {
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
                    {content || '*No content yet. Start writing in the editor pane on the left...*'}
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
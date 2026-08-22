import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
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
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);

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

  const fetchPost = useCallback(async () => {
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
        alert('Article not found!');
        navigate('/admin');
      }
    } catch (err) {
      alert('Error loading article: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id !== 'new') {
      fetchPost();
    }
  }, [id, fetchPost]);

  useEffect(() => {
    if (title && !slug && id === 'new') {
      const generatedSlug = title.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim().replace(/\s+/g, "-");
      setSlug(generatedSlug);
    }
  }, [title, slug, id]);

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const handleSave = async (isPublishing = false) => {
    if (!title.trim() || !content.trim()) {
      alert("Please provide both Title and Content for the article.");
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
        date: new Date().toLocaleDateString('en-US'),
        timestamp: new Date(),
        author: 'BCT0902 Admin'
      };

      await setDoc(doc(db, 'blog_posts', targetId), postData, { merge: true });
      setPublished(isPublishing);
      showStatus(isPublishing ? "✅ PUBLISHED SUCCESSFULLY!" : "💾 DRAFT SAVED SUCCESSFULLY!");
      
      if (id === 'new') {
        window.history.replaceState(null, '', `/admin/cms/${targetId}`);
      }
    } catch (err) {
      console.error(err);
      showStatus("❌ ERROR SAVING: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const insertMarkdown = (before, after = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selectedText = previousText.substring(start, end) || defaultText;

    const newText = previousText.substring(0, start) + before + selectedText + after + previousText.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 50);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setThumbnail(uploadEvent.target.result);
        showStatus("Cover image loaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="cms-loading-screen">
        <div className="cms-spinner" />
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="cms-container">
      {/* Top Header */}
      <header className="cms-header">
        <div className="cms-header-left">
          <button className="cms-icon-btn" onClick={() => navigate('/admin')} title="Back to Admin">
            <ArrowLeft size={18} />
          </button>
          <div className="cms-title-wrapper">
            <input 
              type="text" 
              className="cms-title-input" 
              placeholder="Article title here..." 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>
        </div>

        <div className="cms-header-right">
          {/* Mode switch */}
          <div className="cms-view-modes">
            <button 
              className={`cms-view-mode-tab ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Split View"
            >
              <Columns size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              <span>Split</span>
            </button>
            <button 
              className={`cms-view-mode-tab ${viewMode === 'editor' ? 'active' : ''}`}
              onClick={() => setViewMode('editor')}
              title="Editor Only"
            >
              <Edit3 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              <span>Editor</span>
            </button>
            <button 
              className={`cms-view-mode-tab ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
              title="Preview Only"
            >
              <Eye size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              <span>Preview</span>
            </button>
          </div>

          <button className="cms-btn draft" disabled={saving} onClick={() => handleSave(false)}>
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button className="cms-btn publish" disabled={saving} onClick={() => handleSave(true)}>
            <Send size={15} />
            <span>Publish Now</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="cms-body">
        {/* Left Sidebar Settings */}
        <aside className="cms-sidebar">
          {/* Cover Image */}
          <div className="cms-sidebar-section">
             <label>COVER IMAGE</label>
             <label className="cms-img-uploader" style={{ backgroundImage: thumbnail ? `url(${thumbnail})` : 'none' }}>
                {!thumbnail && (
                  <>
                    <Upload size={22} style={{ color: 'var(--cms-text-secondary)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--cms-text-secondary)' }}>Click to upload cover</span>
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
                 <span>Remove Cover</span>
               </button>
             )}
          </div>

          {/* Slug */}
          <div className="cms-sidebar-section">
            <label>ARTICLE SLUG / ID</label>
            <input 
              type="text" 
              className="cms-input" 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              placeholder="e.g. react-19-features" 
            />
          </div>

          {/* Category */}
          <div className="cms-sidebar-section">
            <label>CATEGORY</label>
            <select className="cms-select" value={category} onChange={e => setCategory(e.target.value)}>
               <option value="Tech">Technology (Tech)</option>
               <option value="AI">AI & Intelligence</option>
               <option value="Frontend">Frontend & Web</option>
               <option value="Backend">Backend Engineering</option>
               <option value="DevLife">Developer Life</option>
               <option value="Tips">Tips & Tricks</option>
               <option value="Hardware">Hardware & IoT</option>
               <option value="Cybersec">Cybersecurity</option>
            </select>
          </div>

          {/* Excerpt */}
          <div className="cms-sidebar-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>SEO EXCERPT</label>
              <span style={{ fontSize: '0.7rem', color: 'var(--cms-text-muted)' }}>{excerpt.length}/160</span>
            </div>
            <textarea 
              className="cms-textarea" 
              value={excerpt} 
              onChange={e => setExcerpt(e.target.value)} 
              placeholder="Short description displayed on search results and post cards..." 
            />
          </div>
          
          {/* Status Badge */}
          <div className="cms-sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid var(--cms-border-subtle)', paddingTop: '1rem' }}>
             <label>PUBLICATION STATUS</label>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: published ? '#10b981' : '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: published ? '#10b981' : '#f59e0b' }} />
               <span>{published ? 'PUBLIC' : 'DRAFT'}</span>
             </div>
          </div>
        </aside>

        {/* Workspace: Toolbar + Editor + Live Preview */}
        <div className="cms-workspace">
          {/* Markdown Formatting Toolbar */}
          <div className="cms-toolbar">
            <button className="cms-tool-btn" onClick={() => insertMarkdown('# ', '', 'Heading 1')} title="Heading 1">
              <Heading1 size={15} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('## ', '', 'Heading 2')} title="Heading 2">
              <Heading2 size={15} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('### ', '', 'Heading 3')} title="Heading 3">
              <Heading3 size={15} />
            </button>

            <div className="cms-tool-divider" />

            <button className="cms-tool-btn" onClick={() => insertMarkdown('**', '**', 'bold text')} title="Bold">
              <Bold size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('*', '*', 'italic text')} title="Italic">
              <Italic size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('> ', '', 'Quote or callout...')} title="Quote">
              <Quote size={14} />
            </button>

            <div className="cms-tool-divider" />

            <button className="cms-tool-btn" onClick={() => insertMarkdown('```javascript\n', '\n```', '// Source code snippet')} title="Code Block">
              <Code size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('[', '](https://example.com)', 'Link description')} title="Insert Link">
              <LinkIcon size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('![', '](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe)', 'Image caption')} title="Insert Image">
              <ImageIcon size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('- ', '', 'List item')} title="Bullet List">
              <List size={14} />
            </button>
            <button className="cms-tool-btn" onClick={() => insertMarkdown('\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Data 1 | Data 2 | Data 3 |\n')} title="Insert Table">
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
                placeholder="# Start writing markdown content here..." 
              />
            )}

            {viewMode !== 'editor' && (
              <div className="cms-preview-pane">
                 <div className="cms-preview-content">
                   {content ? (
                     <ReactMarkdown
                       remarkPlugins={[remarkGfm]}
                       components={{
                         code({_node, inline, className, children, ...props}) {
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
                       <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--cms-text-secondary)', marginBottom: '0.5rem' }}>LIVE PREVIEW</div>
                       <p style={{ fontSize: '0.85rem' }}>Markdown text from the editor pane will be rendered live here.</p>
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

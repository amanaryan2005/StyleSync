import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Palette, Type, Layout, Activity, Lock, Unlock, Zap, Download } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:5000/api/projects';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  // Local state for interactive editing before saving
  const [tokens, setTokens] = useState(null);
  const [lockedTokens, setLockedTokens] = useState({
    colors: false,
    typography: false,
    spacing: false
  });

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate network delay for "analyzing DOM tree" effect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await axios.post(`${API_URL}/extract`, { url });
      setProject(response.data);
      setTokens(response.data.tokens);
    } catch (err) {
      setError('Failed to extract design tokens. Please check the URL and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenChange = (category, key, value) => {
    if (lockedTokens[category]) return;

    setTokens(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!project) return;
    
    try {
      const response = await axios.put(`${API_URL}/${project._id}`, { tokens });
      setProject(response.data);
      alert('Design system versions saved!');
    } catch (err) {
      console.error('Failed to save', err);
    }
  };

  const toggleLock = (category) => {
    setLockedTokens(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <Zap size={24} color="#6366f1" />
          StyleSync
        </div>
        <div className="nav-actions">
          {project && (
            <button className="btn btn-primary" onClick={handleSave}>
              <Download size={16} /> Save Version
            </button>
          )}
        </div>
      </nav>

      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <form onSubmit={handleExtract} className="url-bar">
          <input
            type="url"
            className="url-input"
            placeholder="Paste any website URL (e.g., https://stripe.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="url-submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Extract Design'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '0 2rem', color: 'var(--danger)', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {loading && !tokens && (
         <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
           <div className="loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
             <Activity size={48} color="#6366f1" />
             <p style={{ color: 'var(--text-secondary)' }}>Parsing DOM tree & extracting styles...</p>
           </div>
         </div>
      )}

      {tokens && (
        <main className="dashboard">
          <aside className="sidebar">
            {/* Color Tokens */}
            <div className={`token-section ${lockedTokens.colors ? 'locked' : ''}`}>
              <div className="section-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Palette size={18} /> Colors
                </span>
                <button 
                  className="btn" 
                  style={{ padding: '4px', background: 'transparent' }} 
                  onClick={() => toggleLock('colors')}
                >
                  {lockedTokens.colors ? <Lock size={16} color="var(--accent-color)" /> : <Unlock size={16} />}
                </button>
              </div>
              
              {Object.entries(tokens.colors).map(([key, value]) => (
                <div className="input-group" key={key}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{textTransform: 'capitalize'}}>{key}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="color" 
                      value={value}
                      onChange={(e) => handleTokenChange('colors', key, e.target.value)}
                      disabled={lockedTokens.colors}
                      style={{ 
                        width: '40px', height: '40px', padding: '0', 
                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                        background: 'transparent'
                      }}
                    />
                    <input 
                      type="text" 
                      className="input-field" 
                      value={value}
                      onChange={(e) => handleTokenChange('colors', key, e.target.value)}
                      disabled={lockedTokens.colors}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Typography Tokens */}
            <div className="token-section">
              <div className="section-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Type size={18} /> Typography
                </span>
              </div>
              {Object.entries(tokens.typography).map(([key, value]) => (
                <div className="input-group" key={key}>
                  <label style={{textTransform: 'capitalize'}}>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={value}
                    onChange={(e) => handleTokenChange('typography', key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Spacing Tokens */}
            <div className="token-section">
              <div className="section-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layout size={18} /> Spacing
                </span>
              </div>
              {Object.entries(tokens.spacing).map(([key, value]) => (
                <div className="input-group" key={key}>
                  <label style={{textTransform: 'capitalize'}}>{key}</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={value}
                    onChange={(e) => handleTokenChange('spacing', key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </aside>

          {/* Component Preview Grid */}
          <section className="preview-area" style={{
            // Apply tokens as CSS variables for live preview
            '--preview-primary': tokens.colors.primary,
            '--preview-secondary': tokens.colors.secondary,
            '--preview-bg': tokens.colors.background,
            '--preview-text': tokens.colors.text,
            '--preview-font-heading': tokens.typography.headingFont,
            '--preview-font-body': tokens.typography.bodyFont,
            '--preview-base-size': tokens.typography.baseSize,
            '--preview-spacing': tokens.spacing.base,
          }}>
            <div style={{ 
              background: 'var(--preview-bg)', 
              color: 'var(--preview-text)',
              fontFamily: 'var(--preview-font-body)',
              fontSize: 'var(--preview-base-size)',
              padding: '2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <h1 style={{ fontFamily: 'var(--preview-font-heading)', marginBottom: '1rem', color: 'var(--preview-text)' }}>
                Live Component Preview
              </h1>
              <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
                This card inherits the extracted design system tokens. Changes made in the sidebar instantly reflect here via CSS custom properties.
              </p>
              
              <div className="preview-grid">
                {/* Buttons Component */}
                <div className="preview-card" style={{ background: 'var(--preview-bg)', borderColor: 'var(--preview-text)' }}>
                  <h3>Buttons</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--preview-spacing)' }}>
                    <button style={{ 
                      background: 'var(--preview-primary)', color: '#fff', 
                      padding: 'calc(var(--preview-spacing) * 1) calc(var(--preview-spacing) * 2)',
                      border: 'none', borderRadius: '4px', cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}>Primary</button>
                    
                    <button style={{ 
                      background: 'transparent', color: 'var(--preview-secondary)', 
                      border: '1px solid var(--preview-secondary)',
                      padding: 'calc(var(--preview-spacing) * 1) calc(var(--preview-spacing) * 2)',
                      borderRadius: '4px', cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}>Secondary</button>
                  </div>
                </div>

                {/* Form Input Component */}
                <div className="preview-card" style={{ background: 'var(--preview-bg)', borderColor: 'var(--preview-text)' }}>
                  <h3>Inputs</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--preview-spacing)' }}>
                    <input type="text" placeholder="Default Input" style={{
                      padding: 'var(--preview-spacing)',
                      border: '1px solid currentColor',
                      opacity: 0.3,
                      borderRadius: '4px',
                      background: 'transparent',
                      color: 'inherit',
                      fontFamily: 'inherit'
                    }} />
                    <input type="text" value="Focused Input" readOnly style={{
                      padding: 'var(--preview-spacing)',
                      border: '2px solid var(--preview-primary)',
                      borderRadius: '4px',
                      background: 'transparent',
                      color: 'inherit',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }} />
                  </div>
                </div>

                {/* Typography Specimen */}
                <div className="preview-card" style={{ background: 'var(--preview-bg)', borderColor: 'var(--preview-text)' }}>
                  <h3>Typography</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontFamily: 'var(--preview-font-heading)', fontSize: '1.5em', fontWeight: 'bold' }}>Heading 1</div>
                    <div style={{ fontFamily: 'var(--preview-font-heading)', fontSize: '1.25em', fontWeight: '600' }}>Heading 2</div>
                    <div style={{ fontFamily: 'var(--preview-font-body)' }}>Body text sample displaying the selected typography tokens.</div>
                    <div style={{ fontFamily: 'var(--preview-font-body)', fontSize: '0.8em', opacity: 0.7 }}>Caption and small text</div>
                  </div>
                </div>

                {/* Color Palette Specimen */}
                <div className="preview-card" style={{ background: 'var(--preview-bg)', borderColor: 'var(--preview-text)' }}>
                  <h3>Brand Colors</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[
                      { name: 'Primary', color: 'var(--preview-primary)' },
                      { name: 'Secondary', color: 'var(--preview-secondary)' },
                      { name: 'Background', color: 'var(--preview-bg)' },
                      { name: 'Text', color: 'var(--preview-text)' },
                    ].map(swatch => (
                      <div key={swatch.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', 
                          background: swatch.color, border: '1px solid #ddd' 
                        }} />
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>{swatch.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;

import React from 'react';
import { Box } from 'lucide-react';

export const APP_PRESET_LOGOS = [
  {
    name: 'Antigravity',
    color: '#00d2ff',
    renderIcon: (props) => (
      <svg viewBox="0 0 100 100" fill="none" {...props}>
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" opacity="0.5" />
        <path d="M50 20L25 75h10L50 40l15 35h10L50 20z" fill="currentColor" />
        <circle cx="50" cy="50" r="10" fill="currentColor" />
      </svg>
    )
  },
  {
    name: 'Apple',
    color: '#000000',
    renderIcon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.67-1.48 3.671-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.605 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82-.78.897-1.467 2.338-1.284 3.71.1.01.196.013.303.013 1.104 0 2.438-.7 3.268-1.713z"/>
      </svg>
    )
  },
  {
    name: 'Microsoft',
    color: '#F25022',
    renderIcon: (props) => (
      <svg viewBox="0 0 23 23" {...props}>
        <path fill="#f25022" d="M0 0h11v11H0z"/><path fill="#7fba00" d="M12 0h11v11H12z"/><path fill="#00a4ef" d="M0 12h11v11H0z"/><path fill="#ffb900" d="M12 12h11v11H12z"/>
      </svg>
    )
  },
  {
    name: 'Office 365',
    color: '#D83B01',
    renderIcon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M22.083 4.25l-10.25-3.083c-.342-.1-.667.158-.667.508v20.667c0 .35.325.608.667.508l10.25-3.083c.25-.075.417-.3.417-.558V4.808c0-.258-.167-.483-.417-.558zM1.917 19.75l10.25 3.083c.342.1.667-.158.667-.508V1.675c0-.35-.325-.608-.667-.508L1.917 4.25c-.25.075-.417.3-.417.558v14.384c0 .258.167.483.417.558z" fill="#D83B01"/>
      </svg>
    )
  },
  {
    name: 'Vercel',
    color: '#000000',
    renderIcon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M24 22.525H0L12 1.475L24 22.525Z"/>
      </svg>
    )
  },
  {
    name: 'Github',
    color: '#181717',
    renderIcon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    )
  },
  {
    name: 'Canva',
    color: '#00c4cc',
    renderIcon: () => (
      <img src="/Canva.svg" alt="Canva" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    name: 'Brave',
    color: '#fb542b',
    renderIcon: () => (
      <img src="/brave.svg" alt="Brave" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    name: 'iNet',
    color: '#F26522',
    renderIcon: (props) => (
      <svg viewBox="0 0 300 100" {...props}>
        <path fill="#005BAB" d="M35.2 28.5h11.4v43H35.2zM56.8 28.5L78 57.2V28.5h11V71.5H77.5L56.4 42.8v28.7h-11V28.5h11.4zM99.6 28.5h27.2v9h-16.2v8.5h14.5v9h-14.5v8h17.2v8.5H99.6zM135.5 37.5h-9.8v-9h31.2v9h-10v34h-11.4z"/>
        <circle fill="#F26522" cx="180" cy="50" r="15"/>
      </svg>
    )
  },
  {
    name: 'Photoshop',
    color: '#31A8FF',
    renderIcon: (props) => (
      <svg viewBox="0 0 1024 1024" {...props}>
        <rect width="1024" height="1024" rx="180" fill="#001e36"/>
        <path d="M266 312h170c90 0 148 45 148 132s-58 132-148 132h-74v136H266V312zm96 79v106h74c42 0 54-20 54-53s-12-53-54-53h-74z" fill="#31a8ff"/>
        <path d="M664 473c-45 0-72 25-72 58 0 32 24 50 64 62 42 12 58 20 60 40 2 18-12 28-36 28-28 0-48-12-54-34l-82 22c12 54 58 88 136 88 78 0 128-40 128-100s-40-84-104-100c-40-10-52-18-52-32s12-25 32-25c24 0 44 10 52 28l80-32c-12-42-54-65-110-65z" fill="#31a8ff"/>
      </svg>
    )
  },
  {
    name: 'VS Code',
    color: '#007ACC',
    renderIcon: (props) => (
      <svg viewBox="0 0 24 24" fill="#007ACC" {...props}>
        <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .327 8.71l4.263 3.291-4.263 3.291a1 1 0 0 0 0 1.45l1.322 1.154a1 1 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.86L10.822 12l7.182-5.447v10.894z"/>
      </svg>
    )
  },
  {
    name: 'Linux',
    color: '#fcc624',
    renderIcon: () => (
      <img src="/Linux.svg" alt="Linux" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    name: 'OBS',
    color: '#ffffff',
    renderIcon: () => (
      <img src="/obs.svg" alt="OBS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    name: 'VM Ware',
    color: '#607078',
    renderIcon: () => (
      <img src="/vmware.svg" alt="VMware" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    )
  },
  {
    name: 'Centos',
    color: '#22ad2c',
    renderIcon: (props) => (
      <svg viewBox="0 0 200 200" {...props}>
        <path fill="#932279" d="M100 13.5v86.5H13.5z"/>
        <path fill="#214497" d="M186.5 100H100V13.5z"/>
        <path fill="#118833" d="M100 186.5V100h86.5z"/>
        <path fill="#EF9200" d="M13.5 100H100v86.5z"/>
        <path fill="#FFD400" d="M100 50l15 15-15 15-15-15z"/>
        <path fill="#FFFFFF" d="M100 70l10 10-10 10-10-10z"/>
      </svg>
    )
  }
];

export const renderAppLogo = (app, props = {}) => {
  if (!app) return <Box size={20} {...props} />;

  // 1. Custom uploaded image takes precedence
  if (app.iconUrl) {
    return <img src={app.iconUrl} alt={app.name || 'App'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} {...props} />;
  }

  // 2. Preset logo lookup by iconKey or name
  const targetKey = (app.iconKey || app.name || '').trim().toLowerCase();
  const preset = APP_PRESET_LOGOS.find(p => p.name.toLowerCase() === targetKey);
  if (preset && preset.renderIcon) {
    const isMonochrome = ['github', 'vercel', 'apple'].includes(targetKey);
    let resolvedColor = app.color || preset.color;
    if (isMonochrome && (resolvedColor === '#ffffff' || resolvedColor === '#fff')) {
      resolvedColor = 'currentColor';
    }
    return preset.renderIcon({ width: '100%', height: '100%', style: { color: resolvedColor }, ...props });
  }

  // 3. Fallback
  return <Box size={20} style={{ color: app.color || 'var(--admin-accent)' }} {...props} />;
};

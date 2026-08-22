import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Users, HelpCircle, Link2, Layout } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (href) => {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  };

  const navItems = [
    { to: '/',           icon: <Home size={20} />,          label: t('nav.home').toUpperCase(),  isLink: true },
    { to: '/chronicles', icon: <ClipboardList size={20} />,  label: t('nav.chronicles').toUpperCase(), isLink: true },
    { to: '/showcase',   icon: <Layout size={20} />,         label: t('nav.showcase').toUpperCase(),  isLink: true },
    { to: '/blog',       icon: <Users size={20} />,          label: t('nav.blog').toUpperCase(),   isLink: true },
    { to: '/shortener',  icon: <Link2 size={20} />,          label: t('nav.shortener').toUpperCase(),    isLink: true },
    { to: '/quiz-maker', icon: <HelpCircle size={20} />,     label: 'QUIZ',       isLink: true },
  ];

  return (
    <div className="iris-mobile-nav">
      {navItems.map((item) => {
        const active = isActive(item.to.split('#')[0]);

        if (item.isLink) {
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`m-nav-item${active ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <a
            key={item.to}
            href={item.to}
            className="m-nav-item"
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;

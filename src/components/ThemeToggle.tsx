import React, { useState, useEffect } from 'react';
import { getSafe, setSafe } from '../utils/storage';

type Theme = 'light' | 'dark';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    
    const saved = getSafe('theme');
    console.log('Initial theme load: saved=', saved, 'type:', typeof saved);
    if (saved === 'dark' || saved === 'light') {
      console.log('Using saved theme:', saved);
      return saved;
    }
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log('System dark?', systemDark);
    return systemDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    console.log('Theme changed to:', theme, 'root classes:', root.classList);
    if (theme === 'dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    } else {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    }
    setSafe('theme', theme);
    console.log('LocalStorage set to:', theme);
    
    console.log('CSS var --bg:', getComputedStyle(root).getPropertyValue('--bg'));
  }, [theme]);

  const toggleTheme = () => {
    console.log('Toggle clicked, current theme:', theme);
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Переключить на ${theme === 'light' ? 'тёмную' : 'светлую'} тему`}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text)',
        zIndex: 1000,
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;
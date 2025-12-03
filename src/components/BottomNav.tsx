import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, BookOpen, Bell, Settings } from 'lucide-react';
import '../styles/BottomNav.css';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home, path: '/' },
    { id: 'create', label: 'Tạo', icon: Plus, path: '/create-memory' },
    { id: 'view', label: 'Xem', icon: BookOpen, path: '/view-memory' },
    { id: 'reminders', label: 'Chuông', icon: Bell, path: '/anniversary-reminders' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => handleNavClick(item.path)}
            aria-label={item.label}
          >
            <Icon className="bottom-nav-icon" size={24} />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;

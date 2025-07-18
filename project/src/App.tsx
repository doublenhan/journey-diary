import { useState } from 'react';
import { Heart, BookOpen, Camera, Bell, Download as Download2, FileText, Menu, X, Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import CreateMemory from './CreateMemory';
import ViewMemory from './ViewMemory';
import JourneyTracker from './JourneyTracker';
import AnniversaryReminders from './AnniversaryReminders';
import PDFExport from './PDFExport';
import SettingPage from './SettingPage';
import LoginPage from './LoginPage';
import './styles/App.css';


function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'landing' | 'create-memory' | 'view-memory' | 'journey-tracker' | 'anniversary-reminders' | 'pdf-export' | 'setting-page'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Love Journaling",
      description: "Write and preserve your most precious romantic memories with our beautiful journaling interface."
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Photo Memories",
      description: "Upload and organize your favorite photos together, creating a visual timeline of your love story."
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Anniversary Reminders",
      description: "Never miss important dates with smart reminders for anniversaries, birthdays, and special moments."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "PDF Export",
      description: "Transform your digital memories into beautiful PDF books that you can print and treasure forever."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Mood Tracking",
      description: "Track your relationship's journey with mood indicators and relationship milestone celebrations."
    },
    {
      icon: <Download2 className="w-8 h-8" />,
      title: "Cloud Sync",
      description: "Keep your memories safe with automatic cloud backup and sync across all your devices."
    }
  ];

  const galleryImages = [
    "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1024956/pexels-photo-1024956.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1024970/pexels-photo-1024970.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1024975/pexels-photo-1024975.jpeg?auto=compress&cs=tinysrgb&w=400",
  ];

  // Show LoginPage as the entry point
  if (currentPage === 'login') {
    return <LoginPage onLogin={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'create-memory') {
    return <CreateMemory onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'view-memory') {
    return <ViewMemory onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'journey-tracker') {
    return <JourneyTracker onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'anniversary-reminders') {
    return <AnniversaryReminders onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'pdf-export') {
    return <PDFExport onBack={() => setCurrentPage('landing')} />;
  }

  if (currentPage === 'setting-page') {
    return <SettingPage onBack={() => setCurrentPage('landing')} />;
  }

  // ...existing code...
  return (
    <div className="landing-page">
      {/* ...existing code... */}
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { MdOutlineLogout } from "react-icons/md";
import { FiHome, FiUsers, FiBookOpen, FiSettings, FiHelpCircle } from "react-icons/fi";
import { FaUserFriends, FaDoorOpen, FaInfoCircle, FaCalendarAlt, FaTools, FaShieldAlt, FaWrench, FaComments } from "react-icons/fa";
import Communication from './pages/Communication';
import Settings from './pages/settings';
import Family from './Cards/Family';
import { IoPersonCircleOutline } from "react-icons/io5";
import RightSidebar from './components/Rightsidebar';
import Help from './pages/Help';
import Accounts from './pages/Account';
import Events from './Cards/Events';
import Chats from './Cards/chats';
import Visitor from './Cards/Visitor';
import Directory from './Cards/Directory';
import Complain from './Cards/Complain';
import Security from './Cards/Security';
import Maintainance from './Cards/Maintainance';
import Vehicles from './Cards/Vehicles';
import FacilityBooking from './Cards/FacilityBooking';
import VisitorApproval from './Cards/VisitorApproval';
import SocietyMap from './Cards/SocietyMap';
import { FaCarSide, FaCalendarPlus, FaUserPlus, FaMapMarkedAlt } from "react-icons/fa";
import {
  Search,
  Menu,
  X,
  Command,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Zap,
  User as UserIcon
} from 'lucide-react';

const Homepage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const goToProfile = () => {
    navigate('/profile');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const boxData = [
    {
      title: "Family",
      author: "Connect Your Neighbours",
      bgColor: "from-pink-400 to-pink-600",
      icon: <FaUserFriends className="w-8 h-8" />,
      section: "family",
      description: "Manage family connections and neighbor relationships"
    },
    {
      title: "Documents",
      author: "Upload & manage your personal and society-related documents",
      bgColor: "from-purple-400 to-purple-600",
      icon: <span className="text-2xl">📂</span>,
      navigateTo: "/documents",
      description: "Upload and manage documents"
    },
    {
      title: "Visitors",
      author: "Welcome your Guests",
      bgColor: "from-yellow-400 to-yellow-600",
      icon: <FaDoorOpen className="w-8 h-8" />,
      section: "visitors",
      description: "Track and manage visitor entries"
    },
    {
      title: "Directory",
      author: "Need any Info?",
      bgColor: "from-blue-400 to-blue-600",
      icon: <FaInfoCircle className="w-8 h-8" />,
      section: "directory",
      description: "Access community directory and contacts"
    },
    {
      title: "Events",
      author: "Ready for the Events",
      bgColor: "from-green-400 to-green-600",
      icon: <FaCalendarAlt className="w-8 h-8" />,
      section: "events",
      description: "Discover and join community events"
    },
    {
      title: "Complain Desk",
      author: "Have any Issue?",
      bgColor: "from-red-400 to-red-600",
      icon: <FaTools className="w-8 h-8" />,
      section: "complain",
      description: "Report issues and track complaints"
    },
    {
      title: "Security Desk",
      author: "Family Safety",
      bgColor: "from-purple-400 to-purple-600",
      icon: <FaShieldAlt className="w-8 h-8" />,
      section: "security",
      description: "Monitor security and safety alerts"
    },
    {
      title: "Maintenance",
      author: "Your Maintenance Data",
      bgColor: "from-orange-400 to-orange-600",
      icon: <FaWrench className="w-8 h-8" />,
      section: "maintenance",
      description: "Track maintenance requests and schedules"
    },
    {
      title: "Chats & Polls",
      author: "Conversation things",
      bgColor: "from-indigo-400 to-indigo-600",
      icon: <FaComments className="w-8 h-8" />,
      section: "chats",
      description: "Community discussions and polls"
    },
    {
      title: "My Vehicles",
      author: "Manage your garage",
      bgColor: "from-teal-400 to-teal-600",
      icon: <FaCarSide className="w-8 h-8" />,
      section: "vehicles",
      description: "Track registered vehicles and parking"
    },
    {
      title: "Book Facility",
      author: "Reserve Amenities",
      bgColor: "from-indigo-400 to-indigo-600",
      icon: <FaCalendarPlus className="w-8 h-8" />,
      section: "facility",
      description: "Book clubhouse, gym or swimming pool"
    },
    {
      title: "Visitor QR",
      author: "Gate Pass Generator",
      bgColor: "from-emerald-400 to-emerald-600",
      icon: <FaUserPlus className="w-8 h-8" />,
      section: "visitorPass",
      description: "Generate pre-approved passes for guests"
    },
    {
      title: "Society Map",
      author: "Interactive Visuals",
      bgColor: "from-blue-400 to-indigo-600",
      icon: <FaMapMarkedAlt className="w-8 h-8" />,
      section: "societyMap",
      description: "Visual floor-wise flat occupancy"
    }
  ];

  const filteredBoxData = boxData.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const content = {
    home: (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:text-left relative"
        >
          <div className="absolute top-0 right-0 hidden lg:block opacity-[0.05]">
            <Zap size={200} className="text-indigo-600 rotate-12" />
          </div>
          <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <FiHome size={20} />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Society Intelligence Node</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-none">
            Welcome to <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic">Smart Society</span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-500 dark:text-slate-400 font-bold mb-8 uppercase tracking-tight">
            Experience the future of community living with our intuitive, all-in-one management platform.
          </p>

          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-10">
            <button onClick={() => setActiveSection('security')} className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-500/20 flex items-center gap-3 hover:scale-105 transition active:scale-95">
              <FaShieldAlt className="animate-pulse" /> Emergency SOS
            </button>
            <button onClick={() => setActiveSection('accounts')} className="px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-3 hover:scale-105 transition active:scale-95">
              <Zap size={14} /> Pay Maintenance
            </button>
            <button onClick={() => setActiveSection('visitors')} className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm flex items-center gap-3 hover:scale-105 transition active:scale-95">
              <FaUserPlus /> Invite Guest
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredBoxData.length > 0 ? (
            filteredBoxData.map((item, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ scale: 1.05, translateY: -5 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden p-8 rounded-3xl text-left transition-all duration-300
                           bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700
                           shadow-xl hover:shadow-2xl hover:border-indigo-500/50 group`}
                onClick={() => {
                  if (item.navigateTo) {
                    navigate(item.navigateTo);
                  } else if (item.section) {
                    setActiveSection(item.section);
                  }
                }}
              >
                {/* Background Accent Gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.bgColor} opacity-10 group-hover:opacity-20 blur-3xl transition-opacity duration-500`}></div>

                <div className="relative z-10">
                  <div className={`mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.bgColor} text-white shadow-lg shadow-indigo-500/20 transform group-hover:rotate-6 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">
                    {item.author}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                    {item.description}
                  </p>
                </div>

                {/* Subtle hover indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <Command className="w-16 h-16 mx-auto mb-4 text-slate-300 animate-pulse" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No features found matching your search</p>
            </div>
          )}
        </div>
      </div>
    ),
    communication: <Communication />,
    family: <Family />,
    visitors: <Visitor />,
    directory: <Directory />,
    complain: <Complain />,
    events: <Events />,
    security: <Security />,
    accounts: <Accounts />,
    settings: <Settings />,
    help: <Help />,
    chats: <Chats />,
    maintenance: <Maintainance />,
    vehicles: <Vehicles />,
    facility: <FacilityBooking />,
    visitorPass: <VisitorApproval />,
    societyMap: <SocietyMap />
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { section: 'home', label: 'Home', icon: FiHome },
    { section: 'communication', label: 'Communication', icon: FiUsers },
    { section: 'accounts', label: 'Accounts', icon: FiBookOpen },
    { section: 'settings', label: 'Settings', icon: FiSettings },
    { section: 'help', label: 'Help', icon: FiHelpCircle }
  ];

  return (
    <div className={`flex h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden`}>
      {/* 🛡️ PREMIUM GLASS SIDEBAR */}
      <motion.div
        animate={{ width: isSidebarCollapsed ? (isSmallScreen ? 0 : 80) : 280 }}
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-slate-900/95 dark:bg-slate-900/80 backdrop-blur-2xl
          border-right border-white/5 shadow-2xl overflow-hidden flex flex-col
          ${isSmallScreen && !sidebarVisible ? '-translate-x-full' : 'translate-x-0'}
          transition-all duration-500 ease-in-out
        `}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-10 overflow-hidden">
            <div className="min-w-[48px] h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white fill-current" size={24} />
            </div>
            {!isSidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                <h1 className="text-xl font-black text-white tracking-widest leading-none">SMART</h1>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em]">SOCIETY OS</p>
              </motion.div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.section}
                onClick={() => {
                  setActiveSection(item.section);
                  if (isSmallScreen) setSidebarVisible(false);
                }}
                className={`
                  w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group relative
                  ${activeSection === item.section
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <item.icon size={20} className={`min-w-[20px] ${activeSection === item.section ? 'animate-pulse' : ''}`} />
                {!isSidebarCollapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-sm">
                    {item.label}
                  </motion.span>
                )}

                {/* Active Indicator Glow */}
                {activeSection === item.section && (
                  <div className="absolute left-[-24px] w-2 h-8 bg-indigo-500 rounded-full blur-sm" />
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer Controls */}
          <div className="mt-auto space-y-2 pt-6 border-t border-white/5">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full h-12 flex items-center gap-4 px-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              {!isSidebarCollapsed && <span className="text-sm font-bold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>

            <button
              onClick={handleLogout}
              className="w-full h-12 flex items-center gap-4 px-3 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-black text-sm"
            >
              <MdOutlineLogout size={20} />
              {!isSidebarCollapsed && <span className="uppercase tracking-widest">Sign Out</span>}
            </button>
          </div>
        </div>

        {/* Collapse Toggle Button (Floating) */}
        {!isSmallScreen && (
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-1/2 -right-3 translate-y-[-50%] bg-white dark:bg-slate-800 text-slate-400 w-6 h-12 rounded-full border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-xl hover:text-indigo-600 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </motion.div>

      {/* 🏢 MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* 🧭 TOP COMMAND NAV (The New Component) */}
        <header className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 z-40 sticky top-0">
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            {isSmallScreen && (
              <button
                onClick={() => setSidebarVisible(true)}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Menu size={20} />
              </button>
            )}

            {/* Live Global Search */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Search size={18} />
              </div>
              <input
                id="global-search"
                type="text"
                placeholder="Search features, tools, commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-12 pr-4 text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none"
              />
              <div className="absolute right-4 top-1/2 translate-y-[-50%] px-2 py-1 bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-500 rounded-lg">
                ALT + S
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-8">
            <button className="relative p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:border-indigo-500/50 transition-all group">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 animate-bounce" />
            </button>
            <div
              onClick={goToProfile}
              className="flex items-center gap-3 p-1 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-500 shadow-sm transition-all group"
            >
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                <UserIcon size={20} />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Resident</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">My Identity</p>
              </div>
            </div>
          </div>
        </header>

        {/* 🛋️ VIEWPORT AREA */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">

            {/* Breadcrumb / View Identity Header */}
            <div className="px-8 pt-8 flex items-center gap-2">
              <LayoutGrid size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dashboard</span>
              <ChevronRight size={12} className="text-slate-300" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{activeSection}</span>
            </div>

            <div className="p-4 lg:p-8 pt-2">
              {content[activeSection]}
            </div>
          </div>

          {/* Right Sidebar Integrated */}
          <RightSidebar setActiveSection={setActiveSection} />
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSmallScreen && sidebarVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setSidebarVisible(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Homepage;

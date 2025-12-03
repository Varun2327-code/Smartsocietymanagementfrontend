import React, { useState, useEffect } from 'react';
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

const Homepage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarVisible, setSidebarVisible] = useState(false);
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
    }
  ];

  const content = {
    home: (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to Smart Society
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Manage your community with ease and efficiency
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boxData.map((item, idx) => (
            <button
              key={idx}
              className={`relative group bg-gradient-to-br ${item.bgColor} p-6 rounded-2xl shadow-lg 
                         hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 
                         overflow-hidden focus:outline-none focus:ring-4 focus:ring-opacity-50`}
              onClick={() => {
                if (item.navigateTo) {
                  navigate(item.navigateTo);
                } else if (item.section) {
                  setActiveSection(item.section);
                }
              }}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-start text-left">
                <div className="mb-4 p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white text-opacity-90 text-sm mb-3">{item.author}</p>
                <p className="text-white text-opacity-80 text-xs leading-relaxed">{item.description}</p>
              </div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mb-10 -mr-10 group-hover:scale-150 transition-transform duration-300"></div>
            </button>
          ))}
        </div>
      </div>
    ),
    communication: <Communication />,
    family: <Family />,
    visitors: <Visitor/>,
    directory: <Directory/>,
    complain: <Complain/>,
    events: <Events />,
    security: <Security/>,
    accounts: <Accounts />,
    settings: <Settings />,
    help: <Help />,
    chats: <Chats />,
    maintenance:<Maintainance/>
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

  const navItems = [
    { section: 'home', label: 'Home', icon: FiHome },
    { section: 'communication', label: 'Communication', icon: FiUsers },
    { section: 'accounts', label: 'Accounts', icon: FiBookOpen },
    { section: 'settings', label: 'Settings', icon: FiSettings },
    { section: 'help', label: 'Help', icon: FiHelpCircle }
  ];

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-blue-600 to-purple-700 
        shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isSmallScreen && !sidebarVisible ? '-translate-x-full' : 'translate-x-0'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">SMART SOCIETY</h1>
            <div className="h-1 w-12 bg-white bg-opacity-50 rounded-full"></div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.section}
                onClick={() => {
                  setActiveSection(item.section);
                  if (isSmallScreen) setSidebarVisible(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-xl text-white
                  transition-all duration-300 group
                  ${activeSection === item.section 
                    ? 'bg-white bg-opacity-20 backdrop-blur-sm shadow-lg' 
                    : 'hover:bg-white hover:bg-opacity-10 hover:backdrop-blur-sm'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {activeSection === item.section && (
                  <div className="ml-auto w-1 h-6 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-20 text-white transition-all duration-300"
            >
              <span className="text-sm font-medium">
                {isDarkMode ? '☀️ Light' : '🌙 Dark'}
              </span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all duration-300 shadow-lg"
            >
              <MdOutlineLogout className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSmallScreen && sidebarVisible && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* Sidebar Toggle */}
      {isSmallScreen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {content[activeSection]}
          </div>
        </div>
        
        {/* Right Sidebar */}
          <RightSidebar />
      </div>
    </div>
  );
};

export default Homepage;

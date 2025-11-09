
import React, { useState, useEffect, useRef } from 'react';
import { View, MenuItem, Order, Category, User, RestaurantSettings, Customer, ToastNotification, DaySession } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_CATEGORIES, INITIAL_SETTINGS } from './constants';
import POS from './components/POS';
import MenuManager from './components/MenuManager';
import SalesReport from './components/SalesReport';
import { NavigationIcon, LogoutIcon, UserIcon, DayInIcon, DayEndIcon } from './components/Icons';
import AuthPage from './components/AuthPage';
import KitchenDisplay from './components/KitchenDisplay';
import BarDisplay from './components/BarDisplay';
import GeminiHub from './components/GeminiHub';
import Modal from './components/Modal';
import DayEndReport from './components/DayEndReport';

const NOTIFICATION_SOUND_DATA_URL = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAABAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-zA/AEBQL//uwwAAfFYAEtQAAAACAAADSAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-ADk5L/wAANpbA2gAAB5IAnAABkIkAAAEAAAADQAAAATEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-';
const KITCHEN_ORDER_SOUND_DATA_URL = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAABAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVahg+j/wAANpbA2gAAB5IAnAABkIkAAAEAAAADQAAAATEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.POS);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
     try {
      const storedUsers = localStorage.getItem('users');
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    try {
      const storedSettings = localStorage.getItem('restaurantSettings');
      // Merge with initial settings to ensure new properties are present
      const parsedSettings = storedSettings ? JSON.parse(storedSettings) : {};
      return { ...INITIAL_SETTINGS, ...parsedSettings };
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const storedMenu = localStorage.getItem('menuItems');
      return storedMenu ? JSON.parse(storedMenu) : INITIAL_MENU_ITEMS;
    } catch (error) {
      console.error("Failed to parse menu items from localStorage", error);
      return INITIAL_MENU_ITEMS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const storedCategories = localStorage.getItem('categories');
      return storedCategories ? JSON.parse(storedCategories) : INITIAL_CATEGORIES;
    } catch (error) {
      console.error("Failed to parse categories from localStorage", error);
      return INITIAL_CATEGORIES;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const storedOrders = localStorage.getItem('orders');
      return storedOrders ? JSON.parse(storedOrders).map((o: Order) => ({...o, date: new Date(o.date)})) : [];
    } catch (error) {
      console.error("Failed to parse orders from localStorage", error);
      return [];
    }
  });
  
  const [takeawayOrderCounter, setTakeawayOrderCounter] = useState<number>(() => {
    try {
      const storedCounter = localStorage.getItem('takeawayOrderCounter');
      return storedCounter ? JSON.parse(storedCounter) : 0;
    } catch {
      return 0;
    }
  });
    
  const [kotCounter, setKotCounter] = useState<number>(() => {
    try {
      const storedCounter = localStorage.getItem('kotCounter');
      return storedCounter ? JSON.parse(storedCounter) : 0;
    } catch {
      return 0;
    }
  });
  const [botCounter, setBotCounter] = useState<number>(() => {
    try {
      const storedCounter = localStorage.getItem('botCounter');
      return storedCounter ? JSON.parse(storedCounter) : 0;
    } catch {
      return 0;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const storedCustomers = localStorage.getItem('customers');
      return storedCustomers ? JSON.parse(storedCustomers) : [];
    } catch {
      return [];
    }
  });
    
  const [daySession, setDaySession] = useState<DaySession | null>(() => {
    try {
        const storedSession = sessionStorage.getItem('daySession');
        if (storedSession) {
            const parsed = JSON.parse(storedSession);
            return { ...parsed, startTime: new Date(parsed.startTime) };
        }
        return null;
    } catch {
        return null;
    }
  });

  const [isDayEndModalOpen, setIsDayEndModalOpen] = useState(false);

  const [isGeminiHubOpen, setIsGeminiHubOpen] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);
  const kitchenOrderSoundRef = useRef<HTMLAudioElement>(null);


  // For Draggable AI Button
  const [hubPosition, setHubPosition] = useState<{ top?: number; left?: number; bottom?: number; right?: number }>({ bottom: 24, right: 24 });
  const hubRef = useRef<HTMLButtonElement>(null);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });


  const playNotificationSound = () => {
    notificationSoundRef.current?.play().catch(e => console.error("Error playing sound:", e));
  };

  const playKitchenOrderSound = () => {
    kitchenOrderSoundRef.current?.play().catch(e => console.error("Error playing sound:", e));
  };

  const addNotification = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('daySession');
      setDaySession(null);
    }
  }, [currentUser]);
  
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('restaurantSettings', JSON.stringify(settings));
  }, [settings]);


  useEffect(() => {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('takeawayOrderCounter', JSON.stringify(takeawayOrderCounter));
  }, [takeawayOrderCounter]);
    
  useEffect(() => {
    localStorage.setItem('kotCounter', JSON.stringify(kotCounter));
  }, [kotCounter]);
    
  useEffect(() => {
    localStorage.setItem('botCounter', JSON.stringify(botCounter));
  }, [botCounter]);
  
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);
    
  useEffect(() => {
    if (daySession) {
        sessionStorage.setItem('daySession', JSON.stringify(daySession));
    } else {
        sessionStorage.removeItem('daySession');
    }
  }, [daySession]);


  useEffect(() => {
    if (currentUser && !['Admin', 'Manager'].includes(currentUser.role) && [View.MANAGE_MENU, View.REPORTS, View.KITCHEN_DISPLAY, View.BAR_DISPLAY].includes(activeView)) {
      setActiveView(View.POS);
    }
  }, [currentUser, activeView]);

  // Draggable button logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !hubRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      if (!hasDraggedRef.current) {
        const rect = hubRef.current.getBoundingClientRect();
        const dx = Math.abs(clientX - (rect.left + dragStartPosRef.current.x));
        const dy = Math.abs(clientY - (rect.top + dragStartPosRef.current.y));
        if (dx > 5 || dy > 5) {
            hasDraggedRef.current = true;
        }
      }

      let newX = clientX - dragStartPosRef.current.x;
      let newY = clientY - dragStartPosRef.current.y;
      
      const hubWidth = hubRef.current.offsetWidth;
      const hubHeight = hubRef.current.offsetHeight;

      newX = Math.max(8, Math.min(newX, window.innerWidth - hubWidth - 8));
      newY = Math.max(8, Math.min(newY, window.innerHeight - hubHeight - 8));

      setHubPosition({ top: newY, left: newX });
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current && !hasDraggedRef.current) {
        setIsGeminiHubOpen(true);
      }
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const handleHubMouseDown = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    
    if (hubRef.current) {
        const rect = hubRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        dragStartPosRef.current = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
        // If position is bottom/right, convert to top/left for dragging
        if (hubPosition.bottom !== undefined) {
             setHubPosition({ top: rect.top, left: rect.left });
        }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView(View.POS);
  };
    
  const handleStartDay = () => {
    if (currentUser) {
        setDaySession({
            startTime: new Date(),
            startedBy: currentUser.name
        });
    }
  };

  const handleEndDay = () => {
    const activeOrders = orders.filter(o => o.status === 'active' || o.status === 'billed');
    if (activeOrders.length > 0) {
        alert(`There are still ${activeOrders.length} active orders. Please complete or clear all orders before ending the day.`);
        return;
    }
    setIsDayEndModalOpen(true);
  };
    
  const handleConfirmEndDay = () => {
    setIsDayEndModalOpen(false);
    handleLogout();
  };

  const renderView = () => {
    if (!currentUser) return null;

    if (!daySession) {
        if (['Admin', 'Manager', 'Cashier'].includes(currentUser.role)) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-3xl font-bold mb-4">Day Not Started</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Please start a new business day to begin operations.</p>
                    <button onClick={handleStartDay} className="flex items-center gap-3 bg-primary text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:bg-emerald-600 transition-transform transform hover:scale-105">
                        <DayInIcon /> Start Day
                    </button>
                </div>
            );
        } else { // Waiter
             return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-3xl font-bold mb-4">Day Not Started</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">Please wait for a Manager, Admin, or Cashier to start the day.</p>
                </div>
            );
        }
    }
    
    if (currentUser && !['Admin', 'Manager'].includes(currentUser.role)) {
       if ([View.MANAGE_MENU, View.REPORTS, View.KITCHEN_DISPLAY, View.BAR_DISPLAY].includes(activeView)) {
         return <POS currentUser={currentUser} menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} orders={orders} setOrders={setOrders} settings={settings} takeawayOrderCounter={takeawayOrderCounter} setTakeawayOrderCounter={setTakeawayOrderCounter} kotCounter={kotCounter} setKotCounter={setKotCounter} botCounter={botCounter} setBotCounter={setBotCounter} customers={customers} setCustomers={setCustomers} addNotification={addNotification} playNotificationSound={playNotificationSound} />;
       }
    }
    
    switch (activeView) {
      case View.MANAGE_MENU:
        return <MenuManager menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} setCategories={setCategories} settings={settings} />;
      case View.REPORTS:
        return <SalesReport orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} setCategories={setCategories} settings={settings} setSettings={setSettings} users={users} setUsers={setUsers} currentUser={currentUser} customers={customers} setCustomers={setCustomers} />;
      case View.KITCHEN_DISPLAY:
        return <KitchenDisplay orders={orders} setOrders={setOrders} settings={settings} playNotificationSound={playNotificationSound} playNewOrderSound={playKitchenOrderSound} />;
      case View.BAR_DISPLAY:
        return <BarDisplay orders={orders} setOrders={setOrders} settings={settings} playNotificationSound={playNotificationSound} playNewOrderSound={playKitchenOrderSound} />;
      case View.POS:
      default:
        return <POS currentUser={currentUser} menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} orders={orders} setOrders={setOrders} settings={settings} takeawayOrderCounter={takeawayOrderCounter} setTakeawayOrderCounter={setTakeawayOrderCounter} kotCounter={kotCounter} setKotCounter={setKotCounter} botCounter={botCounter} setBotCounter={setBotCounter} customers={customers} setCustomers={setCustomers} addNotification={addNotification} playNotificationSound={playNotificationSound} />;
    }
  };

  const NavButton: React.FC<{ view: View; label: string; }> = ({ view, label }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeView === view
          ? 'bg-primary text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
      aria-label={label}
    >
      <NavigationIcon view={view} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  if (!currentUser) {
    return <AuthPage onLoginSuccess={setCurrentUser} users={users} setUsers={setUsers} />;
  }

  return (
    <div className="flex flex-col h-screen font-sans">
      <header className="no-print bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">{settings.restaurantName}</h1>
        <div className="flex items-center gap-2 sm:gap-4">
            {daySession && ['Admin', 'Manager', 'Cashier'].includes(currentUser.role) && (
              <button onClick={handleEndDay} className="flex items-center gap-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-red-600 transition-colors">
                <DayEndIcon /> <span className="hidden sm:inline">End Day</span>
              </button>
            )}
          <nav className="flex items-center gap-1 sm:gap-2 border-r border-gray-200 dark:border-gray-700 pr-2 sm:pr-4">
            <NavButton view={View.POS} label="POS" />
            {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
              <>
                <NavButton view={View.KITCHEN_DISPLAY} label="Kitchen View" />
                <NavButton view={View.BAR_DISPLAY} label="Bar View" />
                {(currentUser.role === 'Admin' || settings.managerPermissions?.canManageMenu) && 
                  <NavButton view={View.MANAGE_MENU} label="Manage Menu" />
                }
                {(currentUser.role === 'Admin' || settings.managerPermissions?.canViewReports) &&
                  <NavButton view={View.REPORTS} label="Reports" />
                }
              </>
            )}
          </nav>
          <div className="flex items-center gap-2 text-right">
            <UserIcon />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{currentUser.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Logout">
            <LogoutIcon />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
      <audio ref={notificationSoundRef} src={NOTIFICATION_SOUND_DATA_URL} preload="auto" className="hidden" />
      <audio ref={kitchenOrderSoundRef} src={KITCHEN_ORDER_SOUND_DATA_URL} preload="auto" className="hidden" />
      <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] space-y-2">
        {notifications.map(notification => (
          <div key={notification.id} className={`px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in-out ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notification.message}
          </div>
        ))}
      </div>
      <button
        ref={hubRef}
        onMouseDown={handleHubMouseDown}
        onTouchStart={handleHubMouseDown}
        style={hubPosition}
        className="no-print fixed bg-gradient-to-br from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-50 cursor-grab active:cursor-grabbing"
        aria-label="Open AI Assistant"
      >
        <span className="text-3xl" role="img" aria-label="Globe">🌍</span>
      </button>
      
      <GeminiHub isOpen={isGeminiHubOpen} onClose={() => setIsGeminiHubOpen(false)} activeView={activeView} />
      
      {daySession && isDayEndModalOpen && 
        <DayEndReport 
            isOpen={isDayEndModalOpen} 
            onClose={() => setIsDayEndModalOpen(false)}
            onConfirm={handleConfirmEndDay}
            session={daySession}
            orders={orders}
            settings={settings}
        />
      }
    </div>
  );
};

export default App;

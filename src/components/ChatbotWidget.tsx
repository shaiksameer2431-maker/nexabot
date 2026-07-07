/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Trash2, RefreshCw, Copy, Check, 
  Phone, Mail, MapPin, User, ChevronRight, HelpCircle, 
  Sparkles, Award, GraduationCap, Building2, BookOpen,
  Volume2, Mic, MicOff, Ticket, UserCheck, FileSpreadsheet,
  Minus, ChevronDown, Bell, Search, ThumbsUp, ThumbsDown, Maximize2, Minimize2,
  Cpu, Activity, Wifi, ShieldAlert, Database, Receipt, 
  ArrowRight, Play, Sliders, BarChart2, CheckCircle2,
  AlertCircle, DollarSign, Flame, BadgeCheck, Network, ExternalLink
} from 'lucide-react';
import { Rule, Department, Message, ChatLog, SupportTicket, PortalItem, NoticeItem } from '../types';
import { findBestMatchingRule } from '../utils/ruleEngine';
import { RobotLogo } from './RobotLogo';
import nexaLogo from '../assets/images/nexa_logo_1783418995608.jpg';

interface ChatbotWidgetProps {
  rules: Rule[];
  departments: Department[];
  supportTickets: SupportTicket[];
  portalItems: PortalItem[];
  notices: NoticeItem[];
  onAddLog: (log: ChatLog) => void;
  onAddSupportTicket: (ticket: SupportTicket) => void;
  forceOpenTrackerEmail?: string | null;
  onClearForceTrackerEmail?: () => void;
  typingSpeed: number;
  isMaximized: boolean;
  setIsMaximized: (maximized: boolean) => void;
}

const TypingText = ({ text, speed, onComplete }: { text: string; speed: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => text.slice(0, prev.length + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <>{displayedText}</>;
};

const TypingIndicator = () => (
  <div className="flex gap-1 px-2 py-1 items-center">
    <motion.span
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
    />
    <motion.span
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
    />
    <motion.span
      className="w-1.5 h-1.5 bg-slate-400 rounded-full"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
    />
  </div>
);

export default function ChatbotWidget({ 
  rules, 
  departments, 
  supportTickets, 
  portalItems,
  notices,
  onAddLog, 
  onAddSupportTicket,
  forceOpenTrackerEmail,
  onClearForceTrackerEmail,
  typingSpeed,
  isMaximized,
  setIsMaximized
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFirstVisitPopup, setShowFirstVisitPopup] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Tab/View state
  // Modes: 'chat' | 'tracker' | 'student-portal' | 'notices'
  const [activeTab, setActiveTab] = useState<'chat' | 'tracker' | 'student-portal' | 'notices'>('chat');

  // Language State
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const translations = {
    en: { chat: "Chat", portal: "Portal", tracker: "Tracker", notices: "Notices" },
    hi: { chat: "चैट", portal: "पोर्टल", tracker: "ट्रैकर", notices: "नोटिस" }
  };
  const t = (key: 'chat' | 'portal' | 'tracker' | 'notices') => translations[language][key];

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Ticket Form States
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketCountryCode, setTicketCountryCode] = useState('+91');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketQuery, setTicketQuery] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Tracker and College Notices States
  const [trackerEmail, setTrackerEmail] = useState('');

  // Rating and Feedback tracking state
  const [ratings, setRatings] = useState<Record<string, 'up' | 'down'>>({});
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);

  // Resize State
  const [customSize, setCustomSize] = useState<{ width: number, height: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ x: number, y: number, startWidth: number, startHeight: number } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Simple Typing Animation
  // Moved outside component

  // 3 Messaging Dots Animation
  // Moved outside component

  // Student Attendance Portal States
  const [searchRegNo, setSearchRegNo] = useState('');
  const [studentPortalResult, setStudentPortalResult] = useState<any | null>(null);
  const [isSearchingPortal, setIsSearchingPortal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick reply buttons suited for a professional college/admissions chatbot
  const getDynamicQuickReplies = () => {
    return [
      'Admissions 🎓',
      'Placements 📈',
      'Fee Structure 💰',
      'CSE HOD 🧑‍🏫',
      'My Attendance 📊'
    ];
  };

  // Welcome configuration
  const welcomeMessage = "👋 Welcome to Narayana NEXA\nThe Official Digital Assistant of Narayana Engineering College.";

  const defaultSuggestions = [
    'What is the admission process?',
    'What is the fee structure for B.Tech?',
    'Who is CSE HOD?',
    'What are the placement statistics?'
  ];

  // Initialize conversations
  useEffect(() => {
    if (messages.length === 0) {
      resetChat();
    }
  }, [rules]);

  // Window Resize handlers for custom resizing widget
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current) return;
      // Resizing from top-left direction as anchor is bottom-right usually
      // Actually, since widget is anchored bottom-right, drag from top-left is standard for expanding.
      // We will place a resize handle at top-left.
      // dx = e.clientX - start.x; -> width changes by -dx
      // dy = e.clientY - start.y; -> height changes by -dy
      const dx = resizeStartRef.current.x - e.clientX;
      const dy = resizeStartRef.current.y - e.clientY;
      
      const newWidth = Math.max(300, resizeStartRef.current.startWidth + dx);
      const newHeight = Math.max(400, resizeStartRef.current.startHeight + dy);
      
      setCustomSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle external triggers to open tracker with predefined email search
  useEffect(() => {
    if (forceOpenTrackerEmail) {
      setIsOpen(true);
      setActiveTab('tracker');
      setTrackerEmail(forceOpenTrackerEmail);
      if (onClearForceTrackerEmail) {
        onClearForceTrackerEmail();
      }
    }
  }, [forceOpenTrackerEmail]);



  const resetChat = () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: welcomeMessage,
        timestamp: time,
        suggestedQuestions: defaultSuggestions
      }
    ]);
  };

  const clearChat = () => {
    setMessages([]);
    setTimeout(() => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([
        {
          id: 'cleared-welcome',
          sender: 'bot',
          text: "Chat history cleared. How else can I assist you with Narayana Engineering College information?",
          timestamp: time,
          suggestedQuestions: defaultSuggestions
        }
      ]);
    }, 100);
  };

  // Speech Synthesis (Read Aloud)
  const handleSpeak = (text: string, messageId: string) => {
    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    // Clean text of emojis and special characters for standard TTS engine
    const cleanText = text.replace(/[^\w\s.,?!;:@()\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      setSpeakingId(null);
    };
    utterance.onerror = () => {
      setSpeakingId(null);
    };
    setSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition (Dictation)
  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try using a modern browser like Google Chrome.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(speechToText);
      setIsListening(false);
      handleSendMessage(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone permission denied. Please enable microphone access in your browser settings.");
      } else {
        alert("Speech recognition error: " + event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: text,
      timestamp: time
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const queryLower = text.toLowerCase().trim();

    setTimeout(() => {
      setIsTyping(false);

      // Intercept direct student portal or attendance queries
      if (queryLower.includes('attendance') || queryLower.includes('student status') || queryLower.includes('marks')) {
        setActiveTab('student-portal');
        const botMsg: Message = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          text: "I have launched the **Narayana Student Attendance Tracker**. Type your hall ticket number (e.g., `26911A0501` to `26911A0510`) to inspect your academic status and percentage!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
        return;
      }

      // Execute local Rule-based search engine
      const matchResult = findBestMatchingRule(text, rules);
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let botResponse: Message;

      if (matchResult) {
        const matchedRule = matchResult.rule;
        const dept = departments.find(d => d.id === matchedRule.relatedDepartment);
        
        botResponse = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          text: matchedRule.answer,
          timestamp: botTime,
          score: matchResult.score,
          departmentContact: dept ? {
            name: dept.name,
            phone: dept.contactNumber,
            email: dept.email
          } : undefined
        };

        // Trigger log insertion
        onAddLog({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toISOString(),
          userQuery: text,
          matchedRuleId: matchedRule.id,
          matchedQuestion: matchedRule.question,
          score: matchResult.score,
          userRole: 'Unified Chatbot Guest',
          fallbackTriggered: false
        });
      } else {
        // Fallback message with ticket action integration
        botResponse = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          text: "I couldn't locate that specific answer in the college knowledge base. Would you like to log an offline support ticket? Our support desk counselor will reply directly.",
          timestamp: botTime,
          suggestedQuestions: ['Open Support Ticket Form', 'View Main FAQs']
        };

        onAddLog({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toISOString(),
          userQuery: text,
          matchedRuleId: null,
          matchedQuestion: null,
          score: 0,
          userRole: 'Unified Chatbot Guest',
          fallbackTriggered: true
        });
      }

      setMessages(prev => [...prev, botResponse]);
    }, 1500);
  };

  // Support Ticket submission handler
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail.trim() || !ticketPhone.trim() || !ticketQuery.trim()) {
      alert("Please fill out all required fields.");
      return;
    }

    const newTicket: SupportTicket = {
      id: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      studentName: ticketName.trim() || 'Guest Student',
      email: ticketEmail.trim(),
      countryCode: ticketCountryCode.trim(),
      phone: ticketPhone.trim(),
      role: 'Unified Student/Parent',
      query: ticketQuery.trim(),
      status: 'Open',
      userNotified: false
    };

    onAddSupportTicket(newTicket);
    
    // Notify Admin Console (simulated API push)
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
    } catch (err) {
      console.error("Failed to push notification:", err);
    }

    setTicketSuccess(true);
    setTrackerEmail(ticketEmail.trim());

    setTimeout(() => {
      setShowTicketForm(false);
      setTicketSuccess(false);
      // Reset form fields
      setTicketName('');
      setTicketEmail('');
      setTicketCountryCode('+91');
      setTicketPhone('');
      setTicketQuery('');

      // Add success confirmation to messages
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: `msg-ticket-success-${Date.now()}`,
          sender: 'bot',
          text: `Thank you, ${newTicket.studentName}! Your support ticket has been successfully logged with ID: **${newTicket.id}**. \n\nOur counseling helpdesk will immediately process this request. Since our **NEXA Push Notification service** is fully armed, you will receive an active, high-priority **simulated Email and WhatsApp Business message** the instant our admin team submits a reply (even if this browser window is closed or minimised!).`,
          timestamp: botTime
        }
      ]);
    }, 1500);
  };

  const getAutocompleteSuggestions = () => {
    if (!inputText.trim()) return [];
    const term = inputText.toLowerCase();
    return rules
      .filter(r => r.status === 'Active' && r.question.toLowerCase().includes(term))
      .slice(0, 3);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickReply = (topic: string) => {
    // Strip emojis for mapping
    const topicClean = topic.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();

    if (topicClean === 'My Attendance') {
      setActiveTab('student-portal');
      return;
    }

    const queryMap: { [key: string]: string } = {
      'Admissions': 'What is the admission process at Narayana NEXA?',
      'Departments': 'What B.Tech departments are available at Narayana NEXA?',
      'Faculty': 'Who is the Principal of Narayana NEXA?',
      'Fee Structure': 'What is the fee structure for B.Tech?',
      'Placements': 'What are the placement statistics and top recruiters?',
      'Hostel': 'Does the college provide hostel facilities?',
      'CSE HOD': 'Who is CSE HOD?',
      'Transport': 'Is college transport or bus facility available?',
      'Scholarships': 'Are scholarships available for students?',
      'Facilities': 'What library timings and resources are available?',
      'Contact Us': 'What are the college contact numbers and email IDs?',
      'FAQ': 'Where can I find the College Notices?'
    };

    const searchStr = queryMap[topicClean] || `Tell me about ${topicClean}`;
    handleSendMessage(searchStr);
  };

  // Feedback thumb recorder
  const handleRateResponse = (msgId: string, type: 'up' | 'down') => {
    setRatings(prev => ({ ...prev, [msgId]: type }));
    setRatingMessage("Thank you! Your feedback has been logged into G-Bot Analytics.");
    setTimeout(() => {
      setRatingMessage(null);
    }, 3000);
  };

  // GITAM attendance lookup simulator
  const handleStudentPortalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRegNo.trim()) return;

    setIsSearchingPortal(true);
    setStudentPortalResult(null);

    // Mock search times
    setTimeout(() => {
      const idStr = searchRegNo.trim().toUpperCase();
      // Generate deterministic student details from registration numbers
      const names = ['Sameer Shaik', 'Prashanth Kumar', 'Anjali Devi', 'Rohit Sharma', 'Sneha Reddy', 'Harsha Vardhan', 'Kavya Sri', 'Ravi Teja', 'Siddharth Roy', 'Divya Teja'];
      const branches = ['Computer Science Engineering (CSE)', 'Electronics & Communication (ECE)', 'Electrical & Electronics (EEE)', 'Information Technology (IT)', 'Mechanical Engineering'];
      
      const seed = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const name = names[seed % names.length];
      const branch = branches[seed % branches.length];
      const attendance = Math.round((70 + (seed % 28)) * 10) / 10; // 70% to 98%
      const cgpa = Math.round((6.8 + ((seed % 30) / 10)) * 100) / 100; // 6.8 to 9.8
      const mid1 = Math.round(18 + (seed % 8)); // 18 to 25
      const mid2 = Math.round(19 + (seed % 7)); // 19 to 25

      setStudentPortalResult({
        regNo: idStr,
        name,
        branch,
        attendance,
        cgpa,
        mid1,
        mid2,
        isSafe: attendance >= 75
      });
      setIsSearchingPortal(false);
    }, 1100);
  };



  return (
    <React.Fragment>
    <div className={`fixed z-50 flex flex-col font-sans pointer-events-none transition-all duration-300 ${
      isMaximized 
        ? 'inset-0 w-full h-[100dvh] sm:inset-auto sm:bottom-6 sm:right-6 sm:w-auto sm:h-auto items-center justify-center sm:items-end' 
        : 'bottom-4 right-4 sm:bottom-6 sm:right-6 items-end'
    }`}>
      {/* 1. Main Chat Widget Frame */}
      <div className={`relative flex flex-col items-end pointer-events-auto transition-all duration-300 ${
        isMaximized ? 'w-full h-full sm:w-[80vw] sm:h-[85vh]' : ''
      }`}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="necn-chatbot-widget-container"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={
                !isMaximized && customSize
                  ? { width: customSize.width, height: customSize.height, maxWidth: '100vw', maxHeight: '100vh' }
                  : {}
              }
              className={`${
                isMaximized 
                  ? 'w-full h-full sm:rounded-3xl rounded-none border-0 sm:border' 
                  : customSize ? 'mb-2 rounded-3xl border' : 'w-[calc(100vw-32px)] sm:w-[440px] h-[75dvh] sm:h-[610px] mb-2 rounded-3xl border'
              } max-h-[100dvh] sm:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
                isDark 
                  ? 'bg-slate-950 border-slate-850 text-slate-100 shadow-indigo-950/20' 
                  : 'bg-white border-slate-200 text-slate-900 shadow-slate-350/30'
              }`}
            >
              {/* Resize Handle Top-Left */}
              {!isMaximized && (
                <div 
                  className="absolute top-0 left-0 w-6 h-6 z-50 cursor-nwse-resize opacity-0 hover:opacity-100 group flex items-start justify-start p-1"
                  onMouseDown={(e) => {
                    setIsResizing(true);
                    const el = document.getElementById("necn-chatbot-widget-container");
                    resizeStartRef.current = {
                      x: e.clientX,
                      y: e.clientY,
                      startWidth: el?.offsetWidth || 440,
                      startHeight: el?.offsetHeight || 610
                    };
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow" />
                </div>
              )}
            {/* Header with Professional branding */}
            <div className={`p-4.5 flex items-center justify-between border-b shrink-0 bg-slate-900 border-slate-850 text-white relative`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <RobotLogo className="w-10 h-10 -ml-1 shrink-0" animate={true} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-bold text-base tracking-tight font-sans">
                    Narayana NEXA
                  </h3>
                </div>
              </div>

              {/* Utility shortcuts */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                  className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                >
                  {language === 'en' ? 'EN' : 'HI'}
                </button>
                <button 
                  id="chatbot-theme-toggle"
                  onClick={() => setIsDark(!isDark)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
                  title="Toggle Dark Mode"
                >
                  {isDark ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 11-7.07 7.07l.707-.707" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>

                <span className="w-[1px] h-4 bg-slate-800 mx-1"></span>

                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                  title={isMaximized ? "Minimize Chat" : "Maximize Chat"}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                  title="Minimize"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Unified High-Fidelity Navigation Tabs */}
            <div className={`px-2 py-1.5 border-b text-[11px] flex items-center justify-around font-semibold shrink-0 select-none ${
              isDark ? 'bg-slate-900 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-650'
            }`}>
              <button
                onClick={() => {
                  setShowTicketForm(false);
                  setActiveTab('chat');
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 ${
                  activeTab === 'chat' && !showTicketForm
                    ? 'bg-blue-550/10 text-blue-650 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {t('chat')}
              </button>

              <button
                onClick={() => {
                  setShowTicketForm(false);
                  setActiveTab('student-portal');
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 ${
                  activeTab === 'student-portal'
                    ? 'bg-blue-550/10 text-blue-650 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                {t('portal')}
              </button>

              <button
                onClick={() => {
                  setShowTicketForm(false);
                  setActiveTab('tracker');
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 ${
                  activeTab === 'tracker'
                    ? 'bg-blue-550/10 text-blue-650 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                {t('tracker')}
              </button>

              <button
                onClick={() => {
                  setShowTicketForm(false);
                  setActiveTab('notices');
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 ${
                  activeTab === 'notices'
                    ? 'bg-blue-550/10 text-blue-650 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                {t('notices')}
              </button>
            </div>

            {/* Dynamic Rendering of Selected View */}
            {showTicketForm ? (
              /* ==================== SCREEN: Ticket Submission Form ==================== */
              <div className={`flex-1 p-5 overflow-y-auto space-y-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-sm">Submit Counseling Ticket</h4>
                  </div>
                  <button 
                    onClick={() => setShowTicketForm(false)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    Back to Chat
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Need direct human evaluation? Fill out your details below and a Narayana Admissions Advisor will review your query. Our alert systems will notify you the exact second an answer gets posted.
                </p>

                {ticketSuccess ? (
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-center space-y-2 py-8">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 animate-bounce" />
                    <div className="font-bold text-sm text-emerald-400">Support Request Synced</div>
                    <p className="text-xs text-slate-400">Broadcasting notification listeners...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 font-mono">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        placeholder="e.g., Sameer Shaik"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 font-mono">Email Address</label>
                        <input
                          type="email"
                          required
                          value={ticketEmail}
                          onChange={(e) => setTicketEmail(e.target.value)}
                          placeholder="yourname@gmail.com"
                          className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 font-mono">Mobile / WhatsApp</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={ticketCountryCode}
                            onChange={(e) => setTicketCountryCode(e.target.value)}
                            className={`w-full sm:w-24 px-2 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'
                            }`}
                          >
                            <option value="+91">+91 (IN)</option>
                            <option value="+1">+1 (US/CA)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+971">+971 (AE)</option>
                            <option value="+65">+65 (SG)</option>
                            <option value="+61">+61 (AU)</option>
                          </select>
                          <input
                            type="tel"
                            required
                            value={ticketPhone}
                            onChange={(e) => setTicketPhone(e.target.value)}
                            placeholder="XXXXX XXXXX"
                            className={`flex-1 w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 font-mono">Detailed Query</label>
                      <textarea
                        rows={3}
                        required
                        value={ticketQuery}
                        onChange={(e) => setTicketQuery(e.target.value)}
                        placeholder="What specific details regarding admissions, fee exemptions, or hostel allocations do you need?"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'
                        }`}
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowTicketForm(false)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        File Direct Ticket
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : activeTab === 'chat' ? (
              /* ==================== SCREEN: Primary Professional Conversation Window ==================== */
              <>
                <div className={`flex-1 p-4 overflow-y-auto relative ${
                  isDark ? 'bg-slate-950/40' : 'bg-slate-50/50'
                }`}>
                  <div className="relative z-10 space-y-4 min-h-full">
                    {/* Background Logo that scrolls with content */}
                    <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none opacity-20 z-[-1]">
                      <img src={nexaLogo} alt="Logo" className="w-64 h-64 object-contain" referrerPolicy="no-referrer" />
                    </div>

                    {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] px-4 py-3 text-sm relative group rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10'
                          : (isDark ? 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-850 shadow-sm' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm')
                      }`}>
                        {/* Bot Answer Rendering */}
                        <p className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                          {msg.sender === 'bot' && msg.id === 'welcome' ? (
                            <TypingText text={msg.text} speed={typingSpeed} />
                          ) : (
                            msg.text
                          )}
                        </p>

                        {/* Interactive metadata footer */}
                        <div className="flex items-center justify-between mt-2.5 gap-4 pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-850">
                          <span className="text-[9px] opacity-60 font-mono">{msg.timestamp}</span>
                          
                          {msg.sender === 'bot' && (
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {/* Score removed per request */}
                              {/* Read Aloud button */}
                              <button
                                type="button"
                                onClick={() => handleSpeak(msg.text, msg.id)}
                                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                  speakingId === msg.id ? 'text-emerald-500' : 'text-slate-400'
                                }`}
                                title="Speak Answer"
                              >
                                <Volume2 className={`w-3.5 h-3.5 ${speakingId === msg.id ? 'animate-pulse' : ''}`} />
                              </button>

                              {/* Clipboard Copy */}
                              <button
                                onClick={() => handleCopyText(msg.text, msg.id)}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
                                title="Copy Response"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>

                              {/* Thumbs Up / Down ratings (Analyzed Chatbot feature) */}
                              <button
                                onClick={() => handleRateResponse(msg.id, 'up')}
                                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                  ratings[msg.id] === 'up' ? 'text-emerald-500' : 'text-slate-400'
                                }`}
                                title="Helpful answer"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRateResponse(msg.id, 'down')}
                                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                  ratings[msg.id] === 'down' ? 'text-rose-500' : 'text-slate-400'
                                }`}
                                title="Unhelpful answer"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Department Contacts Card */}
                      {msg.departmentContact && (
                        <div className={`mt-2 p-3.5 rounded-2xl border w-[85%] text-xs space-y-2 shadow-sm ${
                          isDark ? 'bg-slate-900 border-indigo-950/40 text-slate-300' : 'bg-blue-50/50 border-blue-100 text-blue-900'
                        }`}>
                          <div className="font-semibold flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            Related Office Contact
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {msg.departmentContact.name}
                          </div>
                          <div className="space-y-1 font-mono text-[10px] opacity-90">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{msg.departmentContact.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{msg.departmentContact.email}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Initial Suggestion tags rendering inside welcome message */}
                      {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                        <div className="mt-3.5 flex flex-col gap-1.5 w-full">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 font-mono">Suggested Topics:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedQuestions.map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (q === 'Open Support Ticket Form') {
                                    setShowTicketForm(true);
                                  } else if (q === 'View Main FAQs') {
                                    handleQuickReply('FAQ');
                                  } else {
                                    handleSendMessage(q);
                                  }
                                }}
                                className={`px-3 py-1.5 text-xs rounded-full border text-left transition-all hover:-translate-y-0.5 cursor-pointer ${
                                  isDark
                                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-blue-550'
                                    : 'bg-white border-slate-200 text-slate-750 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                                }`}
                              >
                                {q === 'Open Support Ticket Form' ? (
                                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                    <Ticket className="w-3 h-3 animate-bounce" /> {q}
                                  </span>
                                ) : q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-start">
                      <div className={`rounded-2xl px-3 py-2 border shadow-sm ${
                        isDark ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-100'
                      }`}>
                        <div className="flex space-x-1.5 items-center justify-center h-4">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visual feedback popup indicator */}
                  {ratingMessage && (
                    <div className="text-center p-2 bg-blue-500/10 border border-blue-500/15 rounded-xl text-[10px] text-blue-400 font-mono animate-fade-in">
                      {ratingMessage}
                    </div>
                  )}
                  </div>
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick replies slider bar */}
                <div className={`p-2 border-t flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-thin ${
                  isDark ? 'bg-slate-950/50 border-slate-850' : 'bg-slate-50 border-slate-200'
                }`}>
                  {getDynamicQuickReplies().map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className={`px-2.5 py-1 text-xs rounded-xl border font-medium transition-all cursor-pointer hover:-translate-y-0.5 ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-blue-300 hover:bg-slate-800 hover:text-blue-200'
                          : 'bg-white border-slate-250 text-blue-700 hover:bg-blue-50 hover:text-blue-800'
                      }`}
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* Autocomplete Instant Suggestion Dropdown */}
                {getAutocompleteSuggestions().length > 0 && (
                  <div className={`px-4 py-2 border-t text-xs space-y-1 ${
                    isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-blue-50/70 border-blue-100'
                  }`}>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Instant Matched Knowledge Base Rules
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      {getAutocompleteSuggestions().map((sRule) => (
                        <button
                          type="button"
                          key={sRule.id}
                          onClick={() => handleSendMessage(sRule.question)}
                          className="text-left w-full truncate py-0.5 hover:text-blue-500 font-medium text-slate-650 dark:text-slate-300 cursor-pointer text-[11px] flex items-center gap-1"
                        >
                          • {sRule.question}
                        </button>
                      ))}
                  </div>
                  </div>
                )}

                {/* Chat input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputText);
                  }}
                  className={`p-3 border-t relative z-10 flex gap-2 items-center ${
                    isDark ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleListen}
                    className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                      isListening 
                        ? 'bg-rose-500/20 text-rose-500 animate-pulse border border-rose-500/30' 
                        : (isDark ? 'bg-slate-950 hover:bg-slate-800 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500')
                    }`}
                    title="Speak question"
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask Admissions, placement records, faculty, attendance..."
                    className={`flex-1 px-4 py-2 text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 transition-all ${
                      isDark
                        ? 'bg-slate-950 text-slate-100 border-slate-800 focus:border-blue-550'
                        : 'bg-slate-50 text-slate-900 border-slate-250 focus:border-blue-550'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`p-2.5 rounded-xl text-white font-medium shadow-md transition-all flex items-center justify-center cursor-pointer ${
                      inputText.trim() 
                        ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-blue-600/10' 
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : activeTab === 'student-portal' ? (
              /* ==================== SCREEN: Student Academic Portal ==================== */
              <div className={`flex-1 p-5 overflow-y-auto space-y-4 flex flex-col ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  {/* Attendance Search Section */}
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-850">
                      <GraduationCap className="w-5 h-5 text-blue-500" />
                      <h4 className="font-extrabold text-sm">Attendance & Hall Ticket Status</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Query the Narayana Central Attendance Server (E-Cap sync active). Enter a registered B.Tech hall ticket code (e.g. `26911A0501` to `26911A0510`) to check attendance percentage, internal marks, and condonation status.
                    </p>

                    <form onSubmit={handleStudentPortalSearch} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={searchRegNo}
                        onChange={(e) => setSearchRegNo(e.target.value)}
                        placeholder="e.g. 26911A0501"
                        className={`flex-1 px-3 py-2 text-xs rounded-xl border font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-250 text-slate-900'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSearchingPortal}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        {isSearchingPortal ? (
                          <span className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                        ) : 'Search'}
                      </button>
                    </form>

                    {/* Result Box */}
                    {studentPortalResult && (
                      <div className={`p-4 rounded-2xl border space-y-3.5 shadow-sm animate-fade-in ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">{studentPortalResult.name}</h5>
                            <span className="text-[9px] font-mono text-slate-400 font-bold block mt-0.5">Hall Ticket: {studentPortalResult.regNo}</span>
                            <span className="text-[9px] text-blue-500 font-semibold block">{studentPortalResult.branch}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            studentPortalResult.isSafe 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' 
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/10'
                          }`}>
                            {studentPortalResult.isSafe ? '✅ SAFE' : '⚠️ CONDONATION RISK'}
                          </span>
                        </div>

                        {/* Graphical Attendance ring */}
                        <div className="flex items-center gap-4 bg-slate-500/5 p-3 rounded-xl border border-slate-500/5">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-slate-200 dark:text-slate-800"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={studentPortalResult.isSafe ? "text-emerald-500" : "text-rose-500"}
                                strokeDasharray={`${studentPortalResult.attendance}, 100`}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-extrabold font-mono">{studentPortalResult.attendance}%</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <span className="text-[10px] text-slate-450 block font-mono">Academic Metrics:</span>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-450 block">Cumulative GPA:</span>
                                <strong className="text-slate-800 dark:text-slate-100">{studentPortalResult.cgpa} / 10</strong>
                              </div>
                              <div>
                                <span className="text-slate-450 block">Internal Exams:</span>
                                <strong className="text-slate-800 dark:text-slate-100">{(studentPortalResult.mid1 + studentPortalResult.mid2) / 2} / 25</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 leading-normal font-mono bg-slate-500/5 p-2 rounded-lg">
                          💡 {studentPortalResult.isSafe 
                            ? "Excellent attendance record. You meet the AICTE minimum criteria." 
                            : "Warning: Your percentage is below 75%. Submit a medical certificate to your CSE/ECE advisor immediately."}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Portal Links Section */}
                  {portalItems.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-850">
                        <ExternalLink className="w-5 h-5 text-indigo-500" />
                        <h4 className="font-extrabold text-sm">Portal Links</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {portalItems.map(item => (
                          <a
                            key={item.id}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-3 rounded-xl border text-[11px] font-bold text-center transition-all hover:scale-105 ${
                              isDark 
                                ? 'bg-slate-900 border-slate-800 text-indigo-300 hover:border-indigo-700'
                                : 'bg-white border-slate-200 text-indigo-700 hover:border-indigo-300'
                            }`}
                          >
                            {item.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center text-[9px] text-slate-450 font-mono mt-4">
                    ECAP Data Sync Date: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

            ) : activeTab === 'tracker' ? (
              /* ==================== SCREEN: Unified Ticket Tracker View ==================== */
              <div className={`flex-1 p-5 overflow-y-auto space-y-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-sm">Track Support Ticket</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Enter your email address to trace any offline admissions query. Once the counselor logs a response, it updates here in real-time.
                </p>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={trackerEmail}
                      onChange={(e) => setTrackerEmail(e.target.value)}
                      placeholder="Enter registered Email or Ticket ID..."
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'
                      }`}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <h5 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-mono">
                    Logged Inquiries & Responses
                  </h5>

                  {(() => {
                    const searchClean = trackerEmail.trim().toLowerCase();
                    if (!searchClean) {
                      return (
                        <div className="text-center py-10 text-slate-400 bg-slate-500/5 rounded-xl border border-dashed border-slate-250 dark:border-slate-800">
                          <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs">Enter your email above to check ticket records...</p>
                        </div>
                      );
                    }

                    const matches = supportTickets.filter(t => 
                      t.id.toLowerCase().includes(searchClean) || 
                      t.email.toLowerCase().includes(searchClean) ||
                      (t.studentName || '').toLowerCase().includes(searchClean)
                    );

                    if (matches.length === 0) {
                      return (
                        <div className="text-center py-10 text-slate-400 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                          <p className="text-xs font-semibold text-rose-500">No matching tickets found</p>
                          <p className="text-[11px] text-slate-400 mt-1">Check the spelling of your email or log a new ticket.</p>
                        </div>
                      );
                    }

                    return matches.map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          ticket.status === 'Resolved' 
                            ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10' 
                            : 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10 animate-pulse'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-blue-500 dark:text-blue-400">
                            {ticket.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            ticket.status === 'Resolved' 
                              ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-500/20 dark:text-emerald-450' 
                              : 'bg-amber-100 text-amber-850 dark:bg-amber-500/20 dark:text-amber-455'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Your Inquiry:</span>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">"{ticket.query}"</p>
                          </div>

                          {ticket.status === 'Resolved' ? (
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/15 mt-2 space-y-1">
                              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Helpdesk Counselor Response:
                              </span>
                              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs">
                                {ticket.adminResponse || "Your request has been verified and resolved by our admissions team."}
                              </p>
                              {ticket.respondedAt && (
                                <span className="text-[9px] text-slate-400 block pt-1 font-mono">
                                  Resolved: {new Date(ticket.respondedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-100/50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                              <span className="text-[10px] text-slate-400 font-mono block">Ticket Status:</span>
                              <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                                Your ticket is active in our counseling queue. Our counselors are evaluating your query. You will be alerted via push notification immediately once resolved.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              /* ==================== SCREEN: College Notice Board ==================== */
              <div className={`flex-1 p-5 overflow-y-auto space-y-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold text-sm">Notice Board</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Latest announcements, event circulars, and official college notifications.
                </p>

                <div className="space-y-4 pt-1">
                  {notices.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <p className="text-xs">No active notices at the moment.</p>
                    </div>
                  ) : (
                    notices.map((notice, idx) => (
                      <div 
                        key={notice.id || idx}
                        className={`overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 ${
                          isDark ? 'border-slate-800' : 'border-slate-200'
                        }`}
                      >
                        {notice.imageUrl && (
                          <div className="w-full h-40 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                            <img 
                              src={notice.imageUrl} 
                              alt={notice.title} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white flex-1">{notice.title}</h5>
                            <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap">
                              {notice.date}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {notice.desc}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      
      {/* 2. Floating Circular Launch Button with Airtel/Gitam Branding */}
      <motion.button
        id="chatbot-floating-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-850 text-white flex items-center justify-center shadow-2xl cursor-pointer pointer-events-auto mt-4 border border-slate-800 relative group transition-all duration-300 ${
          !isOpen ? 'animate-border-glow animate-floating' : ''
        }`}
        title="Narayana NEXA Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-slate-300" />
            </motion.div>
          ) : (
            <motion.div
              key="chat-icon"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full flex items-center justify-center p-1"
            >
              <RobotLogo className="w-13 h-13" animate={true} />
              {/* Notification bubble */}
              <span className="absolute top-2.5 right-2.5 w-3.5 h-3.5 bg-rose-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Tooltip hint */}
        {!isOpen && (
          <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-800 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Narayana NEXA Counsel Desk
          </div>
        )}
      </motion.button>
    </div>

    {/* ==================== 3. FIRST-VISIT POPUP OVERLAY ==================== */}
    <AnimatePresence>
      {showFirstVisitPopup && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="max-w-md w-full bg-slate-900 border border-slate-800/80 text-white rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6 relative"
          >
            <button
              onClick={() => setShowFirstVisitPopup(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Logo box */}
            <div className="relative p-5 bg-slate-950/50 rounded-full border border-slate-800 shadow-inner">
              <RobotLogo className="w-24 h-24" animate={true} />
              <span className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping pointer-events-none"></span>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-500/20 font-mono">
                YOUR SMART ASSISTANT
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans mt-2">
                Welcome to Narayana NEXA
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                The Official Digital Assistant of Narayana Engineering College.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  setShowFirstVisitPopup(false);
                  setIsOpen(true);
                  setActiveTab('chat');
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue to Nexa
              </button>
            </div>


          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </React.Fragment>
  );
}

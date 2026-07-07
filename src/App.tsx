/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  fetchCollection, 
  subscribeToCollection, 
  saveSupportTicket,
  saveChatLog,
  clearChatLogs,
  seedDatabase
} from './data/firebaseService';
import { defaultRules, defaultDepartments, defaultCategories, defaultFaculty } from './data/defaultKnowledgeBase';
import { Rule, Department, Faculty, Category, ChatLog, SupportTicket, PortalItem, NoticeItem } from './types';
import CollegePortal from './components/CollegePortal';
import ChatbotWidget from './components/ChatbotWidget';
import AdminDashboard from './components/AdminDashboard';
import NotificationService from './components/NotificationService';
import { Settings, ExternalLink, MessageSquareCode, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation: 'portal' or 'admin'
  const [viewMode, setViewMode] = useState<'portal' | 'admin'>('portal');

  // External forces to open the Chatbot tracker
  const [forceOpenTrackerEmail, setForceOpenTrackerEmail] = useState<string | null>(null);
  const [typingSpeed, setTypingSpeed] = useState<number>(50); // ms per character
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Database States
  const [rules, setRules] = useState<Rule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [portalItems, setPortalItems] = useState<PortalItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  // Load state on startup & listen to query params / keyboard backdoor
  useEffect(() => {
    // Initial fetch and check for seeding
    const initData = async () => {
      const existingRules = await fetchCollection<Rule>('rules');
      if (existingRules.length === 0) {
        await seedDatabase(defaultRules, defaultDepartments, defaultCategories, defaultFaculty);
      }
    };
    initData();

    // Set up subscriptions
    const unsubRules = subscribeToCollection<Rule>('rules', setRules);
    const unsubDepartments = subscribeToCollection<Department>('departments', setDepartments);
    const unsubCategories = subscribeToCollection<Category>('categories', setCategories);
    const unsubFaculty = subscribeToCollection<Faculty>('faculty', setFaculty);
    const unsubTickets = subscribeToCollection<SupportTicket>('supportTickets', setSupportTickets);
    const unsubNotices = subscribeToCollection<NoticeItem>('notices', setNotices);
    const unsubPortal = subscribeToCollection<PortalItem>('portalLinks', setPortalItems);
    const unsubChatLogs = subscribeToCollection<ChatLog>('chatLogs', setChatLogs);

    // Switch to admin if ?admin or ?admin=true is passed in URL
    const params = new URLSearchParams(window.location.search);
    if (params.has('admin')) {
      setViewMode('admin');
    }

    // Secret backdoor key combo: Ctrl+Shift+A / Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setViewMode(prev => prev === 'portal' ? 'admin' : 'portal');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubRules();
      unsubDepartments();
      unsubCategories();
      unsubFaculty();
      unsubTickets();
      unsubNotices();
      unsubPortal();
      unsubChatLogs();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAddLog = (newLog: ChatLog) => {
    saveChatLog(newLog);
  };

  const handleClearLogs = () => {
    clearChatLogs();
  };

  const handleAddSupportTicket = (newTicket: SupportTicket) => {
    saveSupportTicket(newTicket);
  };

  const handleUpdateSupportTickets = (updatedTickets: SupportTicket[]) => {
    // In Firestore model, we usually update individual tickets. 
    // This handler from AdminDashboard might need adjustment to save each one or we can just ignore it if AdminDashboard handles it itself.
    // For now, let's just update the local state which is fine since we have a subscription.
    setSupportTickets(updatedTickets);
  };

  const handleUpdateRules = (newRules: Rule[]) => {
    setRules(newRules);
  };

  const handleResetAll = async () => {
    await seedDatabase(defaultRules, defaultDepartments, defaultCategories, defaultFaculty);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin header - Only shown when explicitly in admin mode */}
      {viewMode === 'admin' && (
        <div className="bg-slate-900 border-b border-slate-800 text-white px-5 py-3 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase text-slate-200 font-mono text-sm animate-pulse">
              NARAYANA NEXA — ADMIN COMMAND CENTRE
            </span>
            <span className="text-slate-500 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline font-medium">Private Database Sync Mode</span>
          </div>
          <button
            onClick={() => setViewMode('portal')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow"
          >
            ← Return to Public College Website
          </button>
        </div>
      )}

      {/* Main Viewport Shell */}
      <main className="flex-1 flex flex-col">
        {viewMode === 'portal' ? (
          <div className="flex-1 relative flex flex-col">
            {/* The College Home screen */}
            <CollegePortal 
              departments={departments} 
              faculty={faculty} 
              onOpenAdmin={() => setViewMode('admin')} 
            />
            {/* Floating widget mapped to synchronized db rules */}
            <ChatbotWidget 
              rules={rules} 
              departments={departments} 
              supportTickets={supportTickets}
              portalItems={portalItems}
              notices={notices}
              onAddLog={handleAddLog} 
              onAddSupportTicket={handleAddSupportTicket}
              forceOpenTrackerEmail={forceOpenTrackerEmail}
              onClearForceTrackerEmail={() => setForceOpenTrackerEmail(null)}
              typingSpeed={typingSpeed}
              isMaximized={isMaximized}
              setIsMaximized={setIsMaximized}
            />
          </div>
        ) : (
          <AdminDashboard
            rules={rules}
            departments={departments}
            faculty={faculty}
            categories={categories}
            chatLogs={chatLogs}
            supportTickets={supportTickets}
            portalItems={portalItems}
            calendarItems={notices}
            onUpdateRules={handleUpdateRules}
            onUpdatePortalItems={setPortalItems}
            onUpdateCalendarItems={setNotices}
            onClearLogs={handleClearLogs}
            onUpdateSupportTickets={handleUpdateSupportTickets}
            onResetAll={handleResetAll}
            typingSpeed={typingSpeed}
            setTypingSpeed={setTypingSpeed}
          />
        )}
      </main>

      {/* Global simulated Email and WhatsApp push notification service */}
      <NotificationService 
        supportTickets={supportTickets}
        onOpenTracker={(email) => {
          setForceOpenTrackerEmail(email);
          setViewMode('portal');
        }}
        onUpdateSupportTickets={handleUpdateSupportTickets}
      />
    </div>
  );
}

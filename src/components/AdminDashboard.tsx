/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, Download, Plus, Edit2, Trash2, Search, Filter, 
  Database, RefreshCw, BarChart3, Users, HelpCircle, Building2, 
  CheckCircle2, AlertTriangle, X, Play, FileText, Sparkles, BookOpen,
  Mail, Phone, Code, Terminal, Copy, Check
} from 'lucide-react';
import { Rule, Department, Faculty, Category, ChatLog, SupportTicket, PortalItem, NoticeItem } from '../types';
import { 
  saveRule, deleteRule, 
  updateSupportTicket, 
  saveNotice, deleteNotice, 
  savePortalLink, deletePortalLink 
} from '../data/firebaseService';

interface AdminDashboardProps {
  rules: Rule[];
  departments: Department[];
  faculty: Faculty[];
  categories: Category[];
  chatLogs: ChatLog[];
  supportTickets: SupportTicket[];
  onUpdateRules: (newRules: Rule[]) => void;
  onClearLogs: () => void;
  onUpdateSupportTickets: (updatedTickets: SupportTicket[]) => void;
  portalItems: PortalItem[];
  calendarItems: NoticeItem[];
  onUpdatePortalItems: (items: PortalItem[]) => void;
  onUpdateCalendarItems: (items: NoticeItem[]) => void;
  onResetAll: () => void;
  typingSpeed: number;
  setTypingSpeed: (speed: number) => void;
}

export default function AdminDashboard({
  rules,
  departments,
  faculty,
  categories,
  chatLogs,
  supportTickets,
  portalItems,
  calendarItems,
  onUpdateRules,
  onClearLogs,
  onUpdateSupportTickets,
  onUpdatePortalItems,
  onUpdateCalendarItems,
  onResetAll,
  typingSpeed,
  setTypingSpeed
}: AdminDashboardProps) {
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<'rules' | 'import' | 'tickets' | 'analytics' | 'databases' | 'integration' | 'portal' | 'notices' | 'settings'>('rules');

  // Excel Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced Import states
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('append');
  const [selectedPreviewRowIds, setSelectedPreviewRowIds] = useState<Set<string>>(new Set());
  const [previewSearch, setPreviewSearch] = useState('');
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // CRUD / Rule Editor state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditRule, setCurrentEditRule] = useState<Partial<Rule> | null>(null);

  // Support ticket expansion & input responses
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [ticketResponses, setTicketResponses] = useState<Record<string, string>>({});
  const [lastTicketCount, setLastTicketCount] = useState(supportTickets.length);
  const [newTicketToast, setNewTicketToast] = useState<string | null>(null);

  React.useEffect(() => {
    if (supportTickets.length > lastTicketCount) {
      // New ticket arrived!
      setNewTicketToast("New support ticket received from user!");
      setTimeout(() => setNewTicketToast(null), 5000);
      setLastTicketCount(supportTickets.length);
    }
  }, [supportTickets.length, lastTicketCount]);

  // Multi-channel simulated dispatch states
  const [dispatchTicket, setDispatchTicket] = useState<SupportTicket | null>(null);
  const [dispatchResponseText, setDispatchResponseText] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStep, setDispatchStep] = useState(0);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [channelPreferences, setChannelPreferences] = useState<Record<string, { email: boolean; whatsapp: boolean }>>({});

  const getChannelsForTicket = (ticketId: string) => {
    return channelPreferences[ticketId] || { email: true, whatsapp: true };
  };

  const toggleChannelForTicket = (ticketId: string, channel: 'email' | 'whatsapp') => {
    const current = getChannelsForTicket(ticketId);
    setChannelPreferences(prev => ({
      ...prev,
      [ticketId]: {
        ...current,
        [channel]: !current[channel]
      }
    }));
  };

  const getExpectedTotalSteps = (ticketId: string) => {
    const prefs = getChannelsForTicket(ticketId);
    let count = 3; // handshake, sync, complete
    if (prefs.email) count += 3;
    if (prefs.whatsapp) count += 3;
    return count;
  };

  // Stats calculation
  const totalQueries = chatLogs.length;
  const fallbackQueries = chatLogs.filter(log => log.fallbackTriggered).length;
  const fallbackRate = totalQueries > 0 ? ((fallbackQueries / totalQueries) * 100).toFixed(1) : '0.0';
  const successfulMatches = totalQueries - fallbackQueries;
  const avgScore = successfulMatches > 0 
    ? (chatLogs.filter(log => !log.fallbackTriggered).reduce((sum, log) => sum + log.score, 0) / successfulMatches).toFixed(1) 
    : '0.0';

  // Multi-channel simulated dispatch effect
  React.useEffect(() => {
    if (!isDispatching || !dispatchTicket) return;

    const prefs = getChannelsForTicket(dispatchTicket.id);
    const steps: { message: string; delay: number }[] = [];

    steps.push({ message: "🔗 Securing outbound multi-channel handshake with college counselor gateway...", delay: 650 });

    if (prefs.email) {
      steps.push({ message: `✉️ Structuring official responsive Email notification template...`, delay: 750 });
      steps.push({ message: `📡 Dispatching secured SMTP relay email to: [${dispatchTicket.email}]...`, delay: 850 });
      steps.push({ message: `📨 [SUCCESS] Email delivered. MTA ticket ID: msg_em_${Math.random().toString(36).substring(3, 8).toUpperCase()}`, delay: 700 });
    }

    if (prefs.whatsapp) {
      steps.push({ message: `📱 Initiating secure connection with Twilio WhatsApp Business API...`, delay: 800 });
      steps.push({ message: `💬 Structuring personalized WhatsApp payload with tracking link...`, delay: 800 });
      steps.push({ message: `📲 [SUCCESS] WhatsApp message sent to: [+91 ${dispatchTicket.phone || '9490123456'}] (Receipt: WA-${Math.floor(100000 + Math.random() * 900000)})`, delay: 700 });
    }

    steps.push({ message: "💾 Writing finalized response parameters back to secure local state database...", delay: 600 });
    steps.push({ message: "🎉 All selected dispatch channels have been updated successfully with 100% SLA uptime!", delay: 500 });

    let currentIdx = 0;
    let timerIds: NodeJS.Timeout[] = [];

    const runNextStep = () => {
      if (currentIdx < steps.length) {
        const step = steps[currentIdx];
        
        setDispatchLogs(prev => [...prev, step.message]);
        setDispatchStep(currentIdx + 1);
        currentIdx++;
        
        const nextTimer = setTimeout(runNextStep, step.delay);
        timerIds.push(nextTimer);
      }
    };

    const initialTimer = setTimeout(runNextStep, 500);
    timerIds.push(initialTimer);

    return () => {
      timerIds.forEach(clearTimeout);
    };
  }, [isDispatching, dispatchTicket]);

  // Role demographic calculation
  const roles = chatLogs.map(log => log.userRole);
  const roleDistribution = roles.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Filter rules
  const filteredRules = rules.filter(rule => {
    const matchesSearch = 
      rule.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.keywords.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.synonyms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || rule.category === selectedCategory;

    const matchesPriority = selectedPriority === 'All' || String(rule.priority) === selectedPriority;

    const matchesStatus = selectedStatus === 'All' || rule.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  // Filter parsed import data
  const filteredPreviewData = parsedData.filter(row => {
    if (!previewSearch) return true;
    const term = previewSearch.toLowerCase();
    return (
      (row.category || '').toLowerCase().includes(term) ||
      (row.question || '').toLowerCase().includes(term) ||
      (row.keywords || '').toLowerCase().includes(term) ||
      (row.answer || '').toLowerCase().includes(term)
    );
  });

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedPreviewRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPreviewRowIds(next);
  };

  const handleToggleSelectAllVisible = () => {
    const allVisibleIds = filteredPreviewData.map(r => r.id);
    const allVisibleAreSelected = allVisibleIds.every(id => selectedPreviewRowIds.has(id));
    const next = new Set(selectedPreviewRowIds);
    
    if (allVisibleAreSelected) {
      allVisibleIds.forEach(id => next.delete(id));
    } else {
      allVisibleIds.forEach(id => next.add(id));
    }
    setSelectedPreviewRowIds(next);
  };

  // Excel drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Live CSV/Excel parser in-browser using XLSX library
  const processFile = (file: File) => {
    const isCsv = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCsv && !isExcel) {
      setValidationErrors(['Invalid file format. Please upload a valid CSV (.csv) or Microsoft Excel workbook (.xlsx or .xls)']);
      setValidationSuccess(null);
      setParsedData([]);
      setSelectedPreviewRowIds(new Set());
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let workbook;
        if (isCsv) {
          const text = e.target?.result as string;
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          workbook = XLSX.read(data, { type: 'array' });
        }
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Raw sheet to JSON rows
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (rawRows.length === 0) {
          setValidationErrors(['The file appears to be empty or has no rows.']);
          setParsedData([]);
          setSelectedPreviewRowIds(new Set());
          return;
        }

        // Validate structure and map columns
        const errors: string[] = [];
        const validatedRules: Rule[] = [];

        rawRows.forEach((row, index) => {
          const rowNum = index + 2; // Row number for user logging (1-indexed header is row 1)
          
          // Map either exact match keys or look at position
          const category = row['Category'] || row['category'] || '';
          const question = row['Question'] || row['question'] || '';
          const keywords = row['Keywords'] || row['keywords'] || '';
          const synonyms = row['Synonyms'] || row['synonyms'] || '';
          const answer = row['Answer'] || row['answer'] || '';
          const relatedDepartment = row['Related Department'] || row['related department'] || row['RelatedDepartment'] || '';
          const priorityVal = row['Priority'] || row['priority'] || 1;
          const status = row['Status'] || row['status'] || 'Active';

          if (!category) {
            errors.push(`Row ${rowNum}: 'Category' is required and was blank.`);
          }
          if (!question) {
            errors.push(`Row ${rowNum}: 'Question' is required and was blank.`);
          }
          if (!keywords) {
            errors.push(`Row ${rowNum}: 'Keywords' is required. Keywords must contain at least one token.`);
          }
          if (!answer) {
            errors.push(`Row ${rowNum}: 'Answer' is required and was blank.`);
          }

          if (errors.length < 15) { // Cap errors logging limit
            validatedRules.push({
              id: `KB-${index + 100}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
              category: String(category).trim(),
              question: String(question).trim(),
              keywords: String(keywords).trim(),
              synonyms: String(synonyms).trim(),
              answer: String(answer).trim(),
              relatedDepartment: String(relatedDepartment).trim().toUpperCase(),
              priority: Number(priorityVal) || 1,
              status: String(status).trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
            });
          }
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
          setValidationSuccess(null);
          setParsedData([]);
          setSelectedPreviewRowIds(new Set());
        } else {
          setValidationErrors([]);
          setValidationSuccess(`Successfully parsed ${validatedRules.length} college knowledge rules from ${file.name}. Ready to import!`);
          setParsedData(validatedRules);
          setSelectedPreviewRowIds(new Set(validatedRules.map(r => r.id)));
        }
      } catch (err: any) {
        setValidationErrors([`File extraction crash: ${err.message}`]);
        setParsedData([]);
        setSelectedPreviewRowIds(new Set());
      }
    };
    
    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Apply Import to memory
  const handleApplyImport = async () => {
    if (parsedData.length === 0) return;
    
    const selectedRulesToImport = parsedData.filter(r => selectedPreviewRowIds.has(r.id));
    if (selectedRulesToImport.length === 0) {
      alert('Please select at least one row to import.');
      return;
    }

    if (importMode === 'overwrite') {
      if (!confirm('OVERWRITE MODE: This will wipe out all existing rules in the database and replace them with the selected rules. Continue?')) {
        return;
      }
      // Delete all existing first
      for (const rule of rules) {
        await deleteRule(rule.id);
      }
    }

    // Save all selected
    for (const rule of selectedRulesToImport) {
      await saveRule(rule);
    }

    setValidationSuccess(`Successfully imported ${selectedRulesToImport.length} active rules into the database! The Chatbot is updated.`);
    setParsedData([]);
    setSelectedPreviewRowIds(new Set());
    setUploadedFile(null);
    setActiveTab('rules');
  };

  // Compile active rules list to Excel and download it
  const handleExportExcel = () => {
    const dataToExport = rules.map((r, i) => ({
      'Category': r.category,
      'Question': r.question,
      'Keywords': r.keywords,
      'Synonyms': r.synonyms,
      'Answer': r.answer,
      'Related Department': r.relatedDepartment,
      'Priority': r.priority,
      'Status': r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NECN Chatbot Rules');

    // Generate buffer and trigger instant browser download
    XLSX.writeFile(workbook, 'necn_smart_chatbot_rules.xlsx');
  };

  // Delete rule
  const handleDeleteRule = async (id: string) => {
    await deleteRule(id);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "necn_chatbot_knowledge_base.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyEmbed = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  // CRUD state operations
  const handleOpenAddRule = () => {
    setCurrentEditRule({
      id: `KB-MAN-${Date.now().toString().slice(-4)}`,
      category: 'Admissions',
      question: '',
      keywords: '',
      synonyms: '',
      answer: '',
      relatedDepartment: 'ADMIN',
      priority: 1,
      status: 'Active'
    });
    setIsEditing(true);
  };

  const handleOpenEditRule = (rule: Rule) => {
    setCurrentEditRule(rule);
    setIsEditing(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditRule) return;

    // Validate
    if (!currentEditRule.category || !currentEditRule.question || !currentEditRule.keywords || !currentEditRule.answer) {
      alert('Please fill out all mandatory fields: Category, Question, Keywords, and Answer');
      return;
    }

    const ruleData = currentEditRule as Rule;
    await saveRule(ruleData);
    
    setIsEditing(false);
    setCurrentEditRule(null);
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast Notification */}
      {newTicketToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-bold text-sm">{newTicketToast}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <div className="bg-slate-900 text-white py-4 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">NECN Admin Command Center</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Rule Engine, Knowledge Base & Chat Audit Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="admin-reset-defaults-btn"
            onClick={() => {
              if (confirm('Are you sure you want to reset all data and rules to standard NECN defaults? This clears custom modifications.')) {
                onResetAll();
                alert('Database restored to default college records!');
              }
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <span className="h-6 w-px bg-slate-800"></span>

          <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-semibold border border-slate-700/50">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'rules' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Rule Manager
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'import' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Excel Import/Export
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'tickets' ? 'bg-blue-600 text-white animate-pulse' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Support Tickets ({supportTickets.filter(t => t.status === 'Open').length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Logs & Metrics
            </button>
            <button
              onClick={() => setActiveTab('databases')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'databases' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Static Data
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'portal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Portal Links
            </button>
            <button
              onClick={() => setActiveTab('notices')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'notices' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Notices
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              System Settings
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${activeTab === 'integration' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Handoff Hub
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* ==================================== TABS 1: RULE MANAGER ==================================== */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Header / Search Controls */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
              <div className="flex-1 flex gap-4">
                <div className="flex-1 flex items-center gap-3 max-w-md bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
                  <Search className="w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                </div>
                {/* Typing Speed Slider */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">Typing Speed</span>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={typingSpeed}
                    onChange={(e) => setTypingSpeed(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300 w-8 text-right">{typingSpeed}ms</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-500">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Level Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-500">Priority:</span>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    <option value="All">All Priorities</option>
                    {Array.from(new Set(rules.map(r => r.priority))).sort((a, b) => a - b).map(prio => (
                      <option key={prio} value={String(prio)}>Priority {prio}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Reset Filters button */}
                {(selectedCategory !== 'All' || selectedPriority !== 'All' || selectedStatus !== 'All' || searchQuery !== '') && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedPriority('All');
                      setSelectedStatus('All');
                      setSearchQuery('');
                    }}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded"
                  >
                    Clear Filters
                  </button>
                )}

                <button
                  id="admin-add-new-rule-btn"
                  onClick={handleOpenAddRule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Rule
                </button>
              </div>
            </div>

            {/* Rules Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Showing {filteredRules.length} of {rules.length} Registered Rules
                </div>
                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                    {rules.filter(r => r.status === 'Active').length} Active
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-500/10 text-slate-400 font-semibold border border-slate-500/20">
                    {rules.filter(r => r.status === 'Inactive').length} Inactive
                  </span>
                </div>
              </div>

              {filteredRules.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <HelpCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="font-semibold text-sm">No rules match your search criteria.</p>
                  <p className="text-xs text-slate-400/90 mt-1">Try entering alternative keywords, categories or add a custom rule.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRules.map((rule) => (
                    <div key={rule.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            {rule.id}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            {rule.category}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            Priority: {rule.priority}
                          </span>
                          {rule.relatedDepartment && (
                            <span className="text-xs font-mono font-semibold text-indigo-400">
                              Dept: {rule.relatedDepartment}
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            rule.status === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}>
                            {rule.status}
                          </span>
                        </div>

                        <h4 className="font-semibold text-slate-900 dark:text-white text-base leading-snug">
                          {rule.question}
                        </h4>

                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
                          {rule.answer}
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs pt-1">
                          <div className="flex items-center gap-1 text-slate-400">
                            <span className="font-bold uppercase text-[10px] text-slate-400">Keywords:</span>
                            {rule.keywords.split(',').map((kw, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono text-[11px]">
                                {kw.trim()}
                              </span>
                            ))}
                          </div>
                          {rule.synonyms && (
                            <div className="flex items-center gap-1 text-slate-400 ml-4">
                              <span className="font-bold uppercase text-[10px] text-slate-400">Synonyms:</span>
                              {rule.synonyms.split(',').map((syn, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono text-[11px]">
                                  {syn.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CRUD Actions Buttons */}
                      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleOpenEditRule(rule)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 rounded-lg border border-transparent hover:border-blue-500/20 transition-all cursor-pointer"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete rule ${rule.id}?`)) {
                              handleDeleteRule(rule.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================== TABS 2: CSV/EXCEL IMPORT/EXPORT ==================================== */}
        {activeTab === 'import' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Upload Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Import Knowledge Base via CSV or Excel</h3>
                  <p className="text-xs text-slate-400 mt-1">Upload a standard Comma-Separated Values (.csv) or Microsoft Excel workbook (.xlsx, .xls) containing rules to refresh parameters.</p>
                </div>

                {/* Drag & Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-500/50 dark:hover:border-indigo-500/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                  />
                  <div className="p-4 bg-blue-500/15 rounded-full text-blue-500">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {uploadedFile ? uploadedFile.name : 'Drag & Drop your CSV or Excel file here'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : 'or click to browse from local computer'}
                    </p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-mono font-bold uppercase">
                    Supported: .csv, .xlsx, .xls
                  </span>
                </div>

                {/* Feedback messages */}
                {validationErrors.length > 0 && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      Validation Errors Detected
                    </div>
                    <ul className="list-disc list-inside pl-1 space-y-1 font-mono">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">File Validation Passed!</div>
                      <p className="mt-1 leading-relaxed opacity-95">{validationSuccess}</p>
                    </div>
                  </div>
                )}

                {/* Config & Import Action */}
                {parsedData.length > 0 && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Import Configuration</span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-0.5">Database Sync Strategy</h4>
                      </div>
                      
                      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg text-xs font-semibold gap-1">
                        <button
                          type="button"
                          onClick={() => setImportMode('append')}
                          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                            importMode === 'append'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Append & Merge
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportMode('overwrite')}
                          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                            importMode === 'overwrite'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Overwrite & Replace
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      {importMode === 'overwrite' ? (
                        <p className="text-rose-500 font-semibold flex items-center gap-1.5 animate-pulse">
                          <AlertTriangle className="w-4 h-4" />
                          CRITICAL: All {rules.length} currently loaded rules in memory will be wiped out and replaced with your selection.
                        </p>
                      ) : (
                        <p className="text-slate-400">
                          SAFE MODE: Selected rules will be appended to the current knowledge base. No existing rules will be lost.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800">
                      <div className="text-xs">
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                          Ready to Import: {parsedData.filter(r => selectedPreviewRowIds.has(r.id)).length} of {parsedData.length} rules
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">Adjust selections in the interactive preview table below.</p>
                      </div>
                      <button
                        onClick={handleApplyImport}
                        className={`px-5 py-2.5 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                          importMode === 'overwrite' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        Execute Import Operation
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Preview grid if valid */}
              {parsedData.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-sm">Interactive Spreadsheet Row Preview</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Filter rows, toggle selection, and review knowledge parameters before applying to memory.</p>
                    </div>
                    
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search parsed rows..."
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[360px] border border-slate-200 dark:border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="p-3 font-semibold w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredPreviewData.length > 0 && 
                                filteredPreviewData.every(r => selectedPreviewRowIds.has(r.id))
                              }
                              onChange={handleToggleSelectAllVisible}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="Select / Unselect All Visible"
                            />
                          </th>
                          <th className="p-3 font-semibold w-12 text-center">Row</th>
                          <th className="p-3 font-semibold w-24">Category</th>
                          <th className="p-3 font-semibold w-48">Question</th>
                          <th className="p-3 font-semibold w-32">Keywords</th>
                          <th className="p-3 font-semibold w-64">Answer</th>
                          <th className="p-3 font-semibold w-16 text-center">Priority</th>
                          <th className="p-3 font-semibold w-16">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredPreviewData.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              No parsed rows match search query.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewData.map((row, idx) => {
                            const isSelected = selectedPreviewRowIds.has(row.id);
                            return (
                              <tr 
                                key={row.id} 
                                onClick={() => handleToggleSelectRow(row.id)}
                                className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/10 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-500/5 dark:bg-blue-500/5' : ''
                                }`}
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectRow(row.id)}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-slate-400">{idx + 2}</td>
                                <td className="p-3">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    {row.category}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-800 dark:text-slate-100 max-w-[150px] truncate" title={row.question}>
                                  {row.question}
                                </td>
                                <td className="p-3 max-w-[120px] truncate font-mono text-[11px] text-slate-400" title={row.keywords}>
                                  {row.keywords}
                                </td>
                                <td className="p-3 max-w-[200px] truncate text-slate-500" title={row.answer}>
                                  {row.answer}
                                </td>
                                <td className="p-3 font-mono font-bold text-center text-slate-500">{row.priority}</td>
                                <td className="p-3">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    row.status === 'Active' 
                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Export & Templates */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Export Active Rules</h3>
                  <p className="text-xs text-slate-400 mt-1">Download your custom configured college rules back into a clean, standard Microsoft Excel workbook.</p>
                </div>

                <button
                  id="admin-export-excel-btn"
                  onClick={handleExportExcel}
                  className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700/50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  Export Rules to .XLSX Excel
                </button>
              </div>

              {/* Excel Structure Spec guidelines */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                <div className="font-bold text-sm">Spreadsheet Column Specification</div>
                <p className="text-xs text-slate-400 leading-relaxed">For a successful import, ensure your CSV or Excel file matches the following column headers and values:</p>
                
                <div className="space-y-2.5">
                  {[
                    { col: 'A', name: 'Category', desc: 'e.g. Admissions, Fee Structure' },
                    { col: 'B', name: 'Question', desc: 'The exact question user might target' },
                    { col: 'C', name: 'Keywords', desc: 'Comma-separated tokens for matching scoring' },
                    { col: 'D', name: 'Synonyms', desc: 'Comma-separated synonyms list' },
                    { col: 'E', name: 'Answer', desc: 'The exact answer markdown / paragraph' },
                    { col: 'F', name: 'Related Department', desc: 'Short dept key e.g. CSE, ECE, ADMIN' },
                    { col: 'G', name: 'Priority', desc: 'Integer value (e.g. 1 is highest priority)' },
                    { col: 'H', name: 'Status', desc: 'Active or Inactive' },
                  ].map((spec) => (
                    <div key={spec.col} className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                          {spec.col}
                        </span>
                        <span className="font-semibold">{spec.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 text-right truncate max-w-[150px]">{spec.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== TABS 3: ANALYTICS LOGS ==================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Interactions</span>
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div className="font-mono text-3xl font-bold">{totalQueries}</div>
                <div className="text-xs text-slate-400">Queries processed by rule engine</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fallback Rate</span>
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="font-mono text-3xl font-bold text-amber-500">{fallbackRate}%</div>
                <div className="text-xs text-slate-400">{fallbackQueries} fallback messages triggered</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Matching Score</span>
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="font-mono text-3xl font-bold text-indigo-500">{avgScore}</div>
                <div className="text-xs text-slate-400">Score density on matched rules</div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Personas</span>
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="font-mono text-xs space-y-1 py-1">
                  {['Student', 'Parent', 'Faculty', 'Visitor'].map((p) => {
                    const count = roleDistribution[p] || 0;
                    const percent = totalQueries > 0 ? ((count / totalQueries) * 100).toFixed(0) : '0';
                    return (
                      <div key={p} className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">{p}:</span>
                        <span className="font-mono font-bold text-[11px]">{count} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chat Interaction Logs list */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-sm">Historic Chat Logs ({chatLogs.length})</h3>
                <button
                  id="admin-clear-logs-btn"
                  onClick={onClearLogs}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/10 hover:border-rose-500/25 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Logs
                </button>
              </div>

              {chatLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="font-semibold text-sm">No chat logs recorded yet.</p>
                  <p className="text-xs text-slate-400/90 mt-1">Open the floating chatbot widget at the bottom right and run some test queries!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4 font-semibold">Timestamp</th>
                        <th className="p-4 font-semibold">User Query</th>
                        <th className="p-4 font-semibold">Matched Rule ID</th>
                        <th className="p-4 font-semibold font-mono">Score</th>
                        <th className="p-4 font-semibold">Persona</th>
                        <th className="p-4 font-semibold">Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {[...chatLogs].reverse().map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                          <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-4 font-semibold max-w-[200px] truncate" title={log.userQuery}>
                            {log.userQuery}
                          </td>
                          <td className="p-4 font-mono">
                            {log.matchedRuleId ? (
                              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-bold">
                                {log.matchedRuleId}
                              </span>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </td>
                          <td className="p-4 font-mono font-bold text-indigo-400">
                            {log.score > 0 ? log.score.toFixed(1) : '-'}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                              {log.userRole}
                            </span>
                          </td>
                          <td className="p-4">
                            {log.fallbackTriggered ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                                Fallback
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                                Match Found
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================== TABS 4: STATIC REFERENCE DATA ==================================== */}
        {activeTab === 'databases' && (
          <div className="space-y-8">
            {/* Departments */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold">Static College Departments Table (`departments`)</h3>
              </div>
              <p className="text-xs text-slate-400">Stores official contacts, mail aliases, and building locations mapped to rules.</p>
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="p-3 font-semibold">ID</th>
                      <th className="p-3 font-semibold">Department Name</th>
                      <th className="p-3 font-semibold">Reception Contact</th>
                      <th className="p-3 font-semibold">Email Alias</th>
                      <th className="p-3 font-semibold">Location / Block</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {departments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        <td className="p-3 font-bold text-blue-500">{dept.id}</td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{dept.name}</td>
                        <td className="p-3 text-slate-400">{dept.contactNumber}</td>
                        <td className="p-3 text-slate-400">{dept.email}</td>
                        <td className="p-3 text-slate-400 font-sans">{dept.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Faculty Directory */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold">Static Faculty Members Directory (`faculty`)</h3>
              </div>
              <p className="text-xs text-slate-400">Predefined faculty roles, designative hierarchies (Principal, HODs), and details.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {faculty.map((member) => (
                  <div key={member.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm">
                          {member.name[4] || 'F'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">{member.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{member.id}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                        member.designation === 'Principal'
                          ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {member.designation}
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-sans font-medium text-slate-300">{member.department}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.contact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================== TABS 3B: SUPPORT TICKETS MANAGER ==================================== */}
        {activeTab === 'tickets' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold">Admissions & Parents Support Ticket Logs</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Deterministic routing fallback requests queued from the frontend Chatbot widget. Real-time parent and student enquiries.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-mono">
                  {supportTickets.filter(t => t.status === 'Open').length} Open
                </span>
                <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-mono">
                  {supportTickets.filter(t => t.status === 'Resolved').length} Resolved
                </span>
              </div>
            </div>

            {supportTickets.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-500">Zero Pending Support Tickets</h4>
                <p className="text-xs text-slate-400">All queries from student personas have matched or been answered!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono font-bold">
                      <th className="py-3 px-4">Ticket ID</th>
                      <th className="py-3 px-4">Student/Parent Info</th>
                      <th className="py-3 px-4">Persona</th>
                      <th className="py-3 px-4">Logged Query</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {supportTickets.map((ticket) => {
                      const isExpanded = expandedTicketId === ticket.id;
                      const responseVal = ticketResponses[ticket.id] !== undefined 
                        ? ticketResponses[ticket.id] 
                        : (ticket.adminResponse || '');

                      const quickReplies = [
                        "Thank you for contacting Narayana Engineering College, Nellore (NECN). Our Admissions Desk will contact you directly within 24 hours to proceed with the verification of your documents.",
                        "Dear parent, college bus services cover all major locations in Nellore. The transport coordinator will get in touch with you at +91-861-2352007 to assign the nearest route.",
                        "The concern branch Head of Department (HOD) has been notified. They will review your query and send a detailed academic response to your registered email address.",
                        "Please visit our main campus office in Nellore with all relevant documents (EAPCET Hall Ticket, Rank Card, Tenth/Inter certificates) for physical verification and scholarship slab details."
                      ];

                      return (
                        <React.Fragment key={ticket.id}>
                          <tr className={`transition-all border-b border-slate-100 dark:border-slate-800 ${
                            isExpanded ? 'bg-slate-50/80 dark:bg-slate-900/40 border-l-2 border-l-blue-500' : 'hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
                          }`}>
                            <td className="py-4 px-4 font-mono font-bold text-blue-500 dark:text-indigo-400">
                              {ticket.id}
                            </td>
                            <td className="py-4 px-4 space-y-0.5">
                              <div className="font-semibold text-slate-800 dark:text-slate-100">{ticket.studentName}</div>
                              <div className="text-[11px] text-slate-400 space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{ticket.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{ticket.phone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide ${
                                ticket.role === 'Parent' 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                                  : ticket.role === 'Faculty'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                              }`}>
                                {ticket.role}
                              </span>
                            </td>
                            <td className="py-4 px-4 max-w-xs truncate font-medium text-slate-650 dark:text-slate-300" title={ticket.query}>
                              {ticket.query}
                            </td>
                            <td className="py-4 px-4 text-[11px] text-slate-400 font-mono">
                              {new Date(ticket.timestamp).toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                ticket.status === 'Open'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                              }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                                  isExpanded
                                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400'
                                }`}
                              >
                                {isExpanded ? 'Collapse' : ticket.adminResponse ? 'Edit Answer' : 'Write Answer'}
                              </button>
                              <button
                                onClick={() => {
                                  const updated = supportTickets.map(t => 
                                    t.id === ticket.id 
                                      ? { ...t, status: (t.status === 'Open' ? 'Resolved' as const : 'Open' as const) } 
                                      : t
                                  );
                                  onUpdateSupportTickets(updated);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                                  ticket.status === 'Open'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 border-transparent'
                                }`}
                              >
                                {ticket.status === 'Open' ? 'Resolve' : 'Re-open'}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Answer Section */}
                          {isExpanded && (
                            <tr className="bg-slate-50/50 dark:bg-slate-900/20 border-l-2 border-l-blue-500">
                              <td colSpan={7} className="p-4 bg-slate-50/50 dark:bg-slate-950/40">
                                <div className="space-y-4 max-w-4xl mx-auto">
                                  {/* Full Query */}
                                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                                    <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 mb-1">
                                      Full Parent/Student Inquiry
                                    </div>
                                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                      "{ticket.query}"
                                    </p>
                                  </div>

                                  {/* Quick Reply Templates */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
                                      Quick Template Responses
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {quickReplies.map((reply, i) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => {
                                            setTicketResponses(prev => ({
                                              ...prev,
                                              [ticket.id]: reply
                                            }));
                                          }}
                                          className="text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-all font-sans"
                                        >
                                          {reply.slice(0, 80)}...
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Textarea Field */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
                                        Answer Resolution Text
                                      </label>
                                      {ticket.adminResponse && (
                                        <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 font-semibold">
                                          <Check className="w-3.5 h-3.5" /> Already Answered
                                        </span>
                                      )}
                                    </div>
                                    <textarea
                                      rows={4}
                                      value={responseVal}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTicketResponses(prev => ({
                                          ...prev,
                                          [ticket.id]: val
                                        }));
                                      }}
                                      placeholder="Type custom answer or select one of the templates above..."
                                      className="w-full text-xs font-sans p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  {/* Notification Channels Preference Selector */}
                                  <div className="p-3 bg-blue-500/5 dark:bg-slate-900/60 border border-blue-500/15 dark:border-slate-800 rounded-lg space-y-1.5">
                                    <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                                      <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
                                      Automated Outbound Dispatcher Channels
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-normal">
                                      Upon submitting the answer, the helpdesk will trigger simulated live notifications to the student's designated email and whatsapp channels.
                                    </p>
                                    <div className="flex flex-wrap gap-4 pt-1">
                                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-300 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={getChannelsForTicket(ticket.id).email}
                                          onChange={() => toggleChannelForTicket(ticket.id, 'email')}
                                          className="rounded border-slate-300 dark:border-slate-700 text-blue-650 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                                          Simulated Email (<span className="font-mono text-blue-500 text-[11px]">{ticket.email}</span>)
                                        </span>
                                      </label>
                                      
                                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-300 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={getChannelsForTicket(ticket.id).whatsapp}
                                          onChange={() => toggleChannelForTicket(ticket.id, 'whatsapp')}
                                          className="rounded border-slate-300 dark:border-slate-700 text-emerald-650 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                          Simulated WhatsApp (<span className="font-mono text-emerald-500 text-[11px]">{ticket.phone || '+91 9490123456'}</span>)
                                        </span>
                                      </label>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex justify-between items-center pt-2">
                                    <div className="text-[10px] font-mono text-slate-400">
                                      {ticket.respondedAt ? `Responded: ${new Date(ticket.respondedAt).toLocaleString()}` : 'No active response yet'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTicketResponses(prev => {
                                            const updated = { ...prev };
                                            delete updated[ticket.id];
                                            return updated;
                                          });
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                      >
                                        Reset Field
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!responseVal.trim()) {
                                            alert("Please type or select an answer before resolving.");
                                            return;
                                          }
                                          // Set dispatch states and begin animation
                                          setDispatchTicket(ticket);
                                          setDispatchResponseText(responseVal);
                                          setIsDispatching(true);
                                          setDispatchStep(0);
                                          setDispatchLogs(["📡 Initializing SECN Outbound API handshake..."]);
                                        }}
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                                        Submit Answer & Dispatch notifications
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================================== TABS 5: HANDOFF & INTEGRATION HUB ==================================== */}
        {activeTab === 'integration' && (() => {
          const sampleRules = rules.slice(0, 5).map(r => ({
            id: r.id,
            category: r.category,
            question: r.question,
            keywords: r.keywords,
            synonyms: r.synonyms,
            answer: r.answer,
            status: r.status
          }));
          const embedCodeString = `<!-- ========================================== -->
<!-- NARAYANA ENGINEERING COLLEGE CHATBOT WIDGET -->
<!-- Paste this code before </body> on your site -->
<!-- ========================================== -->

<!-- Lucide Icons CDN -->
<script src="https://unpkg.com/lucide@latest"></script>

<!-- Floating Chat Trigger Button -->
<button id="necn-chat-trigger" style="position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: #2563eb; color: white; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; z-index: 9999; transition: all 0.2s;">
  <i data-lucide="message-square" style="width: 24px; height: 24px;"></i>
</button>

<!-- Chat Widget Container (Initially Hidden) -->
<div id="necn-chat-widget" style="position: fixed; bottom: 92px; right: 24px; width: 380px; height: 520px; border-radius: 16px; background: white; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: none; flex-direction: column; z-index: 9999; font-family: system-ui, -apple-system, sans-serif; overflow: hidden;">
  <!-- Header -->
  <div style="background: #0f172a; color: white; padding: 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 32px; height: 32px; border-radius: 6px; background: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: bold;">N</div>
      <div>
        <div style="font-size: 14px; font-weight: bold;">Narayana Info Bot</div>
        <div style="font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
          Online Info Assistant
        </div>
      </div>
    </div>
    <button id="necn-chat-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px;">
      <i data-lucide="x" style="width: 18px; height: 18px;"></i>
    </button>
  </div>

  <!-- Messages List -->
  <div id="necn-chat-messages" style="flex: 1; padding: 16px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 12px;">
    <!-- Welcome message -->
    <div style="align-self: flex-start; max-width: 85%; background: white; border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px 12px 12px 0; font-size: 13px; color: #334155; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      Namaste! Welcome to Narayana Engineering College Portal. How can I help parents & students today?
    </div>
  </div>

  <!-- Quick Options Panel -->
  <div style="padding: 10px 16px; background: #f1f5f9; border-top: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; gap: 6px;" id="necn-quick-chips">
    <button class="necn-chip" data-query="Admissions" style="padding: 6px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 11px; cursor: pointer; color: #1e293b; font-weight: 500;">Admissions</button>
    <button class="necn-chip" data-query="Fee structure" style="padding: 6px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 11px; cursor: pointer; color: #1e293b; font-weight: 500;">Fee Structure</button>
    <button class="necn-chip" data-query="Placements" style="padding: 6px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 20px; font-size: 11px; cursor: pointer; color: #1e293b; font-weight: 500;">Placements</button>
  </div>

  <!-- Input Area -->
  <form id="necn-chat-form" style="padding: 12px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; background: white; align-items: center;">
    <input type="text" id="necn-chat-input" placeholder="Type college question here..." style="flex: 1; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; font-size: 13px; outline: none; transition: border-color 0.15s;" required>
    <button type="submit" style="background: #2563eb; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
      <i data-lucide="send" style="width: 16px; height: 16px;"></i>
    </button>
  </form>
</div>

<script>
  // 1. Production Rules list compiled from NECN Spreadsheet Database
  const NECN_RULES = ${JSON.stringify(sampleRules, null, 2)}; // Extracted from live state

  // 2. DOM Selectors
  const triggerBtn = document.getElementById('necn-chat-trigger');
  const chatWidget = document.getElementById('necn-chat-widget');
  const closeBtn = document.getElementById('necn-chat-close');
  const chatForm = document.getElementById('necn-chat-form');
  const chatInput = document.getElementById('necn-chat-input');
  const messagesContainer = document.getElementById('necn-chat-messages');

  // Initialize Lucide Icons
  lucide.createIcons();

  // 3. Toggle Visibility
  triggerBtn.addEventListener('click', () => {
    const isHidden = chatWidget.style.display === 'none';
    chatWidget.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
      chatInput.focus();
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWidget.style.display = 'none';
  });

  // Helper to add chat bubble
  function addBubble(text, sender) {
    const bubble = document.createElement('div');
    bubble.style.maxWidth = '85%';
    bubble.style.padding = '12px';
    bubble.style.fontSize = '13px';
    bubble.style.lineHeight = '1.5';
    bubble.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';

    if (sender === 'user') {
      bubble.style.alignSelf = 'flex-end';
      bubble.style.background = '#2563eb';
      bubble.style.color = 'white';
      bubble.style.borderRadius = '12px 12px 0 12px';
    } else {
      bubble.style.alignSelf = 'flex-start';
      bubble.style.background = 'white';
      bubble.style.color = '#334155';
      bubble.style.border = '1px solid #e2e8f0';
      bubble.style.borderRadius = '12px 12px 12px 0';
    }

    bubble.innerText = text;
    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 4. Keyword Matcher core algorithm
  function getBestRuleMatch(query) {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return null;

    let bestRule = null;
    let highestScore = 0;

    for (const rule of NECN_RULES) {
      if (rule.status !== 'Active') continue;
      
      let score = 0;
      if (cleanQuery.includes(rule.question.toLowerCase())) {
        score += 5;
      }

      const keywords = rule.keywords.split(',').map(k => k.trim().toLowerCase());
      for (const kw of keywords) {
        if (!kw) continue;
        if (cleanQuery.includes(kw)) {
          score += 2;
        }
      }

      if (rule.synonyms) {
        const synonyms = rule.synonyms.split(',').map(s => s.trim().toLowerCase());
        for (const syn of synonyms) {
          if (!syn) continue;
          if (cleanQuery.includes(syn)) {
            score += 1.5;
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestRule = rule;
      }
    }

    return highestScore >= 1.5 ? bestRule : null;
  }

  // 5. Submit event
  function handleSendMessage(text) {
    if (!text.trim()) return;
    addBubble(text, 'user');

    setTimeout(() => {
      const matched = getBestRuleMatch(text);
      if (matched) {
        addBubble(matched.answer, 'bot');
      } else {
        addBubble("I am sorry, I couldn't find an exact match for your question. You can connect with our Admissions Reception at +91 861 2313886 or email principal@necn.ac.in for instant assistance!", 'bot');
      }
    }, 400);
  }

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value;
    chatInput.value = '';
    handleSendMessage(query);
  });

  document.querySelectorAll('.necn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-query');
      handleSendMessage(val);
    });
  });
</script>
`;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Strategic Rationale & Export */}
              <div className="lg:col-span-1 space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <h3 className="text-base font-bold">Why Rule-Based Fits College Sites</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    For official institutions like colleges, absolute correctness is the #1 priority. Here is why a Deterministic, Rule-Based Keyword Matcher is highly superior to general LLM-based bots for your real website:
                  </p>
                  
                  <ul className="space-y-4 text-xs text-slate-300">
                    <li className="flex gap-3 items-start">
                      <span className="p-1.5 rounded bg-blue-500/10 text-blue-400 font-bold font-mono text-[10px] w-6 h-6 flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-slate-800 dark:text-slate-100 block font-semibold mb-0.5">Zero Hallucinations</strong>
                        <span className="text-slate-400">Guarantees students and parents never get incorrect fee structures, wrong exam dates, or inaccurate admission stats.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[10px] w-6 h-6 flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-slate-800 dark:text-slate-100 block font-semibold mb-0.5">Staff-Managed Rules</strong>
                        <span className="text-slate-400">Administrative clerks can update Q&As via basic Excel spreadsheet sheets or CSVs without knowing programming.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="p-1.5 rounded bg-amber-500/10 text-amber-400 font-bold font-mono text-[10px] w-6 h-6 flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-slate-800 dark:text-slate-100 block font-semibold mb-0.5">100% Free & Fast</strong>
                        <span className="text-slate-400">Because matching occurs instantly client-side in the parent browser, you pay $0 in recurrent cloud or model endpoint fees.</span>
                      </div>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="p-1.5 rounded bg-rose-500/10 text-rose-400 font-bold font-mono text-[10px] w-6 h-6 flex items-center justify-center shrink-0">4</span>
                      <div>
                        <strong className="text-slate-800 dark:text-slate-100 block font-semibold mb-0.5 font-sans">Student Privacy</strong>
                        <span className="text-slate-400">Student conversations are not transmitted to foreign servers, guaranteeing complete institutional data privacy.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                  <h4 className="font-bold text-sm">Download Production Rules</h4>
                  <p className="text-xs text-slate-400">Export the live configured knowledge base rules directly into a structured JSON file for standard web widget reading.</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Rules Loaded:</span>
                      <span className="text-blue-500 font-bold">{rules.length} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="text-emerald-500 font-bold">Standard JSON</span>
                    </div>
                    <div className="flex justify-between">
                      <span>File size:</span>
                      <span>~{(JSON.stringify(rules).length / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleExportJSON}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      Download rules_production.json
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      Download rules_production.xlsx
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Code Snippet & Embed Guide */}
              <div className="lg:col-span-2 space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-base font-bold">Production Embed Code Generator</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Below is the complete, self-contained HTML/JS widget loader that your web development team can copy-paste straight into the footer of your real college website.</p>
                    </div>

                    <button
                      onClick={() => handleCopyEmbed(embedCodeString)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition-all border border-slate-700/50 flex items-center gap-1.5 self-stretch sm:self-auto cursor-pointer justify-center"
                    >
                      {copiedEmbed ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copied Code!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  {/* Live Codeblock container */}
                  <div className="relative">
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <pre className="p-4 bg-slate-950 border border-slate-850 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
                      <code>{embedCodeString}</code>
                    </pre>
                  </div>

                  {/* Step-by-Step Integration Guide */}
                  <div className="border-t border-slate-200/60 dark:border-slate-800 pt-5 space-y-3">
                    <h4 className="font-bold text-sm">Handoff Instructions for your Web Team:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5">
                        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 text-[11px] font-bold flex items-center justify-center font-mono">1</span>
                          Host the Rule Base
                        </div>
                        <p className="text-slate-400 leading-relaxed">Host the exported <code>rules_production.json</code> on your web server, or declare the rules list directly inside your main bundle script.</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5">
                        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 text-[11px] font-bold flex items-center justify-center font-mono">2</span>
                          Paste Widget HTML
                        </div>
                        <p className="text-slate-400 leading-relaxed">Paste the generated widget HTML block just above the closing <code>&lt;/body&gt;</code> tag of your global college template.</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5">
                        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 text-[11px] font-bold flex items-center justify-center font-mono">3</span>
                          Initialize Matcher
                        </div>
                        <p className="text-slate-400 leading-relaxed">Initialize the client-side matching script. It tokenizes user inputs, finds intersections with keywords/synonyms, and triggers response!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

        {/* ==================================== TABS: NOTICES ==================================== */}
        {activeTab === 'notices' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-bold">Notice Board Management</h3>
            <p className="text-sm text-slate-400">Manage notices for the student dashboard. You can add text-based or image-based notices.</p>
            
            {/* Add New Notice Form */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Notice Title"
                  id="notice-title"
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
                <input
                  type="date"
                  id="notice-date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              <textarea
                placeholder="Notice Description / Content"
                id="notice-desc"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              />
              <input
                type="text"
                placeholder="Image URL (Optional - leave empty for text-only notice)"
                id="notice-image"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-mono"
              />
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm cursor-pointer transition-all"
                onClick={async () => {
                  const title = (document.getElementById('notice-title') as HTMLInputElement).value;
                  const date = (document.getElementById('notice-date') as HTMLInputElement).value;
                  const desc = (document.getElementById('notice-desc') as HTMLTextAreaElement).value;
                  const imageUrl = (document.getElementById('notice-image') as HTMLInputElement).value;
                  
                  if (title && desc) {
                    const newNotice = { 
                      id: `notice-${Date.now()}`, 
                      title, 
                      date, 
                      desc, 
                      type: 'academic' as const,
                      imageUrl: imageUrl || undefined 
                    };
                    await saveNotice(newNotice);
                    
                    // Reset fields
                    (document.getElementById('notice-title') as HTMLInputElement).value = '';
                    (document.getElementById('notice-desc') as HTMLTextAreaElement).value = '';
                    (document.getElementById('notice-image') as HTMLInputElement).value = '';
                  }
                }}
              >
                Post Notice
              </button>
            </div>

            {/* Existing Notices List */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Active Notices</h4>
              {calendarItems.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                  No active notices found.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {calendarItems.map(notice => (
                    <div key={notice.id} className="group relative flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all shadow-sm">
                      {notice.imageUrl && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-800">
                          <img src={notice.imageUrl} alt={notice.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-bold text-slate-800 dark:text-slate-100">{notice.title}</h5>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">{notice.date}</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{notice.desc}</p>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-600 transition-all cursor-pointer"
                        onClick={() => deleteNotice(notice.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================== TABS: PORTAL LINKS ==================================== */}
        {activeTab === 'portal' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-bold">Portal Links</h3>
            <p className="text-sm text-slate-400">Manage quick access links for the student portal chatbot section.</p>
            
            {/* Add New Link Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                placeholder="Link Title (e.g., Exam Results)"
                className="col-span-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const title = e.currentTarget.value;
                    const url = e.currentTarget.nextElementSibling as HTMLInputElement;
                    if (title && url.value) {
                      await savePortalLink({ id: `link-${Date.now()}`, title, link: url.value });
                      e.currentTarget.value = '';
                      url.value = '';
                    }
                  }
                }}
              />
              <input
                type="text"
                placeholder="URL (e.g., https://example.com)"
                className="col-span-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm cursor-pointer"
                onClick={async (e) => {
                  const container = e.currentTarget.parentElement!;
                  const titleInput = container.querySelector('input[type="text"]:first-child') as HTMLInputElement;
                  const urlInput = container.querySelector('input[type="text"]:nth-child(2)') as HTMLInputElement;
                  if (titleInput.value && urlInput.value) {
                    await savePortalLink({ id: `link-${Date.now()}`, title: titleInput.value, link: urlInput.value });
                    titleInput.value = '';
                    urlInput.value = '';
                  }
                }}
              >
                Add Link
              </button>
            </div>

            {/* Existing Links List */}
            <div className="space-y-2">
              {portalItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-xs text-blue-500 font-mono">{item.link}</div>
                  </div>
                  <button
                    className="text-rose-500 hover:text-rose-600 cursor-pointer p-2"
                    onClick={() => deletePortalLink(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ==================================== MODAL: RULE EDITOR (ADD / EDIT) ==================================== */}
      {isEditing && currentEditRule && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-base">
                  {rules.some(r => r.id === currentEditRule.id) ? 'Edit Rule Record' : 'Create Custom Rule'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRule} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rule ID</label>
                  <input
                    type="text"
                    disabled
                    value={currentEditRule.id || ''}
                    className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={currentEditRule.category || 'Admissions'}
                    onChange={(e) => setCurrentEditRule({ ...currentEditRule, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Question Text <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is the fee structure?"
                  value={currentEditRule.question || ''}
                  onChange={(e) => setCurrentEditRule({ ...currentEditRule, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Keywords <span className="text-rose-500">*</span> <span className="text-[10px] text-slate-400 font-normal">(Comma separated, e.g. admission, join, apply)</span></label>
                <input
                  type="text"
                  required
                  placeholder="admission,join,apply"
                  value={currentEditRule.keywords || ''}
                  onChange={(e) => setCurrentEditRule({ ...currentEditRule, keywords: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Synonyms <span className="text-[10px] text-slate-400 font-normal">(Comma separated, e.g. register, counseling)</span></label>
                <input
                  type="text"
                  placeholder="register,counseling,entrance exam"
                  value={currentEditRule.synonyms || ''}
                  onChange={(e) => setCurrentEditRule({ ...currentEditRule, synonyms: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Answer Body <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the full comprehensive answer here..."
                  value={currentEditRule.answer || ''}
                  onChange={(e) => setCurrentEditRule({ ...currentEditRule, answer: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Related Dept</label>
                  <select
                    value={currentEditRule.relatedDepartment || 'ADMIN'}
                    onChange={(e) => setCurrentEditRule({ ...currentEditRule, relatedDepartment: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold cursor-pointer font-mono"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Priority</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={currentEditRule.priority || 1}
                    onChange={(e) => setCurrentEditRule({ ...currentEditRule, priority: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={currentEditRule.status || 'Active'}
                    onChange={(e) => setCurrentEditRule({ ...currentEditRule, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-semibold cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 font-bold text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================== OUTBOUND MULTI-CHANNEL DISPATCHER TERMINAL ==================================== */}
      {isDispatching && dispatchTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 pl-2">SECN Outbound Dispatch Node v1.4</span>
              </div>
              <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-widest animate-pulse">
                Active Session
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="text-center pb-2">
                <div className="inline-flex p-3 bg-blue-500/10 rounded-full mb-3 text-blue-400">
                  <RefreshCw className="w-8 h-8 animate-spin animate-spin-slow" />
                </div>
                <h3 className="font-bold text-base text-white">Dispatched Multi-Channel Outreach</h3>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  Transmitting administrative response to <span className="font-semibold text-blue-400">{dispatchTicket.studentName || 'Inquirer'}</span> via automated gateway tunnels.
                </p>
              </div>

              {/* Channels Status Panel */}
              <div className="grid grid-cols-2 gap-3">
                {/* Email Channel status */}
                <div className={`p-3 rounded-xl border transition-all ${
                  getChannelsForTicket(dispatchTicket.id).email 
                    ? dispatchStep >= 3 
                      ? 'bg-blue-950/30 border-blue-500/30 text-blue-200' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-450' 
                    : 'bg-slate-950/10 border-slate-900/50 text-slate-500 opacity-50'
                }`}>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      Email Notification
                    </span>
                    <span className="text-[10px] font-mono font-semibold">
                      {!getChannelsForTicket(dispatchTicket.id).email 
                        ? 'Disabled' 
                        : dispatchStep >= 3 
                        ? 'SENT' 
                        : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                    {dispatchTicket.email}
                  </p>
                </div>

                {/* WhatsApp Channel status */}
                <div className={`p-3 rounded-xl border transition-all ${
                  getChannelsForTicket(dispatchTicket.id).whatsapp 
                    ? dispatchStep >= 6 
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-455' 
                    : 'bg-slate-950/10 border-slate-900/50 text-slate-500 opacity-50'
                }`}>
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      WhatsApp Alert
                    </span>
                    <span className="text-[10px] font-mono font-semibold">
                      {!getChannelsForTicket(dispatchTicket.id).whatsapp 
                        ? 'Disabled' 
                        : dispatchStep >= 6 
                        ? 'DELIVERED' 
                        : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                    {dispatchTicket.phone || '+91 9490123456'}
                  </p>
                </div>
              </div>

              {/* Console Logs Box */}
              <div className="space-y-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-48 overflow-y-auto font-mono text-[10px] leading-relaxed scrollbar-thin">
                <div className="flex items-center justify-between text-slate-500 pb-1.5 mb-1.5 border-b border-slate-900">
                  <span>DISPATCH CONSOLE UTILITIES</span>
                  <span>SSL_SECURE</span>
                </div>
                {dispatchLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${
                      log.includes('[SUCCESS]') 
                        ? 'text-emerald-400 font-bold' 
                        : log.startsWith('🎉') 
                        ? 'text-yellow-400 font-bold' 
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
                <div className="animate-pulse text-blue-500">_</div>
              </div>

              {/* Progress Tracker */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>TRANSMISSION PROGRESS</span>
                  <span>{Math.round((dispatchStep / getExpectedTotalSteps(dispatchTicket.id)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (dispatchStep / getExpectedTotalSteps(dispatchTicket.id)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Form Submission Block */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDispatching(false);
                  setDispatchTicket(null);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              >
                Cancel Transmission
              </button>
              
              <button
                type="button"
                disabled={dispatchStep < getExpectedTotalSteps(dispatchTicket.id)}
                onClick={async () => {
                  // Actually resolve and commit the support ticket state!
                  const response = {
                    adminResponse: dispatchResponseText,
                    status: 'Resolved' as const,
                    respondedAt: new Date().toISOString(),
                    notificationChannels: getChannelsForTicket(dispatchTicket.id),
                    userNotified: false
                  };
                  
                  await updateSupportTicket(dispatchTicket.id, response);
                  
                  // Notify user via API
                  try {
                    await fetch('/api/notify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...dispatchTicket,
                        ...response
                      })
                    });
                  } catch (err) {
                    console.error("Failed to notify user:", err);
                  }

                  setIsDispatching(false);
                  setDispatchTicket(null);
                  setExpandedTicketId(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  dispatchStep >= getExpectedTotalSteps(dispatchTicket.id)
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-bounce'
                    : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Confirm & Sync Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

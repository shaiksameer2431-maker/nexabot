import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, X, Check, ArrowUpRight, Bell, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { updateSupportTicket } from '../data/firebaseService';
import { SupportTicket } from '../types';

interface NotificationToast {
  id: string;
  type: 'email' | 'whatsapp';
  ticketId: string;
  studentName: string;
  email: string;
  phone: string;
  query: string;
  adminResponse: string;
  timestamp: string;
  isDismissed: boolean;
}

interface NotificationServiceProps {
  supportTickets: SupportTicket[];
  onOpenTracker: (email: string) => void;
  onUpdateSupportTickets: (updated: SupportTicket[]) => void;
}

export default function NotificationService({ supportTickets, onOpenTracker, onUpdateSupportTickets }: NotificationServiceProps) {
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  // Request browser desktop notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setPermissionState(perm);
        });
      }
    }
  }, []);

  // Synthesize professional alert tones using Web Audio API
  const playAlertSound = (type: 'email' | 'whatsapp') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'whatsapp') {
        // High-pitched pleasant double-chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.start();
        
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(950, ctx.currentTime + 0.12);
        
        osc.stop(ctx.currentTime + 0.22);
      } else {
        // Gentle executive wind-chime/bell chime
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain1.gain.setValueAtTime(0.04, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc1.start();
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain2.gain.setValueAtTime(0.03, ctx.currentTime + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc2.start();
        
        osc1.stop(ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("AudioContext blocked or failed: requires initial user interaction", e);
    }
  };

  // Monitor support tickets array for real-time and post-reboot resolution updates
  useEffect(() => {
    // We target any ticket that is Resolved but has userNotified === false (meaning they got answered but the alert hasn't played)
    const unnotifiedTickets = supportTickets.filter(t => t.status === 'Resolved' && t.userNotified === false);

    if (unnotifiedTickets.length > 0) {
      unnotifiedTickets.forEach(async (ticket, idx) => {
        // Mark as notified in database immediately to prevent duplicate alerts
        await updateSupportTicket(ticket.id, { userNotified: true });

        // Read preferences (default to true if not specified)
        const channels = ticket.notificationChannels || { email: true, whatsapp: true };

        // 1. Dispatch Email Notification Alert
        if (channels.email) {
          const newId = `em-${ticket.id}-${Date.now()}`;
          const newToast: NotificationToast = {
            id: newId,
            type: 'email',
            ticketId: ticket.id,
            studentName: ticket.studentName || 'Student',
            email: ticket.email,
            phone: ticket.phone,
            query: ticket.query,
            adminResponse: ticket.adminResponse || 'Your query has been processed.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isDismissed: false
          };
          
          // Delay to space them out nicely
          setTimeout(() => {
            setToasts(prev => [newToast, ...prev]);
            playAlertSound('email');
          }, idx * 1800 + 100);

          // Trigger native system HTML5 notification if window is hidden/minimized
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`✉️ NECN Official Support Response`, {
                body: `Ticket #${ticket.id} answered: "${ticket.adminResponse}"`,
                tag: `ticket-${ticket.id}-email`,
              });
            }
          } catch (err) {
            console.warn("Could not dispatch HTML5 desktop notification", err);
          }

          // Auto-dismiss after 15 seconds
          setTimeout(() => {
            dismissToast(newId);
          }, idx * 1800 + 15000);
        }

        // 2. Dispatch WhatsApp Notification Alert
        if (channels.whatsapp) {
          const newId = `wa-${ticket.id}-${Date.now()}`;
          const newToast: NotificationToast = {
            id: newId,
            type: 'whatsapp',
            ticketId: ticket.id,
            studentName: ticket.studentName || 'Student',
            email: ticket.email,
            phone: ticket.phone,
            query: ticket.query,
            adminResponse: ticket.adminResponse || 'Your query has been processed.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isDismissed: false
          };

          // Delay WhatsApp alert slightly after Email alert
          setTimeout(() => {
            setToasts(prev => [newToast, ...prev]);
            playAlertSound('whatsapp');
          }, idx * 1800 + 1400);

          // Trigger native system HTML5 notification for WhatsApp
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              setTimeout(() => {
                new Notification(`📲 NECN Counseling Desk (WhatsApp)`, {
                  body: `Replied regarding your query: "${ticket.adminResponse}"`,
                  tag: `ticket-${ticket.id}-wa`,
                });
              }, idx * 1800 + 1300);
            }
          } catch (err) {}

          // Auto-dismiss after 16 seconds
          setTimeout(() => {
            dismissToast(newId);
          }, idx * 1800 + 16000);
        }
      });
    }
  }, [supportTickets]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isDismissed: true } : t));
    // Completely remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 400);
  };

  const handleActionClick = (toast: NotificationToast) => {
    // Open the ticket tracker tab inside Chatbot widget automatically!
    onOpenTracker(toast.email);
    dismissToast(toast.id);
  };

  const requestPermissionDirectly = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(perm => {
        setPermissionState(perm);
      });
    }
  };

  const activeToasts = toasts.filter(t => !t.isDismissed);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 max-w-sm w-full select-none">
      {/* Sound toggler */}
      <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-400 self-end shadow-md font-mono">
        <span className="flex items-center gap-1">
          <Bell className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          Outbound Notification Services
        </span>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer pl-2 ml-2 border-l border-slate-800"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Sound On
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              Muted
            </>
          )}
        </button>
      </div>

      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in-right transform transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col border-slate-200 dark:border-slate-850"
        >
          {toast.type === 'email' ? (
            /* ================= Outlook / Mail Mockup Toast ================= */
            <div className="flex flex-col">
              {/* Header */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner text-white">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
                      Email Notification
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      NECN Mail Delivery Relay
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{toast.timestamp}</span>
                  <button 
                    onClick={() => dismissToast(toast.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Details */}
              <div className="p-4 space-y-2">
                <div className="text-xs">
                  <span className="text-slate-400 font-mono">Subject: </span>
                  <span className="font-bold text-slate-850 dark:text-slate-100">
                    RE: NECN Official Support Reply [Ticket #{toast.ticketId}]
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Dear {toast.studentName},
                  </p>
                  <p className="italic">
                    "{toast.adminResponse}"
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100 dark:border-slate-850">
                    Official Support Desk • Narayana Engineering College, Nellore
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-[9px] font-mono text-slate-400">Sent to: {toast.email}</span>
                  <button
                    onClick={() => handleActionClick(toast)}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Open Live Tracker
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= WhatsApp Mockup Toast ================= */
            <div className="flex flex-col">
              {/* Header */}
              <div className="px-4 py-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 border-b border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-emerald-650 dark:text-emerald-450 flex items-center gap-1">
                      WhatsApp Business Alert
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      +91 94901 23456 (Counseling Desk)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{toast.timestamp}</span>
                  <button 
                    onClick={() => dismissToast(toast.id)}
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Details */}
              <div className="p-4 space-y-2">
                <div className="flex gap-2.5">
                  <div className="w-1.5 bg-emerald-500 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                      NECN Admission Counselor
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-350 italic">
                      "Dear {toast.studentName}, your request regarding '{toast.query.slice(0, 45)}{toast.query.length > 45 ? '...' : ''}' has been answered: {toast.adminResponse} Please use ticket tracker code {toast.ticketId} to verify."
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-850 mt-1">
                  <span className="text-[9px] font-mono text-slate-400">Phone: {toast.phone}</span>
                  <button
                    onClick={() => handleActionClick(toast)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all flex items-center gap-1 shadow-sm cursor-pointer text-[10px]"
                  >
                    Verify & View Answer
                    <MessageSquare className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

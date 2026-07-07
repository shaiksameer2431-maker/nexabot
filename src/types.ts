/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PortalItem {
  id: string;
  title: string;
  link: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  date: string;
  desc: string;
  type: string;
  imageUrl?: string;
}

export interface Rule {
  id: string;
  category: string;
  question: string;
  keywords: string; // Comma-separated keywords
  synonyms: string; // Comma-separated synonyms
  answer: string;
  relatedDepartment: string;
  priority: number;
  status: 'Active' | 'Inactive';
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  contactNumber: string;
  email: string;
  location: string;
}

export interface Faculty {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  contact: string;
}

export interface ChatLog {
  id: string;
  timestamp: string;
  userQuery: string;
  matchedRuleId: string | null;
  matchedQuestion: string | null;
  score: number;
  userRole: string;
  fallbackTriggered: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
  departmentContact?: {
    name: string;
    phone: string;
    email: string;
  };
  score?: number;
}

export interface SupportTicket {
  id: string;
  timestamp: string;
  studentName?: string;
  email: string;
  countryCode?: string;
  phone: string;
  role: string;
  query: string;
  status: 'Open' | 'Resolved';
  adminResponse?: string;
  respondedAt?: string;
  notificationChannels?: { email: boolean; whatsapp: boolean; sms?: boolean };
  userNotified?: boolean;
}

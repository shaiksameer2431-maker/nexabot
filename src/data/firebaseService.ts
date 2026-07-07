/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Rule, Department, Faculty, Category, SupportTicket, NoticeItem, PortalItem, ChatLog } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection successful");
  } catch (error) {
    console.error("Firebase connection test failed", error);
  }
}

// Collections
const COLLECTIONS = {
  RULES: 'rules',
  DEPARTMENTS: 'departments',
  CATEGORIES: 'categories',
  FACULTY: 'faculty',
  SUPPORT_TICKETS: 'supportTickets',
  NOTICES: 'notices',
  PORTAL_LINKS: 'portalLinks',
  CHAT_LOGS: 'chatLogs'
};

// --- Generic Fetchers ---

export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data() } as T));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

export function subscribeToCollection<T>(collectionName: string, callback: (data: T[]) => void) {
  const q = query(collection(db, collectionName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data() } as T));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  });
}

// --- Specific Operations ---

export async function saveSupportTicket(ticket: SupportTicket) {
  try {
    await setDoc(doc(db, COLLECTIONS.SUPPORT_TICKETS, ticket.id), ticket);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.SUPPORT_TICKETS);
  }
}

export async function updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>) {
  try {
    const ticketRef = doc(db, COLLECTIONS.SUPPORT_TICKETS, ticketId);
    await updateDoc(ticketRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTIONS.SUPPORT_TICKETS);
  }
}

export async function saveRule(rule: Rule) {
  try {
    await setDoc(doc(db, COLLECTIONS.RULES, rule.id), rule);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.RULES);
  }
}

export async function deleteRule(ruleId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.RULES, ruleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.RULES);
  }
}

export async function saveNotice(notice: NoticeItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.NOTICES, notice.id), notice);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.NOTICES);
  }
}

export async function deleteNotice(noticeId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.NOTICES, noticeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.NOTICES);
  }
}

// For Portal Links
export async function savePortalLink(link: PortalItem) {
  try {
    await setDoc(doc(db, COLLECTIONS.PORTAL_LINKS, link.id), link);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PORTAL_LINKS);
  }
}

export async function deletePortalLink(linkId: string) {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PORTAL_LINKS, linkId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.PORTAL_LINKS);
  }
}

// Chat Log Operations
export async function saveChatLog(log: ChatLog) {
  try {
    await setDoc(doc(db, COLLECTIONS.CHAT_LOGS, log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.CHAT_LOGS);
  }
}

export async function clearChatLogs() {
  try {
    const q = query(collection(db, COLLECTIONS.CHAT_LOGS));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(docSnapshot => deleteDoc(doc(db, COLLECTIONS.CHAT_LOGS, docSnapshot.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.CHAT_LOGS);
  }
}

// Seeding tool (for initial setup)
export async function seedDatabase(
  rules: Rule[], 
  departments: Department[], 
  categories: Category[], 
  faculty: Faculty[]
) {
  console.log("Seeding database...");
  for (const rule of rules) await saveRule(rule);
  for (const dept of departments) await setDoc(doc(db, COLLECTIONS.DEPARTMENTS, dept.id), dept);
  for (const cat of categories) await setDoc(doc(db, COLLECTIONS.CATEGORIES, cat.id), cat);
  for (const f of faculty) await setDoc(doc(db, COLLECTIONS.FACULTY, f.id), f);
  console.log("Seeding complete");
}

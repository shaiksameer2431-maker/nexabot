/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Rule } from '../types';

// Standard English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have',
  'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt',
  'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over',
  'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such',
  'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres',
  'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent',
  'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom',
  'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
  'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Clean, lowercase, and tokenize query text
 */
export function preprocessText(text: string): string[] {
  if (!text) return [];
  
  // 1. Convert to lowercase
  let cleanText = text.toLowerCase();
  
  // 2. Remove punctuation (replace with space to keep words separate)
  cleanText = cleanText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ');
  
  // 3. Tokenize by splitting on whitespaces
  const tokens = cleanText.split(/\s+/).filter(token => token.length > 0);
  
  // 4. Remove stop words
  return tokens.filter(token => !STOP_WORDS.has(token));
}

/**
 * Normalizes lists of keywords/synonyms into clean arrays
 */
export function parseCommaSeparatedList(listString: string): string[] {
  if (!listString) return [];
  return listString
    .toLowerCase()
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

export interface MatchResult {
  rule: Rule;
  score: number;
}

/**
 * Keyword-based matching engine
 */
export function findBestMatchingRule(query: string, rules: Rule[]): MatchResult | null {
  const activeRules = rules.filter(r => r.status === 'Active');
  if (activeRules.length === 0) return null;

  const queryTokens = preprocessText(query);
  const normalizedQuery = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ').trim();

  if (queryTokens.length === 0 && normalizedQuery.length === 0) return null;

  const results: MatchResult[] = [];

  for (const rule of activeRules) {
    let score = 0;

    const keywords = parseCommaSeparatedList(rule.keywords);
    const synonyms = parseCommaSeparatedList(rule.synonyms);
    const cleanQuestion = rule.question.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ');

    // 1. Check for exact full query matching a question or synonym/keyword directly
    if (normalizedQuery === cleanQuestion.trim()) {
      score += 15; // Highest confidence match
    }

    // 2. Phrase matching (bonus for multi-word phrases)
    // Check if the exact keyword phrase appears in the normalized query
    for (const kw of keywords) {
      if (kw.includes(' ') && normalizedQuery.includes(kw)) {
        score += 8; // Heavy bonus for multi-word keyword match (e.g. "admission process")
      }
    }
    for (const syn of synonyms) {
      if (syn.includes(' ') && normalizedQuery.includes(syn)) {
        score += 6; // Heavy bonus for multi-word synonym match
      }
    }

    // 3. Individual token matching
    for (const token of queryTokens) {
      // Check keywords
      for (const kw of keywords) {
        if (kw === token) {
          score += 3; // Direct keyword match
        } else if (kw.includes(token) || token.includes(kw)) {
          score += 1; // Partial keyword match
        }
      }

      // Check synonyms
      for (const syn of synonyms) {
        if (syn === token) {
          score += 2; // Direct synonym match
        } else if (syn.includes(token) || token.includes(syn)) {
          score += 0.5; // Partial synonym match
        }
      }

      // Check tokens in the original question text
      if (cleanQuestion.includes(token)) {
        score += 1.5; // Token matches question word
      }
    }

    // Only consider matches that meet a minimum confidence threshold
    if (score >= 2) {
      results.push({ rule, score });
    }
  }

  if (results.length === 0) return null;

  // Sort by:
  // 1. Score (descending)
  // 2. Priority (ascending - lower number like 1 means higher priority)
  // 3. Question length (shorter / more specific question first)
  results.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.1) {
      return b.score - a.score;
    }
    if (a.rule.priority !== b.rule.priority) {
      return a.rule.priority - b.rule.priority; // 1 before 2
    }
    return a.rule.question.length - b.rule.question.length;
  });

  return results[0];
}

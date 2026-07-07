package com.necn.chatbot.service;

import com.necn.chatbot.model.KnowledgeRule;
import com.necn.chatbot.model.MatchResult;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RuleEngineService {

    // Standard English stop words
    private static final Set<String> STOP_WORDS = new HashSet<>(Arrays.asList(
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent",
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
        "can", "cant", "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont",
        "down", "during", "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have",
        "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him",
        "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt",
        "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not",
        "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over",
        "own", "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such",
        "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then", "there", "theres",
        "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to", "too",
        "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent",
        "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom",
        "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve",
        "your", "yours", "yourself", "yourselves"
    ));

    /**
     * Clean, lowercase, remove punctuation, and tokenize query text
     */
    public List<String> preprocessText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Convert to lowercase
        String cleanText = text.toLowerCase();

        // 2. Remove punctuation (replace with space to prevent blending words)
        cleanText = cleanText.replaceAll("[.,/#!$%^&*;:{}=\\-_`~()?'\"\\\\]", " ");

        // 3. Tokenize by splitting on whitespaces
        String[] rawTokens = cleanText.split("\\s+");

        // 4. Filter empty tokens and stop words
        return Arrays.stream(rawTokens)
                .filter(token -> !token.isEmpty())
                .filter(token -> !STOP_WORDS.contains(token))
                .collect(Collectors.toList());
    }

    /**
     * Splits comma-separated strings into a list of normalized tokens
     */
    private List<String> parseCommaSeparatedList(String listString) {
        if (listString == null || listString.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(listString.toLowerCase().split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * Primary Keyword-based scoring and matching engine
     */
    public MatchResult findBestMatchingRule(String query, List<KnowledgeRule> rules) {
        if (query == null || rules == null || rules.isEmpty()) {
            return null;
        }

        List<String> queryTokens = preprocessText(query);
        String normalizedQuery = query.toLowerCase()
                .replaceAll("[.,/#!$%^&*;:{}=\\-_`~()?'\"\\\\]", " ")
                .trim();

        if (queryTokens.isEmpty() && normalizedQuery.isEmpty()) {
            return null;
        }

        List<MatchResult> results = new ArrayList<>();

        for (KnowledgeRule rule : rules) {
            if (!"Active".equalsIgnoreCase(rule.getStatus())) {
                continue;
            }

            double score = 0.0;
            List<String> keywords = parseCommaSeparatedList(rule.getKeywords());
            List<String> synonyms = parseCommaSeparatedList(rule.getSynonyms());
            String cleanQuestion = rule.getQuestion().toLowerCase()
                    .replaceAll("[.,/#!$%^&*;:{}=\\-_`~()?'\"\\\\]", " ");

            // 1. Direct Full Match on Question (highest confidence)
            if (normalizedQuery.equals(cleanQuestion.trim())) {
                score += 15.0;
            }

            // 2. Phrase Matching (Bonus for multi-word phrases found inside query)
            for (String kw : keywords) {
                if (kw.contains(" ") && normalizedQuery.contains(kw)) {
                    score += 8.0;
                }
            }
            for (String syn : synonyms) {
                if (syn.contains(" ") && normalizedQuery.contains(syn)) {
                    score += 6.0;
                }
            }

            // 3. Token-by-Token Match Scoring
            for (String token : queryTokens) {
                // Check Keywords
                for (String kw : keywords) {
                    if (kw.equals(token)) {
                        score += 3.0; // Direct Keyword Match
                    } else if (kw.contains(token) || token.contains(kw)) {
                        score += 1.0; // Partial Keyword Match
                    }
                }

                // Check Synonyms
                for (String syn : synonyms) {
                    if (syn.equals(token)) {
                        score += 2.0; // Direct Synonym Match
                    } else if (syn.contains(token) || token.contains(syn)) {
                        score += 0.5; // Partial Synonym Match
                    }
                }

                // Check Question words
                if (cleanQuestion.contains(token)) {
                    score += 1.5;
                }
            }

            // Minimum score threshold of 2.0 to trigger a valid match
            if (score >= 2.0) {
                results.add(new MatchResult(rule, score));
            }
        }

        if (results.isEmpty()) {
            return null;
        }

        // Sort: Highest Score first, then Highest Priority (lowest number wins), then shorter question length
        results.sort((a, b) -> {
            if (Math.abs(b.getScore() - a.getScore()) > 0.01) {
                return Double.compare(b.getScore(), a.getScore());
            }
            if (a.getRule().getPriority() != b.getRule().getPriority()) {
                return Integer.compare(a.getRule().getPriority(), b.getRule().getPriority());
            }
            return Integer.compare(a.getRule().getQuestion().length(), b.getRule().getQuestion().length());
        });

        return results.get(0);
    }
}

package com.necn.chatbot.controller;

import com.necn.chatbot.model.*;
import com.necn.chatbot.repository.ChatLogRepository;
import com.necn.chatbot.repository.DepartmentRepository;
import com.necn.chatbot.repository.KnowledgeRuleRepository;
import com.necn.chatbot.service.RuleEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*") // Allows smooth frontend integration
public class ChatController {

    @Autowired
    private RuleEngineService ruleEngineService;

    @Autowired
    private KnowledgeRuleRepository ruleRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ChatLogRepository chatLogRepository;

    @PostMapping("/query")
    public ResponseEntity<ChatResponse> handleUserQuery(@RequestBody ChatRequest request) {
        String query = request.getQuery();
        String userRole = request.getRole() != null ? request.getRole() : "Visitor";

        // Fetch all active rules from database
        List<KnowledgeRule> allRules = ruleRepository.findByStatus("Active");

        // Execute rule engine
        MatchResult match = ruleEngineService.findBestMatchingRule(query, allRules);

        ChatResponse response = new ChatResponse();
        response.setTimestamp(LocalDateTime.now().toString());

        ChatLog log = new ChatLog();
        log.setUserQuery(query);
        log.setUserRole(userRole);
        log.setTimestamp(LocalDateTime.now());

        if (match != null) {
            KnowledgeRule matchedRule = match.getRule();
            response.setAnswer(matchedRule.getAnswer());
            response.setMatchedRuleId(matchedRule.getId());
            response.setScore(match.getScore());
            response.setFallbackTriggered(false);

            // Log mapping
            log.setMatchedRuleId(matchedRule.getId());
            log.setMatchedQuestion(matchedRule.getQuestion());
            log.setMatchScore(match.getScore());
            log.setFallbackTriggered(false);

            // Attach department contact if mapped
            if (matchedRule.getRelatedDepartment() != null && !matchedRule.getRelatedDepartment().isEmpty()) {
                Department dept = departmentRepository.findById(matchedRule.getRelatedDepartment()).orElse(null);
                if (dept != null) {
                    response.setDepartmentContact(new DepartmentContact(
                        dept.getName(),
                        dept.getContactNumber(),
                        dept.getEmail()
                    ));
                }
            }
        } else {
            // Fallback response strictly as requested by the user
            response.setAnswer("I couldn't find the requested information in the college knowledge base. " +
                               "Please contact the respective department for further assistance.");
            response.setMatchedRuleId(null);
            response.setScore(0.0);
            response.setFallbackTriggered(true);

            // Log mapping
            log.setMatchedRuleId(null);
            log.setMatchedQuestion(null);
            log.setMatchScore(0.0);
            log.setFallbackTriggered(true);
        }

        // Save entry into database for analytics
        chatLogRepository.save(log);

        return ResponseEntity.ok(response);
    }
}

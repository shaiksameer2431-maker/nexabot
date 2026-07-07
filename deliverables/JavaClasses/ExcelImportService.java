package com.necn.chatbot.service;

import com.necn.chatbot.model.KnowledgeRule;
import com.necn.chatbot.repository.KnowledgeRuleRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.transaction.Transactional;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ExcelImportService {

    @Autowired
    private KnowledgeRuleRepository ruleRepository;

    /**
     * Parse uploaded Excel file, validate data, and overwrite existing database rules.
     */
    @Transactional
    public List<KnowledgeRule> importRulesFromExcel(MultipartFile file) throws Exception {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("The uploaded Excel file is empty!");
        }

        List<KnowledgeRule> ruleList = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0); // Fetch first sheet
            Row headerRow = sheet.getRow(0);
            
            if (headerRow == null) {
                throw new IllegalArgumentException("Excel sheet is missing a header row!");
            }

            // Simple validation: Verify that minimum columns exist
            // Category, Question, Keywords, Synonyms, Answer, Related Department, Priority, Status
            int totalRows = sheet.getPhysicalNumberOfRows();
            
            for (int i = 1; i < totalRows; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    continue; // Skip empty rows
                }

                KnowledgeRule rule = new KnowledgeRule();
                
                // Read and set UUID
                rule.setId("KB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                
                // Column 0: Category
                rule.setCategory(getCellValueAsString(row.getCell(0)).trim());
                
                // Column 1: Question
                rule.setQuestion(getCellValueAsString(row.getCell(1)).trim());
                
                // Column 2: Keywords
                rule.setKeywords(getCellValueAsString(row.getCell(2)).trim());
                
                // Column 3: Synonyms
                rule.setSynonyms(getCellValueAsString(row.getCell(3)).trim());
                
                // Column 4: Answer
                rule.setAnswer(getCellValueAsString(row.getCell(4)).trim());
                
                // Column 5: Related Department
                rule.setRelatedDepartment(getCellValueAsString(row.getCell(5)).trim());
                
                // Column 6: Priority
                double priorityVal = 1.0;
                Cell priorityCell = row.getCell(6);
                if (priorityCell != null) {
                    if (priorityCell.getCellType() == CellType.NUMERIC) {
                        priorityVal = priorityCell.getNumericCellValue();
                    } else {
                        try {
                            priorityVal = Double.parseDouble(getCellValueAsString(priorityCell).trim());
                        } catch (NumberFormatException e) {
                            priorityVal = 1.0;
                        }
                    }
                }
                rule.setPriority((int) priorityVal);

                // Column 7: Status
                String statusStr = getCellValueAsString(row.getCell(7)).trim();
                if (statusStr.isEmpty()) {
                    statusStr = "Active";
                }
                rule.setStatus(statusStr);

                // Basic validation: A valid rule must contain a Category, Question, Keywords, and Answer
                if (rule.getCategory().isEmpty() || rule.getQuestion().isEmpty() || 
                    rule.getKeywords().isEmpty() || rule.getAnswer().isEmpty()) {
                    throw new IllegalArgumentException("Validation Error on Row " + (i + 1) + 
                        ": 'Category', 'Question', 'Keywords', and 'Answer' columns must not be blank.");
                }

                ruleList.add(rule);
            }
        }

        if (ruleList.isEmpty()) {
            throw new IllegalArgumentException("No valid data rows found in the uploaded Excel file!");
        }

        // Overwrite strategy: Clear previous knowledge base and save new imports
        ruleRepository.deleteAll();
        return ruleRepository.saveAll(ruleList);
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                return String.valueOf((int) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            default:
                return "";
        }
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && !getCellValueAsString(cell).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }
}

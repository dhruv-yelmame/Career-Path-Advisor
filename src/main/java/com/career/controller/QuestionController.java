package com.career.controller;

import com.career.constant.AppConstants;
import com.career.dto.BatchQuestionRequest;
import com.career.dto.PaginatedResponse;
import com.career.dto.QuestionRequest;
import com.career.dto.QuestionResponse;
import com.career.entity.Question;
import com.career.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/questions")
@CrossOrigin(origins = "*")
@Tag(name = "Admin - Question Bank", description = "Endpoints for managing assessment and test questions")
@SecurityRequirement(name = "Bearer Authentication")
public class QuestionController {

    private static final Logger log = LoggerFactory.getLogger(QuestionController.class);

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @PostMapping
    @Operation(summary = "Add question", description = "Creates a new question with options")
    public ResponseEntity<QuestionResponse> addQuestion(@Valid @RequestBody QuestionRequest request) {
        log.info("REST: Add question");
        Question question = questionService.addQuestion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.convertToResponse(question));
    }

    @PostMapping("/batch")
    @Operation(summary = "Batch add questions", description = "Bulk imports multiple questions at once")
    public ResponseEntity<List<QuestionResponse>> addQuestionsBatch(@Valid @RequestBody BatchQuestionRequest request) {
        log.info("REST: Batch adding {} questions", request.getQuestions().size());
        List<Question> saved = questionService.addQuestionsBatch(request.getQuestions());
        List<QuestionResponse> responses = saved.stream()
                .map(questionService::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @PostMapping(value = "/upload-csv", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload questions via CSV", description = "Bulk imports questions from an uploaded CSV file")
    public ResponseEntity<List<QuestionResponse>> uploadQuestionsCsv(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "category", required = false) String defaultCategory) {
        if (file == null || file.isEmpty()) {
            throw new com.career.exception.BadRequestException("CSV file is empty or missing");
        }
        log.info("REST: Uploading questions via CSV: {} with default category: {}", file.getOriginalFilename(), defaultCategory);
        List<QuestionRequest> requests = parseCsvQuestions(file, defaultCategory);
        List<Question> saved = questionService.addQuestionsBatch(requests);
        List<QuestionResponse> responses = saved.stream()
                .map(questionService::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    private List<QuestionRequest> parseCsvQuestions(org.springframework.web.multipart.MultipartFile file, String defaultCategory) {
        List<QuestionRequest> list = new java.util.ArrayList<>();
        try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            boolean isFirstLine = true;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;
                List<String> columns = parseCsvLine(line);
                if (columns.isEmpty()) continue;
                if (isFirstLine) {
                    isFirstLine = false;
                    String firstCol = columns.get(0).toLowerCase();
                    if (firstCol.contains("question") || firstCol.contains("text")) {
                        continue;
                    }
                }
                if (columns.size() < 3) {
                    continue;
                }
                String qText = columns.get(0).trim();
                String optA = columns.size() > 1 ? columns.get(1).trim() : "";
                String optB = columns.size() > 2 ? columns.get(2).trim() : "";
                String optC = columns.size() > 3 ? columns.get(3).trim() : "";
                String optD = columns.size() > 4 ? columns.get(4).trim() : "";
                String correctRaw = columns.size() > 5 ? columns.get(5).trim() : "A";
                String marksRaw = columns.size() > 6 ? columns.get(6).trim() : "10";
                String catRaw = columns.size() > 7 ? columns.get(7).trim() : "";

                int marks = 10;
                try {
                    marks = Integer.parseInt(marksRaw);
                    if (marks <= 0) marks = 10;
                } catch (Exception ignored) {}

                int correctIdx = 0;
                String cUpper = correctRaw.toUpperCase();
                if (cUpper.contains("B") || cUpper.equals("2")) correctIdx = 1;
                else if (cUpper.contains("C") || cUpper.equals("3")) correctIdx = 2;
                else if (cUpper.contains("D") || cUpper.equals("4")) correctIdx = 3;

                // Resolve domain category: CSV column 8 -> defaultCategory param -> smart text keyword detection
                String resolvedCat = (catRaw != null && !catRaw.isEmpty() && !catRaw.equalsIgnoreCase("GENERAL"))
                        ? catRaw.toUpperCase()
                        : (defaultCategory != null && !defaultCategory.isEmpty() && !defaultCategory.equalsIgnoreCase("AUTO") && !defaultCategory.equalsIgnoreCase("GENERAL")
                                ? defaultCategory.toUpperCase()
                                : com.career.service.impl.CareerAllocationServiceImpl.detectCategoryFromText(qText));

                if (resolvedCat == null || resolvedCat.isBlank()) {
                    resolvedCat = "GENERAL";
                }

                List<com.career.dto.QuestionOptionRequest> options = new java.util.ArrayList<>();
                if (!optA.isEmpty()) options.add(new com.career.dto.QuestionOptionRequest(optA, resolvedCat, correctIdx == 0 ? marks : 0));
                if (!optB.isEmpty()) options.add(new com.career.dto.QuestionOptionRequest(optB, resolvedCat, correctIdx == 1 ? marks : 0));
                if (!optC.isEmpty()) options.add(new com.career.dto.QuestionOptionRequest(optC, resolvedCat, correctIdx == 2 ? marks : 0));
                if (!optD.isEmpty()) options.add(new com.career.dto.QuestionOptionRequest(optD, resolvedCat, correctIdx == 3 ? marks : 0));

                if (options.size() >= 2 && !qText.isEmpty()) {
                    QuestionRequest req = new QuestionRequest();
                    req.setQuestionText(qText);
                    req.setKeyword(resolvedCat);
                    req.setCategory(resolvedCat);
                    req.setMarks(marks);
                    req.setOptions(options);
                    list.add(req);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse CSV: {}", e.getMessage());
            throw new com.career.exception.BadRequestException("Failed to parse CSV file: " + e.getMessage());
        }
        if (list.isEmpty()) {
            throw new com.career.exception.BadRequestException("No valid questions found in CSV file.");
        }
        return list;
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new java.util.ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    sb.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        values.add(sb.toString().trim());
        return values;
    }

    @GetMapping
    @Operation(summary = "Get all questions", description = "Returns questions list (or paginated when page param is given)")
    public ResponseEntity<?> getAllQuestions(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type) {

        log.debug("REST: Fetching questions. page={}, size={}, search={}", page, size, search);
        if (page != null) {
            PaginatedResponse<QuestionResponse> paged = questionService.getQuestionsPaged(page, size, search);
            return ResponseEntity.ok(paged);
        }

        List<QuestionResponse> list = questionService.getAllQuestions()
                .stream()
                .map(questionService::convertToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get question by ID")
    public ResponseEntity<QuestionResponse> getQuestion(@PathVariable Long id) {
        Question question = questionService.getQuestionById(id);
        return ResponseEntity.ok(questionService.convertToResponse(question));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update question")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequest request) {
        log.info("REST: Update question ID {}", id);
        Question question = questionService.updateQuestion(id, request);
        return ResponseEntity.ok(questionService.convertToResponse(question));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete question")
    public ResponseEntity<String> deleteQuestion(@PathVariable Long id) {
        log.info("REST: Delete question ID {}", id);
        questionService.deleteQuestion(id);
        return ResponseEntity.ok("Question deleted successfully.");
    }

    @DeleteMapping("/batch")
    @Operation(summary = "Batch delete questions")
    public ResponseEntity<String> deleteQuestionsBatch(@RequestBody List<Long> ids) {
        log.info("REST: Batch deleting {} questions", ids != null ? ids.size() : 0);
        questionService.deleteQuestionsBatch(ids);
        return ResponseEntity.ok("Questions deleted successfully.");
    }

    @PostMapping("/batch-delete")
    @Operation(summary = "Batch delete questions via POST")
    public ResponseEntity<String> deleteQuestionsBatchPost(@RequestBody List<Long> ids) {
        log.info("REST: Batch deleting via POST {} questions", ids != null ? ids.size() : 0);
        questionService.deleteQuestionsBatch(ids);
        return ResponseEntity.ok("Questions deleted successfully.");
    }
}
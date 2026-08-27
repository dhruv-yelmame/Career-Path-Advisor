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

    @GetMapping
    @Operation(summary = "Get all questions", description = "Returns questions list (or paginated when page param is given)")
    public ResponseEntity<?> getAllQuestions(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type) {

        log.debug("REST: Fetching questions. page={}, size={}, search={}, type={}", page, size, search, type);
        if (page != null) {
            PaginatedResponse<QuestionResponse> paged = questionService.getQuestionsPaged(page, size, search, type);
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
}
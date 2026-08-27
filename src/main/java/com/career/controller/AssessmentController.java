package com.career.controller;

import com.career.dto.AssessmentAnswerRequest;
import com.career.dto.AssessmentResultResponse;
import com.career.dto.QuestionResponse;
import com.career.entity.Question;
import com.career.service.AssessmentService;
import com.career.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student/assessment")
@CrossOrigin(origins = "*")
@Tag(name = "Student - General Assessment", description = "Endpoints for general career interest evaluation")
@SecurityRequirement(name = "Bearer Authentication")
public class AssessmentController {

    private static final Logger log = LoggerFactory.getLogger(AssessmentController.class);

    private final AssessmentService assessmentService;
    private final QuestionService questionService;

    public AssessmentController(AssessmentService assessmentService, QuestionService questionService) {
        this.assessmentService = assessmentService;
        this.questionService = questionService;
    }

    @GetMapping("/questions")
    @Operation(summary = "Get active assessment questions")
    public ResponseEntity<List<QuestionResponse>> getQuestions() {
        List<Question> questions = assessmentService.getQuestions();
        List<QuestionResponse> response = questions.stream()
                .map(questionService::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/submit/{studentId}")
    @Operation(summary = "Submit general assessment")
    public ResponseEntity<AssessmentResultResponse> submitAssessment(
            @PathVariable Long studentId,
            @Valid @RequestBody List<AssessmentAnswerRequest> answers) {
        log.info("REST: Submitting general assessment for student ID {}", studentId);
        AssessmentResultResponse result = assessmentService.submitAssessment(studentId, answers);
        return ResponseEntity.ok(result);
    }
}
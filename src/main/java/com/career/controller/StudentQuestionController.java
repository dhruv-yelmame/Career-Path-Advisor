package com.career.controller;

import com.career.dto.TestOptionResponse;
import com.career.entity.QuestionOption;
import com.career.repository.QuestionOptionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student/questions")
@CrossOrigin(origins = "*")
@Tag(name = "Student - Questions", description = "Endpoints for fetching question options for students")
@SecurityRequirement(name = "Bearer Authentication")
public class StudentQuestionController {

    private final QuestionOptionRepository questionOptionRepository;

    public StudentQuestionController(QuestionOptionRepository questionOptionRepository) {
        this.questionOptionRepository = questionOptionRepository;
    }

    @GetMapping("/{questionId}/options")
    @Operation(summary = "Get options for question")
    public ResponseEntity<List<TestOptionResponse>> getOptions(@PathVariable Long questionId) {
        List<QuestionOption> options = questionOptionRepository.findByQuestionId(questionId);
        List<TestOptionResponse> response = options.stream()
                .map(opt -> TestOptionResponse.builder()
                        .id(opt.getId())
                        .optionText(opt.getOptionText())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
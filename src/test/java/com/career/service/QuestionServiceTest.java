package com.career.service;

import com.career.dto.*;
import com.career.entity.Question;
import com.career.entity.QuestionOption;
import com.career.entity.QuestionType;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.QuestionOptionRepository;
import com.career.repository.QuestionRepository;
import com.career.repository.TestQuestionRepository;
import com.career.service.impl.QuestionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private QuestionOptionRepository questionOptionRepository;

    @Mock
    private TestQuestionRepository testQuestionRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private QuestionServiceImpl questionService;

    private Question sampleQuestion;
    private QuestionRequest questionRequest;

    @BeforeEach
    void setUp() {
        sampleQuestion = Question.builder()
                .id(1L)
                .questionText("Do you enjoy designing software architecture?")
                .questionType(QuestionType.INTEREST)
                .active(true)
                .options(new ArrayList<>())
                .build();

        QuestionOption option1 = QuestionOption.builder()
                .id(101L)
                .question(sampleQuestion)
                .optionText("Strongly Agree")
                .category("Technical")
                .score(5)
                .correctAnswer(false)
                .build();

        sampleQuestion.getOptions().add(option1);

        questionRequest = QuestionRequest.builder()
                .questionText("Do you enjoy designing software architecture?")
                .questionType("INTEREST")
                .options(List.of(
                        QuestionOptionRequest.builder()
                                .optionText("Strongly Agree")
                                .category("Technical")
                                .score(5)
                                .correctAnswer(false)
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("Should return all questions")
    void testGetAllQuestions() {
        when(questionRepository.findAll()).thenReturn(List.of(sampleQuestion));

        List<Question> results = questionService.getAllQuestions();

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Do you enjoy designing software architecture?", results.get(0).getQuestionText());
    }

    @Test
    @DisplayName("Should add single question with options")
    void testAddQuestion_Success() {
        when(questionRepository.save(any(Question.class))).thenReturn(sampleQuestion);

        Question response = questionService.addQuestion(questionRequest);

        assertNotNull(response);
        assertEquals("Do you enjoy designing software architecture?", response.getQuestionText());
        verify(questionRepository, times(1)).save(any(Question.class));
    }

    @Test
    @DisplayName("Should process batch question addition")
    void testAddQuestionsBatch() {
        when(questionRepository.saveAll(any())).thenReturn(List.of(sampleQuestion));

        List<Question> results = questionService.addQuestionsBatch(List.of(questionRequest));

        assertNotNull(results);
        assertEquals(1, results.size());
        verify(questionRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Should retrieve question by ID")
    void testGetQuestionById_Success() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(sampleQuestion));

        Question response = questionService.getQuestionById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when question ID does not exist")
    void testGetQuestionById_NotFound() {
        when(questionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> questionService.getQuestionById(99L));
    }

    @Test
    @DisplayName("Should delete question and its associations")
    void testDeleteQuestion() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(sampleQuestion));
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        questionService.deleteQuestion(1L);

        verify(questionRepository, times(1)).findById(1L);
        verify(jdbcTemplate, atLeastOnce()).update(anyString(), any(Object[].class));
    }
}

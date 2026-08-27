package com.career.service;

import com.career.dto.TestRequest;
import com.career.dto.TestResponse;
import com.career.entity.Question;
import com.career.entity.QuestionType;
import com.career.entity.Test;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.QuestionRepository;
import com.career.repository.TestAttemptRepository;
import com.career.repository.TestQuestionRepository;
import com.career.repository.TestRepository;
import com.career.service.impl.TestServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class TestServiceTest {

    @Mock
    private TestRepository testRepository;

    @Mock
    private TestQuestionRepository testQuestionRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private TestAttemptRepository testAttemptRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private TestServiceImpl testService;

    private Test sampleTest;
    private TestRequest testRequest;
    private Question sampleQuestion;

    @BeforeEach
    void setUp() {
        sampleTest = Test.builder()
                .id(1L)
                .testName("Software Aptitude & Career Test")
                .description("Evaluates algorithmic and analytical thinking")
                .questionCount(1)
                .timeLimitMinutes(30)
                .randomQuestions(true)
                .active(true)
                .testQuestions(new ArrayList<>())
                .build();

        sampleQuestion = Question.builder()
                .id(101L)
                .questionText("Sample Question")
                .questionType(QuestionType.INTEREST)
                .active(true)
                .build();

        testRequest = TestRequest.builder()
                .testName("Software Aptitude & Career Test")
                .description("Evaluates algorithmic and analytical thinking")
                .questionCount(1)
                .timeLimitMinutes(30)
                .randomQuestions(true)
                .active(true)
                .questionIds(List.of(101L))
                .build();
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should retrieve all tests")
    void testGetAllTests() {
        when(testRepository.findAll()).thenReturn(List.of(sampleTest));
        when(testAttemptRepository.countByTestId(1L)).thenReturn(5L);

        List<TestResponse> results = testService.getAllTests();

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Software Aptitude & Career Test", results.get(0).getTestName());
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should retrieve test by ID successfully")
    void testGetTestById_Success() {
        when(testRepository.findById(1L)).thenReturn(Optional.of(sampleTest));

        Test response = testService.getTestById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Software Aptitude & Career Test", response.getTestName());
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should throw ResourceNotFoundException when test ID is not found")
    void testGetTestById_NotFound() {
        when(testRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> testService.getTestById(99L));
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should create new test with question associations")
    void testCreateTest() {
        when(testRepository.save(any(Test.class))).thenReturn(sampleTest);
        when(questionRepository.findById(101L)).thenReturn(Optional.of(sampleQuestion));

        Test response = testService.createTest(testRequest);

        assertNotNull(response);
        assertEquals("Software Aptitude & Career Test", response.getTestName());
        verify(testRepository, times(1)).save(any(Test.class));
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should toggle active/deactivate test status")
    void testActivateDeactivateTest() {
        when(testRepository.findById(1L)).thenReturn(Optional.of(sampleTest));
        when(testRepository.save(any(Test.class))).thenReturn(sampleTest);

        Test deactivated = testService.deactivateTest(1L);
        assertNotNull(deactivated);
        assertFalse(sampleTest.getActive());

        Test activated = testService.activateTest(1L);
        assertNotNull(activated);
        assertTrue(sampleTest.getActive());
    }

    @org.junit.jupiter.api.Test
    @DisplayName("Should delete test and its dependencies")
    void testDeleteTest() {
        when(testRepository.findById(1L)).thenReturn(Optional.of(sampleTest));
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        testService.deleteTest(1L);

        verify(testRepository, times(1)).findById(1L);
        verify(jdbcTemplate, atLeastOnce()).update(anyString(), any(Object[].class));
    }
}

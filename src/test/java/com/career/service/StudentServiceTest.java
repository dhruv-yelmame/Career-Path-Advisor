package com.career.service;

import com.career.dto.DashboardStatsResponse;
import com.career.dto.StudentResponse;
import com.career.entity.AttemptStatus;
import com.career.entity.Role;
import com.career.entity.User;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.*;
import com.career.service.impl.StudentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TestRepository testRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private CareerPathRepository careerPathRepository;

    @Mock
    private TestAttemptRepository testAttemptRepository;

    @Mock
    private AssessmentResultRepository assessmentResultRepository;

    @InjectMocks
    private StudentServiceImpl studentService;

    private User sampleStudent;

    @BeforeEach
    void setUp() {
        sampleStudent = User.builder()
                .id(1L)
                .name("Alex Smith")
                .email("alexsmith@example.com")
                .role(Role.STUDENT)
                .mobile("9876543210")
                .course("Computer Science")
                .percentage("85.0")
                .build();
    }

    @Test
    @DisplayName("Should retrieve all students with masked email and phone")
    void testGetAllStudents() {
        when(userRepository.findByRole(Role.STUDENT)).thenReturn(List.of(sampleStudent));
        when(testAttemptRepository.countByStudentId(1L)).thenReturn(2L);
        when(testAttemptRepository.countByStudentIdAndStatus(1L, AttemptStatus.COMPLETED)).thenReturn(2L);
        when(testAttemptRepository.countByStudentIdAndStatus(1L, AttemptStatus.AUTO_SUBMITTED)).thenReturn(0L);
        when(assessmentResultRepository.findTopByStudentIdOrderByCompletedAtDesc(1L)).thenReturn(Optional.empty());

        List<StudentResponse> students = studentService.getAllStudents();

        assertNotNull(students);
        assertEquals(1, students.size());
        StudentResponse res = students.get(0);
        assertEquals("Alex Smith", res.getName());
        assertTrue(res.getMaskedEmail().contains("****"));
        assertTrue(res.getMobile().contains("******"));
    }

    @Test
    @DisplayName("Should retrieve student by ID successfully")
    void testGetStudentById() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleStudent));
        when(testAttemptRepository.countByStudentId(1L)).thenReturn(0L);
        when(testAttemptRepository.countByStudentIdAndStatus(1L, AttemptStatus.COMPLETED)).thenReturn(0L);
        when(testAttemptRepository.countByStudentIdAndStatus(1L, AttemptStatus.AUTO_SUBMITTED)).thenReturn(0L);
        when(assessmentResultRepository.findTopByStudentIdOrderByCompletedAtDesc(1L)).thenReturn(Optional.empty());

        StudentResponse res = studentService.getStudentById(1L);

        assertNotNull(res);
        assertEquals(1L, res.getId());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when student is not found")
    void testGetStudentById_NotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> studentService.getStudentById(99L));
    }

    @Test
    @DisplayName("Should aggregate dashboard metrics correctly")
    void testGetDashboardStats() {
        when(userRepository.countByRole(Role.STUDENT)).thenReturn(25L);
        when(questionRepository.count()).thenReturn(50L);
        when(testRepository.count()).thenReturn(5L);
        when(careerPathRepository.count()).thenReturn(8L);
        when(testAttemptRepository.count()).thenReturn(40L);
        when(testAttemptRepository.countByStatus(AttemptStatus.COMPLETED)).thenReturn(20L);
        when(testAttemptRepository.countByStatus(AttemptStatus.AUTO_SUBMITTED)).thenReturn(10L);
        when(careerPathRepository.findAll()).thenReturn(List.of());

        DashboardStatsResponse stats = studentService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(25L, stats.getTotalStudents());
        assertEquals(5L, stats.getTotalTests());
        assertEquals(50L, stats.getTotalQuestions());
        assertEquals(8L, stats.getTotalCareerPaths());
        assertEquals(40L, stats.getTotalAttempts());
        assertEquals(30L, stats.getCompletedAttempts());
    }
}

package com.career.controller;

import com.career.constant.AppConstants;
import com.career.dto.DashboardStatsResponse;
import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResponse;
import com.career.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
@CrossOrigin(origins = "*")
@Tag(name = "Admin - Student Management", description = "Endpoints for managing registered students and dashboard metrics")
@SecurityRequirement(name = "Bearer Authentication")
public class StudentController {

    private static final Logger log = LoggerFactory.getLogger(StudentController.class);

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    @Operation(summary = "Get all students", description = "Returns all students (or paged if page parameter supplied)")
    public ResponseEntity<?> getAllStudents(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(required = false) String search) {

        log.debug("REST: Fetching students. page={}, size={}, search={}", page, size, search);
        if (page != null) {
            PaginatedResponse<StudentResponse> paged = studentService.getStudentsPaged(page, size, search);
            return ResponseEntity.ok(paged);
        }

        List<StudentResponse> students = studentService.getAllStudents();
        return ResponseEntity.ok(students);
    }

    @GetMapping("/count")
    @Operation(summary = "Count registered students", description = "Returns the total number of registered students")
    public ResponseEntity<Long> countStudents() {
        return ResponseEntity.ok(studentService.countStudents());
    }

    @GetMapping("/dashboard-stats")
    @Operation(summary = "Get admin dashboard statistics", description = "Returns platform metrics, total counts, and career distributions")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        log.debug("REST: Fetching dashboard stats");
        return ResponseEntity.ok(studentService.getDashboardStats());
    }

    @GetMapping("/{id:\\d+}")
    @Operation(summary = "Get student details by ID", description = "Returns student profile details and assessment history")
    public ResponseEntity<StudentResponse> getStudentById(@PathVariable Long id) {
        log.debug("REST: Fetching student ID {}", id);
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @DeleteMapping("/{id:\\d+}")
    @Operation(summary = "Delete student", description = "Removes a student account from the system")
    public ResponseEntity<String> deleteStudent(@PathVariable Long id) {
        log.info("REST: Deleting student ID {}", id);
        studentService.deleteStudent(id);
        return ResponseEntity.ok("Student deleted successfully");
    }
}
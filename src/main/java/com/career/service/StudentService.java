package com.career.service;

import com.career.dto.DashboardStatsResponse;
import com.career.dto.PaginatedResponse;
import com.career.dto.StudentResponse;

import java.util.List;

public interface StudentService {

    List<StudentResponse> getAllStudents();

    PaginatedResponse<StudentResponse> getStudentsPaged(int page, int size, String search);

    StudentResponse getStudentById(Long id);

    long countStudents();

    void deleteStudent(Long id);

    DashboardStatsResponse getDashboardStats();
}
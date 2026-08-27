package com.career.service;

import com.career.dto.CareerPathRequest;
import com.career.dto.CareerPathResponse;
import com.career.entity.CareerPath;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.CareerPathRepository;
import com.career.service.impl.CareerPathServiceImpl;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CareerPathServiceTest {

    @Mock
    private CareerPathRepository careerPathRepository;

    @InjectMocks
    private CareerPathServiceImpl careerPathService;

    private CareerPath sampleCareer;
    private CareerPathRequest request;

    @BeforeEach
    void setUp() {
        sampleCareer = CareerPath.builder()
                .id(1L)
                .careerName("Software Engineer")
                .category("Technical")
                .description("Builds software applications")
                .skills("Java, Spring Boot, SQL")
                .education("B.Tech / MCA")
                .salaryRange("$80,000 - $130,000")
                .build();

        request = CareerPathRequest.builder()
                .careerName("Software Engineer")
                .category("Technical")
                .description("Builds software applications")
                .skills("Java, Spring Boot, SQL")
                .education("B.Tech / MCA")
                .salaryRange("$80,000 - $130,000")
                .build();
    }

    @Test
    @DisplayName("Should return all career paths")
    void testGetAllCareerPaths() {
        when(careerPathRepository.findAllByOrderByCareerNameAsc()).thenReturn(List.of(sampleCareer));

        List<CareerPathResponse> results = careerPathService.getAllCareerPaths();

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Software Engineer", results.get(0).getCareerName());
        assertEquals("Technical", results.get(0).getCategory());
    }

    @Test
    @DisplayName("Should find career path by ID successfully")
    void testGetCareerPathById_Success() {
        when(careerPathRepository.findById(1L)).thenReturn(Optional.of(sampleCareer));

        CareerPathResponse response = careerPathService.getCareerPathById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Software Engineer", response.getCareerName());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when career path ID does not exist")
    void testGetCareerPathById_NotFound() {
        when(careerPathRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> careerPathService.getCareerPathById(99L));
    }

    @Test
    @DisplayName("Should create new career path")
    void testAddCareerPath() {
        when(careerPathRepository.save(any(CareerPath.class))).thenReturn(sampleCareer);

        CareerPathResponse response = careerPathService.addCareerPath(request);

        assertNotNull(response);
        assertEquals("Software Engineer", response.getCareerName());
        verify(careerPathRepository, times(1)).save(any(CareerPath.class));
    }

    @Test
    @DisplayName("Should update existing career path")
    void testUpdateCareerPath() {
        when(careerPathRepository.findById(1L)).thenReturn(Optional.of(sampleCareer));
        when(careerPathRepository.save(any(CareerPath.class))).thenReturn(sampleCareer);

        request.setCareerName("Senior Software Engineer");
        CareerPathResponse response = careerPathService.updateCareerPath(1L, request);

        assertNotNull(response);
        verify(careerPathRepository, times(1)).save(any(CareerPath.class));
    }

    @Test
    @DisplayName("Should delete career path by ID")
    void testDeleteCareerPath() {
        when(careerPathRepository.findById(1L)).thenReturn(Optional.of(sampleCareer));
        doNothing().when(careerPathRepository).delete(sampleCareer);

        careerPathService.deleteCareerPath(1L);

        verify(careerPathRepository, times(1)).delete(sampleCareer);
    }
}

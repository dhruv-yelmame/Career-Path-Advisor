package com.career.service;

import com.career.dto.LearningResourceRequest;
import com.career.dto.LearningResourceResponse;
import com.career.dto.PaginatedResponse;
import com.career.entity.LearningResource;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.LearningResourceRepository;
import com.career.service.impl.LearningResourceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LearningResourceServiceTest {

    @Mock
    private LearningResourceRepository learningResourceRepository;

    @InjectMocks
    private LearningResourceServiceImpl learningResourceService;

    private LearningResource sampleResource;
    private LearningResourceRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleResource = new LearningResource(
                1L,
                "Oracle Java SE Documentation",
                "Stage 01",
                "Official Docs & Guides",
                "https://docs.oracle.com/en/java/",
                "Documentation",
                "Software Developer",
                "Active",
                "Official documentation and API reference."
        );

        sampleRequest = new LearningResourceRequest(
                "Oracle Java SE Documentation",
                "Stage 01",
                "Official Docs & Guides",
                "https://docs.oracle.com/en/java/",
                "Documentation",
                "Software Developer",
                "Active",
                "Official documentation and API reference."
        );
    }

    @Test
    @DisplayName("Should return filtered learning resources with pagination")
    @SuppressWarnings("unchecked")
    void testGetResourcesFiltered() {
        PageImpl<LearningResource> page = new PageImpl<>(List.of(sampleResource));
        when(learningResourceRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PaginatedResponse<LearningResourceResponse> response =
                learningResourceService.getResourcesFiltered("java documentation", "Software Developer", "Documentation", 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Oracle Java SE Documentation", response.getContent().get(0).getTitle());
        verify(learningResourceRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("Should return resource by ID when found")
    void testGetResourceById_Success() {
        when(learningResourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));

        LearningResourceResponse response = learningResourceService.getResourceById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Oracle Java SE Documentation", response.getTitle());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when resource not found")
    void testGetResourceById_NotFound() {
        when(learningResourceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> learningResourceService.getResourceById(99L));
    }

    @Test
    @DisplayName("Should delete resource successfully")
    void testDeleteResource_Success() {
        when(learningResourceRepository.existsById(1L)).thenReturn(true);
        doNothing().when(learningResourceRepository).deleteById(1L);

        assertDoesNotThrow(() -> learningResourceService.deleteResource(1L));
        verify(learningResourceRepository, times(1)).deleteById(1L);
    }

    @Test
    @DisplayName("Should create resource successfully")
    void testCreateResource_Success() {
        when(learningResourceRepository.save(any(LearningResource.class))).thenReturn(sampleResource);

        LearningResourceResponse response = learningResourceService.createResource(sampleRequest);

        assertNotNull(response);
        assertEquals("Oracle Java SE Documentation", response.getTitle());
        verify(learningResourceRepository, times(1)).save(any(LearningResource.class));
    }

    @Test
    @DisplayName("Should update resource successfully while preserving stage and status if omitted")
    void testUpdateResource_Success() {
        when(learningResourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(learningResourceRepository.save(any(LearningResource.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LearningResourceRequest updateReq = new LearningResourceRequest();
        updateReq.setTitle("Updated Java Documentation");
        updateReq.setCategory("Official Docs & Guides");
        updateReq.setResourceType("Documentation");
        updateReq.setCourseTrack("Software Developer");
        updateReq.setResourceUrl("https://docs.oracle.com/en/java/21/");
        updateReq.setDescription("Updated description");

        LearningResourceResponse response = learningResourceService.updateResource(1L, updateReq);

        assertNotNull(response);
        assertEquals("Updated Java Documentation", response.getTitle());
        assertEquals("Stage 01", response.getStage()); // preserved existing
        assertEquals("Active", response.getStatus()); // preserved existing
        verify(learningResourceRepository, times(1)).save(any(LearningResource.class));
    }
}

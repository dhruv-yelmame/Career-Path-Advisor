package com.career.service;

import com.career.dto.LearningResourceRequest;
import com.career.dto.LearningResourceResponse;
import com.career.dto.PaginatedResponse;

import java.util.List;
import java.util.Map;

public interface LearningResourceService {

    LearningResourceResponse createResource(LearningResourceRequest request);

    LearningResourceResponse updateResource(Long id, LearningResourceRequest request);

    void deleteResource(Long id);

    LearningResourceResponse getResourceById(Long id);

    List<LearningResourceResponse> getAllResources();

    PaginatedResponse<LearningResourceResponse> getResourcesFiltered(String search, String courseTrack, String resourceType, int page, int size);

    List<LearningResourceResponse> getResourcesByTrack(String courseTrack);

    Map<String, Object> getResourceStats();
}

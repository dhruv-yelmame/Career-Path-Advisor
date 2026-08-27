package com.career.service;

import com.career.dto.CareerPathRequest;
import com.career.dto.CareerPathResponse;
import com.career.dto.PaginatedResponse;

import java.util.List;

public interface CareerPathService {

    CareerPathResponse addCareerPath(CareerPathRequest request);

    List<CareerPathResponse> getAllCareerPaths();

    PaginatedResponse<CareerPathResponse> getCareerPathsPaged(int page, int size, String search);

    CareerPathResponse getCareerPathById(Long id);

    CareerPathResponse updateCareerPath(Long id, CareerPathRequest request);

    void deleteCareerPath(Long id);
}
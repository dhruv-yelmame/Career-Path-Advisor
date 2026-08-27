package com.career.service.impl;

import com.career.config.CacheConfig;
import com.career.dto.CareerPathRequest;
import com.career.dto.CareerPathResponse;
import com.career.dto.PaginatedResponse;
import com.career.entity.CareerPath;
import com.career.exception.BadRequestException;
import com.career.exception.DuplicateResourceException;
import com.career.exception.ResourceNotFoundException;
import com.career.repository.CareerPathRepository;
import com.career.service.CareerPathService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CareerPathServiceImpl implements CareerPathService {

    private static final Logger log = LoggerFactory.getLogger(CareerPathServiceImpl.class);

    private final CareerPathRepository careerPathRepository;

    public CareerPathServiceImpl(CareerPathRepository careerPathRepository) {
        this.careerPathRepository = careerPathRepository;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_CAREER_PATHS, allEntries = true)
    public CareerPathResponse addCareerPath(CareerPathRequest request) {
        log.info("Adding new career path: {}", request.getCareerName());

        String category = Optional.ofNullable(request.getCategory())
                .map(String::trim)
                .map(String::toUpperCase)
                .orElseThrow(() -> new BadRequestException("Category is required"));

        if (careerPathRepository.existsByCategory(category)) {
            log.warn("Career path with category {} already exists", category);
            throw new DuplicateResourceException("Career path with category '" + category + "' already exists");
        }

        if (careerPathRepository.existsByCareerName(request.getCareerName().trim())) {
            log.warn("Career path name {} already exists", request.getCareerName());
            throw new DuplicateResourceException("Career path name '" + request.getCareerName() + "' already exists");
        }

        CareerPath careerPath = CareerPath.builder()
                .careerName(request.getCareerName().trim())
                .category(category)
                .description(request.getDescription().trim())
                .skills(request.getSkills().trim())
                .education(request.getEducation().trim())
                .salaryRange(request.getSalaryRange().trim())
                .build();

        CareerPath saved = careerPathRepository.save(careerPath);
        log.info("Career path {} saved with ID: {}", saved.getCareerName(), saved.getId());

        return convertToResponse(saved);
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_CAREER_PATHS)
    public List<CareerPathResponse> getAllCareerPaths() {
        log.debug("Fetching all career paths from DB/Cache");
        return careerPathRepository.findAllByOrderByCareerNameAsc()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaginatedResponse<CareerPathResponse> getCareerPathsPaged(int page, int size, String search) {
        log.debug("Fetching paged career paths: page={}, size={}, search={}", page, size, search);
        Pageable pageable = PageRequest.of(page, size, Sort.by("careerName").ascending());
        Page<CareerPath> pathPage;

        if (search != null && !search.trim().isEmpty()) {
            pathPage = careerPathRepository.searchCareerPaths(search.trim(), pageable);
        } else {
            pathPage = careerPathRepository.findAllOrdered(pageable);
        }

        List<CareerPathResponse> responses = pathPage.getContent()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<CareerPathResponse>builder()
                .content(responses)
                .pageNumber(pathPage.getNumber())
                .pageSize(pathPage.getSize())
                .totalElements(pathPage.getTotalElements())
                .totalPages(pathPage.getTotalPages())
                .first(pathPage.isFirst())
                .last(pathPage.isLast())
                .build();
    }

    @Override
    public CareerPathResponse getCareerPathById(Long id) {
        log.debug("Fetching career path by ID: {}", id);
        CareerPath careerPath = careerPathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Career path not found with id: " + id));
        return convertToResponse(careerPath);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_CAREER_PATHS, allEntries = true)
    public CareerPathResponse updateCareerPath(Long id, CareerPathRequest request) {
        log.info("Updating career path ID: {}", id);
        CareerPath existing = careerPathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Career path not found with id: " + id));

        String category = Optional.ofNullable(request.getCategory())
                .map(String::trim)
                .map(String::toUpperCase)
                .orElseThrow(() -> new BadRequestException("Category is required"));

        existing.setCareerName(request.getCareerName().trim());
        existing.setCategory(category);
        existing.setDescription(request.getDescription().trim());
        existing.setSkills(request.getSkills().trim());
        existing.setEducation(request.getEducation().trim());
        existing.setSalaryRange(request.getSalaryRange().trim());

        CareerPath updated = careerPathRepository.save(existing);
        log.info("Career path ID {} updated successfully", id);

        return convertToResponse(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_CAREER_PATHS, allEntries = true)
    public void deleteCareerPath(Long id) {
        log.info("Deleting career path ID: {}", id);
        CareerPath careerPath = careerPathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Career path not found with id: " + id));

        careerPathRepository.delete(careerPath);
        log.info("Career path ID {} deleted successfully", id);
    }

    private CareerPathResponse convertToResponse(CareerPath careerPath) {
        return CareerPathResponse.builder()
                .id(careerPath.getId())
                .careerName(careerPath.getCareerName())
                .category(careerPath.getCategory())
                .description(careerPath.getDescription())
                .skills(careerPath.getSkills())
                .education(careerPath.getEducation())
                .salaryRange(careerPath.getSalaryRange())
                .build();
    }
}
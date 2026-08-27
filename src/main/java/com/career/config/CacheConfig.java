package com.career.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_CAREER_PATHS = "careerPaths";
    public static final String CACHE_TESTS = "tests";
    public static final String CACHE_QUESTIONS = "questions";
    public static final String CACHE_DASHBOARD_STATS = "dashboardStats";

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(List.of(
                CACHE_CAREER_PATHS,
                CACHE_TESTS,
                CACHE_QUESTIONS,
                CACHE_DASHBOARD_STATS
        ));
        return cacheManager;
    }
}

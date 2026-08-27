package com.career.repository;

import com.career.constant.QueryConstants;
import com.career.entity.Role;
import com.career.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByEmailAndRole(String email, Role role);

    List<User> findByRole(Role role);

    @Query(QueryConstants.FIND_STUDENTS_BY_ROLE)
    Page<User> findByRolePaged(@Param("role") Role role, Pageable pageable);

    @Query(QueryConstants.SEARCH_STUDENTS)
    Page<User> searchStudents(@Param("search") String search, Pageable pageable);

    @Query(QueryConstants.COUNT_BY_ROLE)
    long countByRole(@Param("role") Role role);

    @org.springframework.data.jpa.repository.Modifying
    @Query(QueryConstants.UPDATE_USER_PASSWORD)
    int updatePassword(@Param("id") Long id, @Param("password") String password);

    @org.springframework.data.jpa.repository.Modifying
    @Query(QueryConstants.UPDATE_STUDENT_PROFILE)
    int updateStudentProfile(@Param("id") Long id,
                             @Param("name") String name,
                             @Param("mobile") String mobile,
                             @Param("course") String course,
                             @Param("percentage") String percentage);
}
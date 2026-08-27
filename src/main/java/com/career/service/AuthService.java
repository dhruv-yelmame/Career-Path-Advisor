package com.career.service;

import com.career.dto.LoginRequest;
import com.career.dto.LoginResponse;
import com.career.dto.RegisterRequest;

public interface AuthService {

    String register(RegisterRequest request);

    LoginResponse studentLogin(LoginRequest request);

    LoginResponse adminLogin(LoginRequest request);
}
package com.capstone.calma.business.service.auth;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.dto.TokenResponseDto;

public interface IdentityProvider {
    String registerUser(SignupDto signupDto);
    boolean userExists(String email);
    TokenResponseDto login(LoginDto loginDto);
    TokenResponseDto refreshToken(String refreshToken);
}

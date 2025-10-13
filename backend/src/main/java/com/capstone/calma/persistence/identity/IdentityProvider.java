package com.capstone.calma.persistence.identity;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.dto.TokenResponseDto;

public interface IdentityProvider {
    String registerUser(SignupDto signupDto);
    TokenResponseDto login(LoginDto loginDto);
    TokenResponseDto refreshToken(String refreshToken);
}

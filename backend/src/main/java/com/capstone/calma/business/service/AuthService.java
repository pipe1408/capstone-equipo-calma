package com.capstone.calma.business.service;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.dto.TokenResponseDto;
import com.capstone.calma.persistence.identity.IdentityProvider;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final IdentityProvider identityProvider;

    public AuthService(IdentityProvider identityProvider) {
        this.identityProvider = identityProvider;
    }

    public String registerUser(SignupDto signupDto) {
        return identityProvider.registerUser(signupDto);
    }

    public TokenResponseDto login(LoginDto loginDto) {
        return identityProvider.login(loginDto);
    }

    public TokenResponseDto refreshToken(String refreshToken) {
        return identityProvider.refreshToken(refreshToken);
    }
}

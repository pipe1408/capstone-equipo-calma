package com.capstone.calma.business.service.auth;

import com.capstone.calma.business.dto.SignupDto;
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
}

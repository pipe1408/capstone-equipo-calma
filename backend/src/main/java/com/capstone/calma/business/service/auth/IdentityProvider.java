package com.capstone.calma.business.service.auth;

import com.capstone.calma.business.dto.SignupDto;

public interface IdentityProvider {
    String registerUser(SignupDto signupDto);
    boolean userExists(String email);
}

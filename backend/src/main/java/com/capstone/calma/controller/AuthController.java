package com.capstone.calma.controller;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.RefreshTokenDto;
import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.dto.TokenResponseDto;
import com.capstone.calma.business.service.AuthService;
import com.capstone.calma.business.service.UserAssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService authService;
    private final UserAssessmentService userAssessmentService;

    public AuthController(AuthService authService, UserAssessmentService userAssessmentService) {
        this.authService = authService;
        this.userAssessmentService = userAssessmentService;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signUp(@RequestBody @Valid SignupDto signupDto) {
        String id = authService.registerUser(signupDto);
        String result = userAssessmentService.userAssessmentJpaRepository.savePersonalityAssestment(signupDto.assessmentAnswers(), id);
        return ResponseEntity.ok("User registered successfully. " + result + " User ID: " + id);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponseDto> logIn(@RequestBody @Valid LoginDto loginDto) {
        TokenResponseDto tokenResponse = authService.login(loginDto);
        return ResponseEntity.ok(tokenResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponseDto> refreshToken(@RequestBody @Valid RefreshTokenDto refreshTokenDto) {
        TokenResponseDto tokenResponse = authService.refreshToken(refreshTokenDto.refreshToken());
        return ResponseEntity.ok(tokenResponse);
    }
}

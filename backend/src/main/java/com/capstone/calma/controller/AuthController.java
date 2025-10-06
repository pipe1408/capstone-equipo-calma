package com.capstone.calma.controller;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.RefreshTokenDto;
import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.dto.TokenResponseDto;
import com.capstone.calma.business.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signUp(@RequestBody @Valid SignupDto signupDto) {
        String id = authService.registerUser(signupDto);
        return ResponseEntity.ok(id);
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

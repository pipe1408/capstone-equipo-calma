package com.capstone.calma.controller;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.RefreshTokenDto;
import com.capstone.calma.business.dto.SignupDto;
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
    public ResponseEntity<String> logIn(@RequestBody @Valid LoginDto loginDto) {
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/refresh")
    public ResponseEntity<String> refreshToken(@RequestBody @Valid RefreshTokenDto refreshTokenDto) {
        return ResponseEntity.ok("User registered successfully");
    }
}

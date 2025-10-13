package com.capstone.calma.controller;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.RefreshTokenDto;
import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.dto.TokenResponseDto;
import com.capstone.calma.business.service.AuthService;
import com.capstone.calma.business.service.UserAssessmentService;
import com.capstone.calma.persistence.repository.UserAssessmentJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private UserAssessmentJpaRepository userAssessmentJpaRepository;

    private AuthController authController;
    private UserAssessmentService userAssessmentService;

    private SignupDto signupDto;
    private LoginDto loginDto;
    private RefreshTokenDto refreshTokenDto;
    private TokenResponseDto tokenResponseDto;

    @BeforeEach
    void setUp() {
        // Given: Prepare test data
        signupDto = new SignupDto(
                "John",
                "Doe",
                "john.doe@example.com",
                "password123",
                "ABCDA"
        );

        loginDto = new LoginDto(
                "john.doe@example.com",
                "password123"
        );

        refreshTokenDto = new RefreshTokenDto("refresh-token-456");

        tokenResponseDto = new TokenResponseDto(
                "access-token-123",
                "refresh-token-456",
                "Bearer",
                3600
        );

        // Create service and controller with mocked dependencies
        userAssessmentService = new UserAssessmentService(userAssessmentJpaRepository);
        authController = new AuthController(authService, userAssessmentService);
    }

    @Test
    @DisplayName("Given valid signup data, When signUp is called, Then should register user and return success message")
    void givenValidSignupData_whenSignUp_thenShouldRegisterUserAndReturnSuccessMessage() {
        // Given: Mock the auth service and assessment service
        String userId = "user-123";
        String assessmentResult = "Personality analysis not yet implemented";
        when(authService.registerUser(signupDto)).thenReturn(userId);
        when(userAssessmentJpaRepository.savePersonalityAssestment(signupDto.assessmentAnswers(), userId))
                .thenReturn(assessmentResult);

        // When: Call signUp endpoint
        ResponseEntity<String> response = authController.signUp(signupDto);

        // Then: Should return success message with user ID
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).contains("User registered successfully");
        assertThat(response.getBody()).contains(userId);
        assertThat(response.getBody()).contains(assessmentResult);
        verify(authService, times(1)).registerUser(signupDto);
        verify(userAssessmentJpaRepository, times(1))
                .savePersonalityAssestment(signupDto.assessmentAnswers(), userId);
    }

    @Test
    @DisplayName("Given valid login credentials, When logIn is called, Then should return token response")
    void givenValidLoginCredentials_whenLogIn_thenShouldReturnTokenResponse() {
        // Given: Mock the auth service to return token response
        when(authService.login(loginDto)).thenReturn(tokenResponseDto);

        // When: Call login endpoint
        ResponseEntity<TokenResponseDto> response = authController.logIn(loginDto);

        // Then: Should return token response
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isEqualTo("access-token-123");
        assertThat(response.getBody().refreshToken()).isEqualTo("refresh-token-456");
        assertThat(response.getBody().tokenType()).isEqualTo("Bearer");
        assertThat(response.getBody().expiresIn()).isEqualTo(3600);
        verify(authService, times(1)).login(loginDto);
    }

    @Test
    @DisplayName("Given valid refresh token, When refreshToken is called, Then should return new token response")
    void givenValidRefreshToken_whenRefreshToken_thenShouldReturnNewTokenResponse() {
        // Given: Mock the auth service to return new token response
        when(authService.refreshToken(refreshTokenDto.refreshToken())).thenReturn(tokenResponseDto);

        // When: Call refresh token endpoint
        ResponseEntity<TokenResponseDto> response = authController.refreshToken(refreshTokenDto);

        // Then: Should return new token response
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isEqualTo("access-token-123");
        assertThat(response.getBody().refreshToken()).isEqualTo("refresh-token-456");
        verify(authService, times(1)).refreshToken(refreshTokenDto.refreshToken());
    }
}

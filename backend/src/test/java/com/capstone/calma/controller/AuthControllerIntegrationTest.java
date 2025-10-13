package com.capstone.calma.controller;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.RefreshTokenDto;
import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.dto.TokenResponseDto;
import com.capstone.calma.business.service.AuthService;
import com.capstone.calma.business.service.UserAssessmentService;
import com.capstone.calma.persistence.repository.UserAssessmentJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(AuthControllerIntegrationTest.TestConfig.class)
@DisplayName("AuthController Integration Tests")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @Autowired
    private UserAssessmentJpaRepository userAssessmentJpaRepository;

    @TestConfiguration
    static class TestConfig {
        @Bean
        public UserAssessmentService userAssessmentService(UserAssessmentJpaRepository repository) {
            return new UserAssessmentService(repository);
        }

        @Bean
        public UserAssessmentJpaRepository userAssessmentJpaRepository() {
            return mock(UserAssessmentJpaRepository.class);
        }
    }

    @Test
    @DisplayName("Given valid signup request, When POST /api/auth/signup, Then should return 200 with success message")
    void givenValidSignupRequest_whenPostSignup_thenShouldReturn200WithSuccessMessage() throws Exception {
        // Given: Valid signup data
        SignupDto signupDto = new SignupDto(
                "John",
                "Doe",
                "john.doe@example.com",
                "password123",
                "ABCDA"
        );

        String userId = "user-123";
        String assessmentResult = "Personality analysis not yet implemented";
        when(authService.registerUser(any(SignupDto.class))).thenReturn(userId);
        when(userAssessmentJpaRepository.savePersonalityAssestment(anyString(), anyString()))
                .thenReturn(assessmentResult);

        // When: POST request to /api/auth/signup
        // Then: Should return 200 with success message
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupDto)))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("User registered successfully")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString(userId)));
    }

    @Test
    @DisplayName("Given invalid signup request with missing fields, When POST /api/auth/signup, Then should return 400")
    void givenInvalidSignupRequest_whenPostSignup_thenShouldReturn400() throws Exception {
        // Given: Invalid signup data (missing required fields)
        String invalidJson = "{\"firstName\":\"\",\"lastName\":\"\"}";

        // When: POST request to /api/auth/signup with invalid data
        // Then: Should return 400 Bad Request
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Given valid login request, When POST /api/auth/login, Then should return 200 with token response")
    void givenValidLoginRequest_whenPostLogin_thenShouldReturn200WithTokenResponse() throws Exception {
        // Given: Valid login credentials
        LoginDto loginDto = new LoginDto(
                "john.doe@example.com",
                "password123"
        );

        TokenResponseDto tokenResponse = new TokenResponseDto(
                "access-token-123",
                "refresh-token-456",
                "Bearer",
                3600
        );
        when(authService.login(any(LoginDto.class))).thenReturn(tokenResponse);

        // When: POST request to /api/auth/login
        // Then: Should return 200 with token response
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token-123"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token-456"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600));
    }

    @Test
    @DisplayName("Given invalid login request with missing password, When POST /api/auth/login, Then should return 400")
    void givenInvalidLoginRequest_whenPostLogin_thenShouldReturn400() throws Exception {
        // Given: Invalid login data (missing password)
        String invalidJson = "{\"email\":\"john.doe@example.com\"}";

        // When: POST request to /api/auth/login with invalid data
        // Then: Should return 400 Bad Request
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Given valid refresh token request, When POST /api/auth/refresh, Then should return 200 with new token response")
    void givenValidRefreshTokenRequest_whenPostRefresh_thenShouldReturn200WithNewTokenResponse() throws Exception {
        // Given: Valid refresh token
        RefreshTokenDto refreshTokenDto = new RefreshTokenDto("refresh-token-456");

        TokenResponseDto tokenResponse = new TokenResponseDto(
                "new-access-token-789",
                "new-refresh-token-012",
                "Bearer",
                3600
        );
        when(authService.refreshToken(anyString())).thenReturn(tokenResponse);

        // When: POST request to /api/auth/refresh
        // Then: Should return 200 with new token response
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshTokenDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new-access-token-789"))
                .andExpect(jsonPath("$.refreshToken").value("new-refresh-token-012"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600));
    }

    @Test
    @DisplayName("Given invalid refresh token request, When POST /api/auth/refresh, Then should return 400")
    void givenInvalidRefreshTokenRequest_whenPostRefresh_thenShouldReturn400() throws Exception {
        // Given: Invalid refresh token data (empty refresh token)
        String invalidJson = "{\"refreshToken\":\"\"}";

        // When: POST request to /api/auth/refresh with invalid data
        // Then: Should return 400 Bad Request
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }
}

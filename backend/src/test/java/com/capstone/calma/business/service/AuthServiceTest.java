package com.capstone.calma.business.service;

import com.capstone.calma.business.dto.LoginDto;
import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.dto.TokenResponseDto;
import com.capstone.calma.persistence.identity.IdentityProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private IdentityProvider identityProvider;

    @InjectMocks
    private AuthService authService;

    private SignupDto signupDto;
    private LoginDto loginDto;
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

        tokenResponseDto = new TokenResponseDto(
                "access-token-123",
                "refresh-token-456",
                "Bearer",
                3600
        );
    }

    @Test
    @DisplayName("Given valid signup data, When registerUser is called, Then should return user ID")
    void givenValidSignupData_whenRegisterUser_thenShouldReturnUserId() {
        // Given: Mock the identity provider to return a user ID
        String expectedUserId = "user-123";
        when(identityProvider.registerUser(signupDto)).thenReturn(expectedUserId);

        // When: Register user through auth service
        String actualUserId = authService.registerUser(signupDto);

        // Then: Verify the user ID is returned and identity provider was called
        assertThat(actualUserId).isEqualTo(expectedUserId);
        verify(identityProvider, times(1)).registerUser(signupDto);
    }

    @Test
    @DisplayName("Given valid login credentials, When login is called, Then should return token response")
    void givenValidLoginCredentials_whenLogin_thenShouldReturnTokenResponse() {
        // Given: Mock the identity provider to return token response
        when(identityProvider.login(loginDto)).thenReturn(tokenResponseDto);

        // When: Login through auth service
        TokenResponseDto actualResponse = authService.login(loginDto);

        // Then: Verify token response is returned and identity provider was called
        assertThat(actualResponse).isNotNull();
        assertThat(actualResponse.accessToken()).isEqualTo("access-token-123");
        assertThat(actualResponse.refreshToken()).isEqualTo("refresh-token-456");
        assertThat(actualResponse.tokenType()).isEqualTo("Bearer");
        assertThat(actualResponse.expiresIn()).isEqualTo(3600);
        verify(identityProvider, times(1)).login(loginDto);
    }

    @Test
    @DisplayName("Given valid refresh token, When refreshToken is called, Then should return new token response")
    void givenValidRefreshToken_whenRefreshToken_thenShouldReturnNewTokenResponse() {
        // Given: Mock the identity provider to return new token response
        String refreshToken = "refresh-token-456";
        when(identityProvider.refreshToken(refreshToken)).thenReturn(tokenResponseDto);

        // When: Refresh token through auth service
        TokenResponseDto actualResponse = authService.refreshToken(refreshToken);

        // Then: Verify new token response is returned and identity provider was called
        assertThat(actualResponse).isNotNull();
        assertThat(actualResponse.accessToken()).isEqualTo("access-token-123");
        assertThat(actualResponse.refreshToken()).isEqualTo("refresh-token-456");
        verify(identityProvider, times(1)).refreshToken(refreshToken);
    }
}

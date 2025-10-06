package com.capstone.calma.business.dto;

public record TokenResponseDto(
        String accessToken,
        String refreshToken,
        String tokenType,
        Integer expiresIn
) {
}

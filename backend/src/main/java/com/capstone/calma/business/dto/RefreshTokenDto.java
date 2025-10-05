package com.capstone.calma.business.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenDto(
        @NotBlank String refreshToken
) {
}

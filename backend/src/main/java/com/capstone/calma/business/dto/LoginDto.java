package com.capstone.calma.business.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginDto(
        @Email String email,
        @NotBlank String password) {
}

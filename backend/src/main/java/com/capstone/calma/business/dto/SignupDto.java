package com.capstone.calma.business.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SignupDto(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email String email,
        @NotBlank String password,
        @Pattern(
                regexp = "[A-D]{5}",
                message = "Field can only contain a 5-character string with the letters ABCD."
        ) String assessmentAnswers
) {
}

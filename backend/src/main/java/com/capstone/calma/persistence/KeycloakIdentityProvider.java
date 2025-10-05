package com.capstone.calma.persistence;

import com.capstone.calma.business.dto.SignupDto;
import com.capstone.calma.business.service.auth.IdentityProvider;
import com.capstone.calma.config.KeycloakConfig;
import kong.unirest.core.HttpResponse;
import kong.unirest.core.JsonNode;
import kong.unirest.core.Unirest;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class KeycloakIdentityProvider implements IdentityProvider {
    private final KeycloakConfig keycloakConfig;

    public KeycloakIdentityProvider(KeycloakConfig keycloakConfig) {
        this.keycloakConfig = keycloakConfig;
    }

    private String getAdminToken() {
        HttpResponse<JsonNode> response = Unirest.post(keycloakConfig.getTokenEndpoint())
                .header("Content-Type", "application/x-www-form-urlencoded")
                .field("client_id", keycloakConfig.getClientId())
                .field("grant_type", "password")
                .field("username", keycloakConfig.getAdminUsername())
                .field("password", keycloakConfig.getAdminPassword())
                .asJson();

        if (response.getStatus() != 200) {
            throw new RuntimeException(response.getStatus() + response.getStatusText() + response.getBody().toString());
        }
        return response.getBody().getObject().getString("access_token");
    }

    @Override
    public String registerUser(SignupDto signupDto) {
        Map<String, Object> user = Map.of(
                "username", signupDto.email(),
                "firstName", signupDto.firstName(),
                "lastName", signupDto.lastName(),
                "email", signupDto.email(),
                "emailVerified", true,
                "credentials", new Object[]{
                        Map.of(
                                "type", "password",
                                "value", signupDto.password(),
                                "temporary", false
                        )
                },
                "enabled", true
        );

        HttpResponse<String> response = Unirest.post(keycloakConfig.getUsersEndpoint())
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + getAdminToken())
                .body(user)
                .asString();

        if (response.getStatus() != 201) {
            throw new RuntimeException(response.getStatus() + response.getStatusText() + response.getBody());
        }

        return getUserIdByEmail(signupDto.email());
    }

    @Override
    public boolean userExists(String email) {
        return getUserIdByEmail(email).isEmpty();
    }

    public String getUserIdByEmail(String email) {
        HttpResponse<JsonNode> response = Unirest.get(keycloakConfig.getUsersEndpoint())
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + getAdminToken())
                .queryString("email", email)
                .asJson();

        if (response.getStatus() != 200) {
            throw new RuntimeException(response.getStatus() + response.getStatusText() + response.getBody().toString());
        }

        if (response.getBody().getArray().isEmpty()) {
            throw new RuntimeException("User not found");
        }

        return response.getBody().getArray().getJSONObject(0).getString("id");
    }
}


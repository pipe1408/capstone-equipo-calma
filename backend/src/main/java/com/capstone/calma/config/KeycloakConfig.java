package com.capstone.calma.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class KeycloakConfig {
    @Value("${keycloak.base-url}")
    private String baseUrl;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin.client-id}")
    private String clientId;

    public String getTokenEndpoint() {
        return String.format("%s/realms/%s/protocol/openid-connect/token", baseUrl, realm);
    }

    public String getUsersEndpoint() {
        return String.format("%s/admin/realms/%s/users", baseUrl, realm);
    }
}
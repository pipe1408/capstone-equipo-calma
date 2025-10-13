package com.capstone.calma.business.service;

import com.capstone.calma.persistence.entity.UserAssessmentEntity;
import com.capstone.calma.persistence.repository.UserAssessmentJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserAssessmentService Unit Tests")
class UserAssessmentServiceTest {

    @Mock
    private UserAssessmentJpaRepository userAssessmentJpaRepository;

    private UserAssessmentService userAssessmentService;

    @BeforeEach
    void setUp() {
        // Given: Set up the service with mocked repository
        userAssessmentService = new UserAssessmentService(userAssessmentJpaRepository);
    }

    @Test
    @DisplayName("Given a UserAssessmentService, When instantiated, Then repository should be accessible")
    void givenUserAssessmentService_whenInstantiated_thenRepositoryShouldBeAccessible() {
        // Given: A UserAssessmentService with repository
        
        // When: Accessing the repository
        UserAssessmentJpaRepository repository = userAssessmentService.userAssessmentJpaRepository;
        
        // Then: Repository should be available
        assertThat(repository).isNotNull();
        assertThat(repository).isEqualTo(userAssessmentJpaRepository);
    }

    @Test
    @DisplayName("Given valid assessment data, When savePersonalityAssestment is called, Then should save and return message")
    void givenValidAssessmentData_whenSavePersonalityAssestment_thenShouldSaveAndReturnMessage() {
        // Given: Valid assessment data
        String assessmentAnswers = "ABCDA";
        String userId = "user-123";
        UserAssessmentEntity savedEntity = new UserAssessmentEntity(
                userId,
                java.time.Instant.now(),
                assessmentAnswers,
                "AAAA"
        );
        when(userAssessmentJpaRepository.save(any(UserAssessmentEntity.class))).thenReturn(savedEntity);
        // Call the real method for savePersonalityAssestment instead of trying to mock it
        when(userAssessmentJpaRepository.savePersonalityAssestment(anyString(), anyString())).thenCallRealMethod();

        // When: Calling savePersonalityAssestment through the repository
        String result = userAssessmentService.userAssessmentJpaRepository.savePersonalityAssestment(assessmentAnswers, userId);

        // Then: Should return expected message and save was called
        assertThat(result).isEqualTo("Personality analysis not yet implemented");
        verify(userAssessmentJpaRepository, times(1)).save(any(UserAssessmentEntity.class));
    }
}

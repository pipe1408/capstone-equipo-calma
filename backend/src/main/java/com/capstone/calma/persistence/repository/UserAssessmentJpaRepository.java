package com.capstone.calma.persistence.repository;

import com.capstone.calma.persistence.entity.UserAssessmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public interface UserAssessmentJpaRepository extends JpaRepository<UserAssessmentEntity, Long> {
    default String savePersonalityAssestment(String personalityTestAnswers, String userId) {
        // TODO: Introduce LLM to determine personality type based on answers
        String personalityType = "AAAA";
        UserAssessmentEntity assestment = new UserAssessmentEntity(
                userId,
                LocalDateTime.now().toInstant(ZoneOffset.UTC),
                personalityTestAnswers,
                personalityType
        );
        save(assestment);
        return "Personality analysis not yet implemented";
    }
}

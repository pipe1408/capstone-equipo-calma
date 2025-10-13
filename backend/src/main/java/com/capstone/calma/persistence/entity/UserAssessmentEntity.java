package com.capstone.calma.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "user_assessments")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserAssessmentEntity {

    @Id
    @Size(max = 255)
    @Column(name = "user_id", nullable = false)
    private String userId;

    @NotNull
    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;

    @Size(max = 5)
    @NotNull
    @Column(name = "personality_test_answers", nullable = false, length = 5)
    private String personalityTestAnswers;

    @Size(max = 4)
    @NotNull
    @Column(name = "personality_type", nullable = false, length = 4)
    private String personalityType;

}

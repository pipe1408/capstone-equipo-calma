package com.capstone.calma.business.service;

import com.capstone.calma.persistence.repository.UserAssessmentJpaRepository;
import org.springframework.stereotype.Service;

@Service
public class UserAssessmentService {
    public final UserAssessmentJpaRepository userAssessmentJpaRepository;

    public UserAssessmentService(UserAssessmentJpaRepository userAssessmentJpaRepository) {
        this.userAssessmentJpaRepository = userAssessmentJpaRepository;
    }
}

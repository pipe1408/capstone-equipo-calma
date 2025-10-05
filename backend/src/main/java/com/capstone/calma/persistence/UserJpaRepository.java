package com.capstone.calma.persistence;

import com.capstone.calma.business.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserJpaRepository extends JpaRepository<User, Long> {
}

package com.capstone.calma.business.service;

import com.capstone.calma.business.entity.User;
import com.capstone.calma.persistence.UserJpaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserJpaRepository userRepository;

    public UserService(UserJpaRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User findUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

        public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(Long id, User updatedUser) {
        User savedUser = userRepository.findById(id).orElseThrow();
        savedUser.setFirstName(updatedUser.getFirstName());
        savedUser.setLastName(updatedUser.getLastName());
        savedUser.setEmail(updatedUser.getEmail());
        return userRepository.save(savedUser);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}

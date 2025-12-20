package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByEmailAndOtpAndUsedFalse(String email, String otp);
    
    List<PasswordResetToken> findByEmail(String email);
}

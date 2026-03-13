package com.safeline.safeline.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class OtpService {

    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private static final long EXPIRE_MINUTES = 5;

    public String generateOtp(String username) {
        String otp = String.format("%06d", new Random().nextInt(1000000));
        otpStorage.put(username, otp);
        
        // In a real app, this would send an email/SMS.
        // For MVP, we log it so we can "receive" it.
        log.info("OTP for user {}: {}", username, otp);
        System.out.println(">>> [DEBUG] OTP for " + username + ": " + otp + " <<<");
        
        return otp;
    }

    public boolean verifyOtp(String username, String otp) {
        String storedOtp = otpStorage.get(username);
        if (storedOtp != null && storedOtp.equals(otp)) {
            otpStorage.remove(username);
            return true;
        }
        return false;
    }
}

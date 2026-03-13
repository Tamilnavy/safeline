package com.safeline.safeline.config;

import com.safeline.safeline.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        // PUBLIC APIs
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/complaints/submit").permitAll()
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/complaints/activities/**",
                                "/api/complaints/public/**",
                                "/api/complaints/track",
                                "/api/complaints/categories",
                                "/api/communication/send-reporter",
                                "/api/communication/messages-reporter",
                                "/api/debug/**",
                                "/error"
                        ).permitAll()

                        // ADMIN APIs
                        .requestMatchers("/api/tenants/**").hasAuthority("SUPER_ADMIN")
                        .requestMatchers("/api/admin/**", "/api/complaints/all").hasAnyAuthority(
                                "SUPER_ADMIN",
                                "ORG_ADMIN",
                                "INTAKE_OFFICER",
                                "INVESTIGATOR",
                                "HR_MANAGER",
                                "COMPLIANCE_OFFICER",
                                "EXECUTIVE"
                        )

                        // INVESTIGATOR / CASE MANAGEMENT
                        .requestMatchers(
                                "/api/investigator/**",
                                "/api/complaints/assigned",
                                "/api/complaints/*/status",
                                "/api/complaints/*/assign",
                                "/api/complaints/*/triage"
                        ).hasAnyAuthority(
                                "SUPER_ADMIN",
                                "ORG_ADMIN",
                                "INTAKE_OFFICER",
                                "INVESTIGATOR",
                                "HR_MANAGER",
                                "COMPLIANCE_OFFICER"
                        )

                        // EXECUTIVE / ANALYTICS (Read-Only)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/complaints/metrics")
                        .hasAnyAuthority("SUPER_ADMIN", "ORG_ADMIN", "EXECUTIVE", "HR_MANAGER", "COMPLIANCE_OFFICER", "INVESTIGATOR")

                        // COMMUNICATION + EVIDENCE
                        .requestMatchers("/api/communication/**", "/api/evidence/**")
                        .hasAnyAuthority(
                                "SUPER_ADMIN",
                                "ORG_ADMIN",
                                "INTAKE_OFFICER",
                                "INVESTIGATOR",
                                "HR_MANAGER",
                                "COMPLIANCE_OFFICER"
                        )

                        // ANY OTHER API
                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Authentication manager
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {

        return config.getAuthenticationManager();
    }

    // CORS Configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // Allow all localhost origins including subdomains (http://shaltech.localhost:5173, etc.)
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://*.localhost:*",
                "http://127.0.0.1:*"
        ));

        configuration.setAllowedMethods(Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Tenant-Id",
                "Origin",
                "Accept",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    // Password encoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
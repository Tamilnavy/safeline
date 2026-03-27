package com.safeline.safeline.service;

import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class SafelineUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public SafelineUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Long tenantId = com.safeline.safeline.security.TenantContext.getCurrentTenant();
        System.out.println("DEBUG: loadUserByUsername - Username: " + username + ", TenantContext: " + tenantId);
        
        User user;
        if (tenantId != null) {
            user = userRepository.findByUsernameAndTenantId(username, tenantId)
                    .orElseGet(() -> userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username)));
        } else {
            user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        }

        if (user.getTenant() != null) {
            System.out.println("DEBUG: Authenticated user '" + user.getUsername() + "' belongs to Tenant ID: " + user.getTenant().getId());
        } else {
            System.out.println("DEBUG: Authenticated user '" + user.getUsername() + "' is GLOBAL");
        }

        return new com.safeline.safeline.security.TenantAwareUserDetails(
                user.getUsername(),
                user.getPassword(),
                user.isEnabled(),
                true, true, true,
                java.util.Collections.singleton(new SimpleGrantedAuthority(user.getRole())),
                user.getTenant() != null ? user.getTenant().getId() : null
        );
    }
}

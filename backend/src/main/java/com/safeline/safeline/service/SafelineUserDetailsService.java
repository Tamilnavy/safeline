package com.safeline.safeline.service;

import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;



@Service
public class SafelineUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public SafelineUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Long tenantId = com.safeline.safeline.security.TenantContext.getCurrentTenant();
        System.out.println("DEBUG: loadUserByUsername - Username: " + username + ", TenantContext: " + tenantId);
        
        User user;
        if (tenantId != null) {
            user = userRepository.findByUsernameIgnoreCaseAndTenantId(username, tenantId)
                    .orElseGet(() -> {
                        java.util.List<User> users = userRepository.findByUsernameIgnoreCase(username);
                        if (users.isEmpty()) throw new UsernameNotFoundException("User not found in this domain: " + username);
                        return users.stream().filter(u -> u.getTenant() == null).findFirst().orElseThrow(() -> 
                            new UsernameNotFoundException("User not found in this domain, and is not a global administrator: " + username)
                        );
                    });
        } else {
            java.util.List<User> users = userRepository.findByUsernameIgnoreCase(username);
            if (users.isEmpty()) throw new UsernameNotFoundException("User not found: " + username);
            user = users.stream().filter(u -> u.getTenant() == null).findFirst().orElseThrow(() -> 
                new UsernameNotFoundException("No domain context provided and user is not a global administrator: " + username)
            );
        }

        if (user.getTenant() != null) {
            System.out.println("DEBUG: Authenticated user '" + user.getUsername() + "' belongs to Tenant ID: " + user.getTenant().getId());
        } else {
            System.out.println("DEBUG: Authenticated user '" + user.getUsername() + "' is GLOBAL");
        }

        if (user.getTenant() != null && !user.getTenant().isActive() && !"SUPER_ADMIN".equals(user.getRole())) {
            System.err.println("DEBUG: Blocked login attempt for user '" + user.getUsername() + "' from deactivated organization.");
            throw new org.springframework.security.authentication.DisabledException("Organization is deactivated");
        }

        if (!user.isEnabled()) {
            System.err.println("DEBUG: Blocked login attempt for deactivated user: " + user.getUsername());
            throw new org.springframework.security.authentication.DisabledException("User account is deactivated");
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

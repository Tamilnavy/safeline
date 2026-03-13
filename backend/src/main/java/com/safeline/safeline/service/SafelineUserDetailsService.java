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
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new com.safeline.safeline.security.TenantAwareUserDetails(
                user.getUsername(),
                user.getPassword(),
                user.isEnabled(),
                true, true, true,
                user.getRoles().stream()
                        .flatMap(role -> {
                            java.util.Set<org.springframework.security.core.GrantedAuthority> authorities = new java.util.HashSet<>();
                            authorities.add(new SimpleGrantedAuthority(role.getName()));
                            if (role.getPermissions() != null) {
                                role.getPermissions().forEach(p -> 
                                    authorities.add(new SimpleGrantedAuthority("PERMISSION_" + p.getName()))
                                );
                            }
                            return authorities.stream();
                        })
                        .collect(Collectors.toSet()),
                user.getTenant() != null ? user.getTenant().getId() : null
        );
    }
}

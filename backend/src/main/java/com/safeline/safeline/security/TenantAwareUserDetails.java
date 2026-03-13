package com.safeline.safeline.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

public class TenantAwareUserDetails extends User {

    private final Long tenantId;

    public TenantAwareUserDetails(String username, String password, boolean enabled,
                                  boolean accountNonExpired, boolean credentialsNonExpired,
                                  boolean accountNonLocked, Collection<? extends GrantedAuthority> authorities,
                                  Long tenantId) {
        super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities);
        this.tenantId = tenantId;
    }

    public Long getTenantId() {
        return tenantId;
    }
}

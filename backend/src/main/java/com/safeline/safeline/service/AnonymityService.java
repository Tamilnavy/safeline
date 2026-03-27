package com.safeline.safeline.service;

import com.safeline.safeline.model.AnonymousMapping;
import com.safeline.safeline.model.Tenant;
import com.safeline.safeline.model.User;
import com.safeline.safeline.repository.AnonymousMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnonymityService {

    private final AnonymousMappingRepository mappingRepository;

    @Transactional
    public String getOrCreateAnonymousId(User user, Tenant tenant) {
        return mappingRepository.findByUser_IdAndTenant_Id(user.getId(), tenant.getId())
                .map(AnonymousMapping::getAnonymousId)
                .orElseGet(() -> {
                    String newId = "ANON-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    AnonymousMapping mapping = new AnonymousMapping();
                    mapping.setUser(user);
                    mapping.setAnonymousId(newId);
                    mapping.setTenant(tenant);
                    mappingRepository.save(mapping);
                    return newId;
                });
    }

    public User getRealUser(String anonymousId) {
        return mappingRepository.findByAnonymousId(anonymousId)
                .map(AnonymousMapping::getUser)
                .orElse(null);
    }
}

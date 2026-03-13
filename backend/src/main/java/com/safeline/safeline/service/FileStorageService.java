package com.safeline.safeline.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final Path root = Paths.get("uploads");
    private final EncryptionService encryptionService;

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            if (!Files.exists(root)) {
                Files.createDirectory(root);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize folder for upload!");
        }
    }

    public String save(MultipartFile file) {
        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            byte[] bytes = file.getBytes();
            byte[] encryptedBytes = encryptionService.encrypt(bytes);
            
            Files.write(this.root.resolve(fileName), encryptedBytes);
            return fileName;
        } catch (Exception e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    public byte[] loadAsBytes(String filename) {
        try {
            Path path = root.resolve(filename);
            byte[] encryptedBytes = Files.readAllBytes(path);
            return encryptionService.decrypt(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Could not read or decrypt the file!");
        }
    }

    public Path load(String filename) {
        return root.resolve(filename);
    }
}

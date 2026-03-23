package com.safeline.safeline;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class SafelineApplication {

	public static void main(String[] args) {
		SpringApplication.run(SafelineApplication.class, args);
	}

	@Bean
	public CommandLineRunner cleanupDatabase(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				System.out.println("DATABASE REPAIR: Starting deep hierarchy cleanup...");
				
				// 1. Drop the old global constraint if it exists
				jdbcTemplate.execute("ALTER TABLE hierarchy_levels DROP CONSTRAINT IF EXISTS uk_ci6suuroxht5b7mjnrd383en0");
				
				// 2. FORCE MIGRATE users from legacy IDs to new standard IDs
				jdbcTemplate.execute("UPDATE users SET hierarchy_level = 'LEVEL_1' WHERE hierarchy_level = 'EL_1'");
				jdbcTemplate.execute("UPDATE users SET hierarchy_level = 'LEVEL_2' WHERE hierarchy_level = 'EL_2'");
				jdbcTemplate.execute("UPDATE users SET hierarchy_level = 'LEVEL_3' WHERE hierarchy_level = 'EL_3'");
				
				// 3. PURGE obsolete 'Recovered' or 'EL_' levels from the levels table
				jdbcTemplate.execute("DELETE FROM hierarchy_levels WHERE technical_id LIKE 'EL_%' OR name LIKE 'Recovered%'");
				
				// 4. ENFORCE SORT ORDER: Force Admin (0), HR (1), Employee (2) to the top
				jdbcTemplate.execute("UPDATE hierarchy_levels SET order_index = 0 WHERE technical_id = 'LEVEL_1'");
				jdbcTemplate.execute("UPDATE hierarchy_levels SET order_index = 1 WHERE technical_id = 'LEVEL_2'");
				jdbcTemplate.execute("UPDATE hierarchy_levels SET order_index = 2 WHERE technical_id = 'LEVEL_3'");
				
				// Make sure custom roles like Investigator are at least at index 3
				jdbcTemplate.execute("UPDATE hierarchy_levels SET order_index = order_index + 3 WHERE technical_id NOT IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3') AND order_index < 3");

				System.out.println("DATABASE REPAIR: Cleanup and Sorting finished successfully.");
			} catch (Exception e) {
				System.out.println("DATABASE REPAIR: Cleanup partially skipped or already done: " + e.getMessage());
			}
		};
	}
}

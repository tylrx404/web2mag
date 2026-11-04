-- Web2Mag MySQL Database Schema
-- Version 1.0.0

CREATE DATABASE IF NOT EXISTS `web2mag` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `web2mag`;

-- 1. Magazine Issues Table
CREATE TABLE IF NOT EXISTS `magazine_issues` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL DEFAULT 'Web2Mag Magazine',
  `volume_number` VARCHAR(50) DEFAULT '1',
  `issue_number` VARCHAR(50) DEFAULT '1',
  `publication_date` VARCHAR(100) DEFAULT '',
  `logo_path` TEXT,
  `accent_color` VARCHAR(20) DEFAULT '#4f46e5',
  `header_text` VARCHAR(255) DEFAULT '',
  `footer_text` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Articles Table
CREATE TABLE IF NOT EXISTS `articles` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `author` VARCHAR(255) DEFAULT 'Editorial Staff',
  `source_url` TEXT,
  `publication_date` VARCHAR(100) DEFAULT '',
  `extracted_content` JSON,
  `edited_content` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_articles_title` (`title`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Issue Articles Mapping Table
CREATE TABLE IF NOT EXISTS `issue_articles` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `issue_id` VARCHAR(64) NOT NULL,
  `article_id` VARCHAR(64) NOT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_issue_article` (`issue_id`, `article_id`),
  INDEX `idx_issue_order` (`issue_id`, `display_order`),
  CONSTRAINT `fk_issue_articles_issue` FOREIGN KEY (`issue_id`) REFERENCES `magazine_issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_issue_articles_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Page Layouts Table
CREATE TABLE IF NOT EXISTS `page_layouts` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `issue_id` VARCHAR(64) NOT NULL,
  `article_id` VARCHAR(64) NOT NULL,
  `page_number` INT NOT NULL,
  `layout_data` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_issue_article_page` (`issue_id`, `article_id`, `page_number`),
  INDEX `idx_page_lookup` (`issue_id`, `article_id`, `page_number`),
  CONSTRAINT `fk_page_layouts_issue` FOREIGN KEY (`issue_id`) REFERENCES `magazine_issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_page_layouts_article` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

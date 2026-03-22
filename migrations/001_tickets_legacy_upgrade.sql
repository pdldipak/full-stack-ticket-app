-- =============================================================================
-- Tickets table upgrade (legacy installs missing columns; fresh DBs no-op).
--
-- If your DB was created from schema.sql / docker/mysql/init.sql, every column
-- already exists: this script skips all ALTERs and only runs the idempotent
-- backfill UPDATEs (safe to repeat).
--
--   docker compose exec -i db mysql -u root -p'YOUR_ROOT_PASSWORD' event_tickets < migrations/001_tickets_legacy_upgrade.sql
--
-- Use -i (not -T) so stdin reaches mysql. Quote the password in single quotes if it
-- contains ! or @.
-- =============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS apply_tickets_legacy_upgrade$$

CREATE PROCEDURE apply_tickets_legacy_upgrade()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'city') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN city VARCHAR(64) NOT NULL DEFAULT 'Stockholm' AFTER sold_by;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'paid') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN paid TINYINT(1) NOT NULL DEFAULT 0 AFTER checked_in;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'paid_to') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN paid_to ENUM('seller', 'nrna_ncc') NULL DEFAULT NULL AFTER paid;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'phone') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN phone VARCHAR(32) NULL DEFAULT NULL AFTER full_name;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'phone_contact_consent') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN phone_contact_consent TINYINT(1) NOT NULL DEFAULT 0 AFTER phone;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'submission_source') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN submission_source ENUM('seller', 'public') NOT NULL DEFAULT 'seller' AFTER paid_to;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'verified_at') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN verified_at DATETIME NULL DEFAULT NULL AFTER submission_source;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'verified_by') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN verified_by VARCHAR(100) NULL DEFAULT NULL AFTER verified_at;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'count_adults') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN count_adults INT UNSIGNED NOT NULL DEFAULT 0 AFTER ticket_count;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'count_student') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN count_student INT UNSIGNED NOT NULL DEFAULT 0 AFTER count_adults;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'count_child') = 0 THEN
    ALTER TABLE tickets
      ADD COLUMN count_child INT UNSIGNED NOT NULL DEFAULT 0 AFTER count_student;
  END IF;
END$$

DELIMITER ;

CALL apply_tickets_legacy_upgrade();

DROP PROCEDURE IF EXISTS apply_tickets_legacy_upgrade;

-- Backfill verification for seller-portal rows (idempotent: only when still NULL).
UPDATE tickets
SET verified_at = created_at, verified_by = sold_by
WHERE submission_source = 'seller' AND verified_at IS NULL;

-- Backfill attendance breakdown from legacy total (idempotent for already-filled rows).
UPDATE tickets
SET count_adults = ticket_count, count_student = 0, count_child = 0
WHERE count_adults = 0 AND count_student = 0 AND count_child = 0 AND ticket_count > 0;

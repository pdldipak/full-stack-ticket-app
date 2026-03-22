.PHONY: migrate

migrate:
	sed 's/\r$$//' migrations/001_tickets_legacy_upgrade.sql | docker compose exec -T db sh -c 'mysql -u root -p"$$MYSQL_ROOT_PASSWORD" "$$MYSQL_DATABASE"'

package db

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/taskapp/backend/internal/config"
)

func RunMigrations(cfg config.DatabaseConfig) error {
	migrationsPath := migrationsDir()

	m, err := migrate.New("file://"+migrationsPath, cfg.MigrateDSN())
	if err != nil {
		return fmt.Errorf("init migrate: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("run migrations: %w", err)
	}

	return nil
}

// migrationsDir resolves the migrations folder relative to the binary location,
// falling back to a path relative to the working directory.
func migrationsDir() string {
	// when running from /app (Docker), migrations are at /app/migrations
	exe, err := os.Executable()
	if err == nil {
		candidate := filepath.Join(filepath.Dir(exe), "migrations")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	// local dev fallback
	return "migrations"
}

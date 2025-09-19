package config

import (
	"os"
	"strings"
)

type Config struct {
	Port        string
	DBDSN       string
	RedisAddr   string
	AdminToken  string
	CORSOrigins []string
}

func Load() Config {
	return Config{
		Port:       getenv("PORT", "8080"),
		DBDSN:      getenv("DB_DSN", "shop:shop@tcp(127.0.0.1:3306)/shop?parseTime=true&charset=utf8mb4"),
		RedisAddr:  getenv("REDIS_ADDR", "127.0.0.1:6379"),
		AdminToken: getenv("ADMIN_TOKEN", "change-me"),
		CORSOrigins: func() []string {
			v := getenv("CORS_ORIGINS", "http://localhost:5173")
			return strings.Split(v, ",")
		}(),
	}
}

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" { return v }
	return d
}

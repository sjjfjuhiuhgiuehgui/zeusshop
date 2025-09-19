package cache

import (
	"context"
	"log"
	"time"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

type Redis struct { *redis.Client }

func MustOpen(addr string) *Redis {
	rdb := redis.NewClient(&redis.Options{ Addr: addr })
	if err := rdb.Ping(ctx).Err(); err != nil { log.Fatalf("redis ping: %v", err) }
	return &Redis{rdb}
}

// Simple rate limit: allow n actions per window
func (r *Redis) Allow(key string, limit int, window time.Duration) bool {
	pipe := r.TxPipeline()
	incr := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, window)
	_, _ = pipe.Exec(ctx)
	return int(incr.Val()) <= limit
}

package middleware

import (
	"log"
	"time"

	"team/common/web"
)

// Logger is a middleware function to record request information.
func Logger(next web.Handler) web.Handler {
	return func(c *web.Context) {
		start := time.Now()
		next(c)

		log.Printf(
			"%5s %10s %03d %s\n",
			c.Method(),
			time.Now().Sub(start).String(),
			c.Status(),
			c.URL().Path)
	}
}

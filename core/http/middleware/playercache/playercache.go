// Package playercache keeps generated player pages and their dependencies fresh.
package playercache

import (
	"path"
	"strings"

	"github.com/labstack/echo/v4"
)

func IsPlayerResource(p string) bool {
	p = path.Clean("/" + strings.TrimPrefix(p, "/"))
	if strings.HasPrefix(p, "/api/") {
		return false
	}
	return strings.HasSuffix(p, ".html") || strings.HasPrefix(p, "/channels/") ||
		strings.HasPrefix(p, "/player/") || strings.HasPrefix(p, "/ui/_player/")
}

func New() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if IsPlayerResource(c.Request().URL.Path) {
				c.Request().Header.Del("If-Modified-Since")
				c.Request().Header.Del("If-None-Match")
				c.Response().Before(func() {
					h := c.Response().Header()
					h.Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
					h.Set("Pragma", "no-cache")
					h.Set("Expires", "0")
					h.Del("ETag")
				})
			}
			return next(c)
		}
	}
}

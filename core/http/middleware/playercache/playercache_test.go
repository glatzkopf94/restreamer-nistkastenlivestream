package playercache

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"
)

func TestFreshPlayerResources(t *testing.T) {
	for _, url := range []string{"/camera.html", "/channels/camera/config.js?nkl=dev19", "/player/videojs/dist/video.min.js", "/player/videojs/dist/video-js-skin.min.css"} {
		for _, method := range []string{http.MethodGet, http.MethodHead} {
			e := echo.New()
			e.Use(New())
			e.Add(method, "/*", func(c echo.Context) error {
				require.Empty(t, c.Request().Header.Get("If-Modified-Since"))
				require.Empty(t, c.Request().Header.Get("If-None-Match"))
				c.Response().Header().Set("Cache-Control", "max-age=3600")
				return c.String(200, "current player")
			})
			req := httptest.NewRequest(method, url, nil)
			req.Header.Set("If-Modified-Since", "Wed, 23 Sep 2026 12:00:00 GMT")
			req.Header.Set("If-None-Match", "old")
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			require.Equal(t, 200, rec.Code)
			require.Contains(t, rec.Header().Get("Cache-Control"), "no-store")
			require.Equal(t, "no-cache", rec.Header().Get("Pragma"))
		}
	}
	for _, p := range []string{"/api/v3/process", "/camera/segment.ts", "/static/js/main.hash.js"} {
		require.False(t, IsPlayerResource(p))
	}
}

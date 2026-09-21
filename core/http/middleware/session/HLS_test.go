package session

import (
	"net/url"
	"strings"
	"testing"
)

func TestRewriteHLSPreservesViewerID(t *testing.T) {
	rewriter := sessionRewriter{}
	rewriter.buffer.WriteString("#EXTM3U\nsegment.ts\n")
	requestURL, err := url.Parse("https://stream.example.test/channel.m3u8?viewer=viewer-browser-0001")
	if err != nil {
		t.Fatal(err)
	}

	rewriter.rewriteHLS("session-id", requestURL)
	result := rewriter.buffer.String()
	if !strings.Contains(result, "viewer=viewer-browser-0001") {
		t.Fatalf("viewer ID missing from rewritten playlist: %s", result)
	}
}

func TestRewriteHLSDropsInvalidViewerID(t *testing.T) {
	rewriter := sessionRewriter{}
	rewriter.buffer.WriteString("#EXTM3U\nsegment.ts\n")
	requestURL, err := url.Parse("https://stream.example.test/channel.m3u8?viewer=../../invalid")
	if err != nil {
		t.Fatal(err)
	}

	rewriter.rewriteHLS("session-id", requestURL)
	result := rewriter.buffer.String()
	if strings.Contains(result, "viewer=") {
		t.Fatalf("invalid viewer ID propagated to playlist: %s", result)
	}
}

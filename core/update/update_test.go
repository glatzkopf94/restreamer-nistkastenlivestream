package update

import (
	"testing"

	"golang.org/x/mod/semver"
)

func TestNormalizeNKLDevelopmentVersion(t *testing.T) {
	tests := map[string]string{
		"0.3.0-dev9":   "v0.3.0-dev.9",
		"v0.3.0-dev10": "v0.3.0-dev.10",
		"1.2.3":        "v1.2.3",
	}

	for input, expected := range tests {
		if actual := normalizeVersion(input); actual != expected {
			t.Fatalf("normalizeVersion(%q) = %q, want %q", input, actual, expected)
		}
	}
}

func TestDevelopmentVersionsUseNumericOrder(t *testing.T) {
	if semver.Compare(normalizeVersion("0.3.0-dev10"), normalizeVersion("0.3.0-dev9")) != 1 {
		t.Fatal("dev10 must be newer than dev9")
	}
	if semver.Compare(normalizeVersion("0.3.0-dev13"), normalizeVersion("0.3.0-dev12")) != 1 {
		t.Fatal("dev13 must be newer than dev12")
	}
}

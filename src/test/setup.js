// Wave 4.4-C2b — vitest setup file.
// Enables jest-dom matchers (toBeInTheDocument, toHaveAttribute, etc.)
// for any test that opts into the jsdom environment via the per-file
// directive: `// @vitest-environment jsdom`.
//
// Per-file environment is the intentional pattern. The global vitest
// environment stays node (fast; 488+ existing tests need no DOM).
// Component tests that need rendering opt in individually.

import "@testing-library/jest-dom/vitest";


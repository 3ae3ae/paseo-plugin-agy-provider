# Contributing

Use English for issues, pull requests, documentation, and code comments so the Paseo community can review them.

Keep this plugin a thin `runAcpProvider()` registration. Prefer fixes in the official server or Paseo SDK when they own the behavior. Do not add a proxy, credential store, automatic installer, or speculative compatibility layer. Discuss changes to this boundary in an issue first.

Run `npm ci`, `npm run typecheck`, and `npm test`. Keep the development SDK at 0.8.0 for backward compatibility; CI also checks the stable 0.9.0 SDK on macOS, Linux, and Windows. Keep `requirements.paseo` at `>=0.8.0` and avoid 0.9-only manifest fields or APIs. For changes affecting runtime behavior, also test the real official server in a disposable workspace and state the OS, architecture, Paseo version, server version, and what you verified. Never label mocked checks as end-to-end verification.

Include the problem, resulting behavior, and validation in your PR. Preserve the distinction between unsupported features and tested features. Update the README and verification notes when compatibility changes. Contributions are provided under this repository's MIT license.

Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

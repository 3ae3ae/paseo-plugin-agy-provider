# Security

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/3ae3ae/paseo-plugin-agy-provider/security/advisories/new). Include affected versions, impact, and a minimal reproduction without credentials or private workspace content. Do not open a public issue for an unpatched vulnerability.

The latest plugin release is maintained. Google owns security updates for the separately installed official server; report server vulnerabilities through Google's appropriate security channel. Paseo owns its plugin runtime and ACP shim.

Plugin server code runs with the daemon user's permissions. This plugin does not sandbox the official server, store credentials, disable permission prompts, or patch model entitlements. Do not treat unsupported Paseo system prompts as a security boundary.

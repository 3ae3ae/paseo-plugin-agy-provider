# Verification

Verified on 2026-09-11 with Paseo **0.8.0**, `@getpaseo/plugin` **0.8.0**, and Google's unmodified official ACP server **agy_acp_server_1.1.1** on **macOS ARM64**. The server and its companion executable were downloaded from the official ACP Registry's Google distribution URL. Tests used a separate demonstration workspace.

## Real-server checks

| Scenario | Result |
| --- | --- |
| Fresh ACP authentication state | `session/new` returned `Authentication required`; ordinary CLI installation/login did not select an ACP auth method. |
| Personal Google OAuth | ACP `authenticate` succeeded; the separate `node scripts/login.ts` command also completed successfully. |
| Directory plugin installation | Plugin loaded as `agy-provider`; `agy` was registered as Antigravity. |
| Model and mode discovery | Paseo displayed 11 account-provided models and Default, Auto Edit, and YOLO modes. Counts and availability are account-dependent. |
| Real prompt | Response completed in Paseo and appeared in its standard timeline. |
| Permission approval | Approving a file creation produced `hello.txt` with the requested content. |
| Permission denial | Denying a second creation left `denied.txt` absent; the agent reported the denial. |
| Session restoration | After `paseo agent reload`, the agent recalled both the successful and denied file operations without reading files. |
| Cancellation | `paseo stop` interrupted an active counting response. |
| Reload during a turn | Plugin reload closed the active agent session. |
| Remove during a turn | Plugin removal closed the active session; no ACP server or companion harness processes remained after removal. The plugin was then reinstalled. |
| Desktop and compact UI | Provider icon, model picker, controls, and basic conversation inspected at desktop and compact window widths. Screenshots are actual Paseo captures. This is not an iOS/Android device test. |
| Missing executable | Shim connection rejected with `ENOENT`; setup helper exited with an explanatory error. |
| Missing companion executable | Reproduced `Internal error`; making the companion available resolved session creation. |

## System prompt limitation

The shim passes `ProviderSessionConfig.systemPrompt` through `_meta._paseo.systemPrompt` when creating or restoring a session. Official server 1.1.1 does not consume that metadata.

A live check placed a unique marker only in this metadata and asked the agent to return the supplied marker, or `NONE` if absent. It returned `NONE`. This agrees with the server's session-creation implementation ignoring the additional metadata. Accordingly, this plugin makes **no claim to support Paseo system prompts or workflows depending on them** and does not replace them with user-message text.

## Automated checks

`npm run typecheck` passes. `npm test` runs one Node built-in test covering the platform command mapping, literal paths containing spaces, the Linux argument with an override, and unsupported OS rejection. No test framework or runtime dependencies are installed by the plugin.

The installed manifest ID, Paseo version requirement, package version, and absence of runtime dependencies were also checked before publication. Real-server tests are manual integration checks, not mocked CI results.

## Unverified or limited

Linux and Windows real-agent sessions, enterprise/API-key authentication, image/audio prompts, external MCP interoperability, and physical mobile devices are not verified. In-place steering and structured output are not implemented by this plugin. Token-usage reporting is not guaranteed.

The unmodified shim/server combination displayed duplicate file-operation rows and split streamed text, including a file link. Successful writes were checked on disk rather than inferred from those rows.

# Verification

Verified on 2026-09-11 with Paseo **0.8.0**, `@getpaseo/plugin` **0.8.0**, and Google's unmodified official ACP server **agy_acp_server_1.1.1** on **macOS ARM64**. The server and its companion executable were downloaded from the official ACP Registry's Google distribution URL. Tests used a separate demonstration workspace.

## Paseo 0.9 compatibility review

Reviewed again on 2026-09-22 against the stable `v0.9.0` compatibility checker, manifest parser, update CLI, and published SDK. The manifest now allows `>=0.8.0`, removing the previous `^0.8.0 || ^0.9.0` upper bound. Provider registration and the workspace-terminal login use APIs available in both versions; no runtime implementation changes were needed.

- Type checking and all three Node tests passed with SDK 0.8.0 and with the published 0.9.0 plugin, client, and protocol packages in an isolated temporary copy.
- The automated manifest test uses Paseo's actual compatibility checker for both app and daemon. It accepts 0.8.0, 0.8.1, 0.9.0-beta.1, 0.9.0, 0.10.0, and 1.0.0, and rejects 0.7.2. Paseo also checks the stable core of prerelease versions. Acceptance by the version requirement does not establish runtime compatibility with future releases.
- The development SDK remains at 0.8.0. The manifest omits the 0.9-only `description` field because 0.8 rejects unknown manifest fields.
- There is no macOS-only plugin restriction. Command tests cover macOS, Linux (`--uid=`), and Windows, including executable overrides containing spaces. CI now checks SDKs 0.8.0 and 0.9.0 on all three operating systems; the local checks reported here ran on macOS, not Linux or Windows.
- [Paseo #4701](https://github.com/getpaseo/paseo/pull/4701), first included in 0.9.0-beta.1 and retained in 0.9.0, fixes streamed ACP chunks without `messageId` splitting into separate messages. The fix is supplied by the daemon runtime, not this plugin. Upstream live verification used Codex ACP; Antigravity on 0.9 remains unverified.

The local Paseo installation was not updated or restarted. These are source, type, and automated checks, not 0.9 end-to-end verification. Login, model discovery, prompts, permissions, restoration, and cancellation still need real-agent checks on 0.9. Existing system-prompt and duplicate-tool-row limitations remain.

## Real-server checks (Paseo 0.8.0)

| Scenario | Result |
| --- | --- |
| Fresh ACP authentication state | `session/new` returned `Authentication required`; ordinary CLI installation/login did not select an ACP auth method. |
| Personal Google OAuth | ACP `authenticate` succeeded; the separate `node scripts/login.ts` command also completed successfully. |
| Directory plugin installation | Plugin loaded as `agy-provider`; `agy` was registered as Antigravity. |
| Public Git installation | Removed the directory registration, installed `3ae3ae/paseo-plugin-agy-provider`, confirmed the Git source and commit, and completed another real prompt. |
| Model and mode discovery | Paseo displayed 11 account-provided models and Default, Auto Edit, and YOLO modes. Counts and availability are account-dependent. |
| Real prompt | Response completed in Paseo and appeared in its standard timeline. |
| Permission approval | Approving a file creation produced `hello.txt` with the requested content. |
| Permission denial | Denying a second creation left `denied.txt` absent; the agent reported the denial. |
| Session restoration | After `paseo agent reload`, the agent recalled both the successful and denied file operations without reading files. |
| Cancellation | `paseo stop` interrupted an active counting response. |
| Reload during a turn | Plugin reload closed the active agent session. |
| Remove during a turn | Plugin removal closed the active session; no ACP server or companion harness processes remained after removal. The plugin was then reinstalled. |
| Desktop and compact UI | Provider icon, model picker, controls, and basic conversation inspected at 1224px and 548px window widths. Screenshots are actual Paseo captures. This is not an iOS/Android device test. |
| Missing executable | Shim connection rejected with `ENOENT`; setup helper exited with an explanatory error. |
| Missing companion executable | Reproduced `Internal error`; making the companion available resolved session creation. |

## System prompt limitation

The shim passes `ProviderSessionConfig.systemPrompt` through `_meta._paseo.systemPrompt` when creating or restoring a session. Official server 1.1.1 does not consume that metadata.

A live check placed a unique marker only in this metadata and asked the agent to return the supplied marker, or `NONE` if absent. It returned `NONE`. This agrees with the server's session-creation implementation ignoring the additional metadata. Accordingly, this plugin makes **no claim to support Paseo system prompts or workflows depending on them** and does not replace them with user-message text.

## Automated checks

`npm run typecheck` passes. `npm test` runs three small Node built-in tests: manifest version compatibility, platform command selection, and login action routing. They cover literal paths containing spaces, Linux arguments with an override, unsupported OS rejection, use of the daemon's installed plugin directory and selected workspace, and preventing login from a disabled plugin. No test framework or runtime dependencies are installed by the plugin.

The installed manifest ID, Paseo version requirement, package version, and absence of runtime dependencies were also checked before publication. Real-server tests are manual integration checks, not mocked CI results.

## Unverified or limited

Linux and Windows real-agent sessions, enterprise/API-key authentication, image/audio prompts, external MCP interoperability, and physical mobile devices are not verified. In-place steering and structured output are not implemented by this plugin. Token-usage reporting is not guaranteed.

The unmodified 0.8.0 shim/server combination displayed duplicate file-operation rows and split streamed text, including a file link. Successful writes were checked on disk rather than inferred from those rows. The 0.9 upstream streaming fix is described above; duplicate rows have not been confirmed fixed.

## v0.1.1 login action

The Command Center displays **Antigravity: Log in with Google** in an open workspace. Selecting it was exercised in Paseo Desktop and created a normal **Antigravity login** terminal in the installed plugin directory. The terminal ran the existing setup helper and reported authentication success with the previously authorized Google account; no extra clone or dependency installation was performed. The shell stays open so its completion message and errors can be read.

The complete first-time OAuth browser flow was verified during v0.1.0 setup; the new menu was tested using the existing authorization. API-key inference remains unverified with a live key. The published README now also describes the official server's `auth.type` configuration route rather than treating the helper as the only option.

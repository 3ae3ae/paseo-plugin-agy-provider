# agy-provider

A small [Paseo 0.8](https://paseo.sh/docs/plugins/v0.8/providers) provider plugin for Google's official **Antigravity ACP server** (`agy_acp_server`). Select **Antigravity** in Paseo to use it.

The plugin registers `runAcpProvider()` and selects the official executable for your operating system. Paseo owns ACP transport, sessions, permissions, and timeline rendering. There are no plugin runtime dependencies, build steps, automatic downloads, or custom protocol proxies.

This is a community integration, not an official Google or Paseo product.
The monochrome SVG is a simplified drawing inspired by Antigravity's curved A mark and follows Paseo's theme colors.

![Antigravity model picker and a real response in Paseo](images/demo.gif)

Short walkthrough assembled from two captured Paseo interface states: the model picker and a completed conversation. The host UI is localized in Korean; the demo conversation and this documentation are in English. [Model picker](images/models.jpg) · [Conversation](images/conversation.jpg)

> **Paseo system prompts are not supported by the official ACP server 1.1.1.** Paseo sends them as `_meta._paseo.systemPrompt`, which the server ignores. This includes instructions Paseo supplies for its own workflows. Do not rely on those instructions being applied. The plugin does not silently prepend them to user messages.

## Installation

### 1. Install the official ACP server on the daemon host

Download the archive for your platform from the [official ACP Registry entry](https://github.com/agentclientprotocol/registry/blob/main/antigravity-acp/agent.json). Extract the **entire archive** into a permanent directory, preserving the companion `localharness_external` executable. The ordinary `agy` CLI is a separate product and is not the ACP server.

| Daemon platform | Official executable | Arguments added by this plugin |
| --- | --- | --- |
| macOS ARM64 | `agy_acp_server.par` | None |
| Linux x64 / ARM64 | `agy_acp_server.par` | `--uid=` |
| Windows x64 / ARM64 | `agy_acp_server.exe` | None |

There is no macOS Intel archive in the verified 1.1.1 registry entry. macOS ARM64 is the platform tested with the real agent; Linux and Windows command selection is tested without claiming real-agent verification.

Add the extraction directory to the **Paseo daemon's PATH**, or set `PASEO_AGY_ACP_BIN` to the executable's absolute path before starting the daemon. For example, in a POSIX shell:

```sh
export PASEO_AGY_ACP_BIN="$HOME/.local/share/antigravity-acp/agy_acp_server.par"
```

In PowerShell:

```powershell
$env:PASEO_AGY_ACP_BIN = "$HOME\antigravity-acp\agy_acp_server.exe"
```

Use the actual directory where you extracted the archive. The override is one executable path, not a shell command; paths containing spaces are supported. Keep the companion binary beside it. If using symlinks on PATH, both executables must be reachable; linking only the `.par` can produce `Internal error` when opening a session.

An already running daemon does not inherit exports from a new terminal. Configure the environment in whatever launches your daemon and restart it there. Plugin reload re-reads the daemon's existing environment. Per-agent `--env` is too late to select the executable or authenticate global model discovery. On a remote daemon, install and authenticate on that remote machine.

### 2. Authenticate the official server

Paseo 0.8's ACP shim does not initiate `authenticate`. Logging into the ordinary `agy` CLI alone is insufficient. Authenticate the ACP server once, under the same OS user and environment as the daemon, using an ACP client that supports Google's login flow or this dependency-free setup helper:

```sh
git clone https://github.com/3ae3ae/paseo-plugin-agy-provider.git
cd paseo-plugin-agy-provider
node scripts/login.ts
```

The helper requires Node.js 22.18+ and **does not require `npm install`**. It sends ACP `initialize` and `authenticate` to the official server, prints Google's sign-in link when supplied, and exits. Google handles OAuth and credential storage; the helper does not read, copy, or save credentials. Its default method is `oauth-personal`.

Other server-advertised methods can be passed as an argument, for example `node scripts/login.ts oauth-business`. Configure their prerequisites using Google's official documentation; only personal Google OAuth has been verified here. Run login on the daemon host. For remote OAuth, use a client with an appropriate remote login flow; this helper does not relay callbacks.

The official server keeps its settings under `$GEMINI_HOME/antigravity-acp` (default `~/.gemini/antigravity-acp`). Login and the daemon must use the same `GEMINI_HOME` if you override it. The server records the selected auth method. A bare `GEMINI_API_KEY` does not select API-key authentication in server 1.1.1.

### 3. Install the plugin

```sh
paseo plugin add 3ae3ae/paseo-plugin-agy-provider
paseo provider models agy
```

Choose **Antigravity** in Paseo's model picker, or start an agent from your workspace:

```sh
paseo run --provider agy "Explain this project's entry point."
```

The plugin ID is `agy-provider`; the provider ID used by the CLI is `agy`. Model names and modes come from the official server and your account, not a fixed list in this repository.

## Updates and removal

```sh
paseo plugin update agy-provider
paseo plugin reload agy-provider
paseo plugin remove agy-provider
```

Update the official server separately using its registry distribution. Removing this plugin does not uninstall the server or remove Google's credentials or saved conversations. To pin a plugin release, install with `--ref v0.1.0`.

## Limitations

- **Paseo system prompts are ignored by official ACP server 1.1.1.** Workflows requiring Paseo's injected instructions are not supported. MCP transport support alone does not establish those workflows work.
- **Authentication is a setup step.** If credentials expire or you sign out, authenticate again and reload the plugin. No login screen or credential manager is added to Paseo.
- **Capabilities are bounded by both the server and Paseo 0.8's shim.** In-place steering, structured output guarantees, and provider-specific extras are not added by this plugin. Use Paseo's stop/retry behavior where appropriate.
- **Models and access depend on Google.** Availability, quotas, and failures are controlled by the official server and your account. No entitlement or model compatibility patches are applied.
- **Real-agent validation is on macOS ARM64 only.** Other listed architectures have official distributions, but have not been verified end to end here.
- **Timeline presentation follows Paseo's shim.** In the verified versions, file operations can display duplicate rows and streamed text can be split across paragraphs, including inside links. No custom renderer is added here.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Executable not found / `ENOENT` | The daemon's PATH or `PASEO_AGY_ACP_BIN`, not only your interactive shell's environment. |
| `Internal error` while opening a session | Preserve `localharness_external` beside the server; extract the full archive. |
| `Authentication required` | Run the ACP login helper under the daemon user and matching `GEMINI_HOME`, then reload. |
| No models | Check server authentication, account access, and `paseo provider diagnostic agy`. |
| Instructions appear ineffective | Paseo system prompts are unsupported; see Limitations. |

Use `paseo plugin logs agy-provider` for plugin startup problems. Remove credentials, OAuth links, and private workspace content before sharing logs.

## Development

```sh
npm ci
npm run typecheck
npm test
paseo plugin install /absolute/path/to/paseo-plugin-agy-provider
```

Development uses the exact Paseo SDK version 0.8.0. The small Node built-in test checks command selection and literal paths; it does not pretend to validate a live agent. See [verification notes](VERIFICATION.md) for real-server results. See [CONTRIBUTING.md](CONTRIBUTING.md) for contributions and [SECURITY.md](SECURITY.md) for private security reports.

## License

This repository's code is [MIT licensed](LICENSE). Google's proprietary ACP server is downloaded separately and remains subject to [Google's applicable terms](https://antigravity.google/terms). No Google binaries or credentials are included.

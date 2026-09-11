# agy-provider

A small [Paseo 0.8](https://paseo.sh/docs/plugins/v0.8/providers) provider plugin for Google's official **Antigravity ACP server** (`agy_acp_server`). Select **Antigravity** in Paseo to use it.

The plugin registers `runAcpProvider()` and selects the official executable for your operating system. Paseo owns ACP transport, sessions, permissions, and timeline rendering. There are no plugin runtime dependencies, build steps, automatic downloads, or custom protocol proxies.

This is a community integration, not an official Google or Paseo product.
The monochrome SVG is a simplified drawing inspired by Antigravity's curved A mark and follows Paseo's theme colors.

![Antigravity model picker and a real response in Paseo](images/demo.gif)

Short walkthrough assembled from two captured Paseo interface states: the model picker and a completed conversation. The host UI is localized in Korean; the demo conversation and this documentation are in English. [Model picker](images/models.jpg) · [Conversation](images/conversation.jpg) · [Compact layout](images/compact.jpg)

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

### 2. Install the plugin

```sh
paseo plugin add 3ae3ae/paseo-plugin-agy-provider
```

Already installed? Run `paseo plugin update agy-provider` to get the login action introduced in v0.1.1. A release-pinned installation must be removed and re-added with the newer `--ref`.

### 3. Log in from Paseo

1. Open any workspace in Paseo 0.8.
2. Open the **Command Center** (`Cmd+K` on macOS) and select **Antigravity: Log in with Google**.
3. Complete Google's browser sign-in if prompted. Progress and the completion message appear in the workspace terminal named **Antigravity login**. If models were previously unavailable, reload `agy-provider` in Settings → Plugins after login.

**No separate Git clone or `npm install` is needed.** The menu finds the already installed plugin and runs its bundled setup helper in Paseo's existing terminal. Node.js 22.18+ must be available in that terminal. The provider itself remains a thin `runAcpProvider()` registration; it does not manage credentials or run a background login service.

Paseo 0.8's ACP shim does not initiate `authenticate`, and ordinary `agy` CLI login alone does not select an ACP auth method. The helper sends ACP `initialize` and `authenticate` with `oauth-personal`; Google's server handles OAuth and storage. If the browser does not open, use the sign-in URL printed in the terminal. On a remote daemon the login runs on that host; completing a remote callback requires an appropriate remote login setup, which this helper does not implement.

Other authentication options are supported by the official server. An ACP client such as [Zed](https://antigravity.google/docs/ide/extensions/zed) can perform authentication, and the server also accepts `auth.type` in its settings. When that selects OAuth, server 1.1.1 can initiate sign-in during session creation. This settings-only route is not verified through Paseo's shim, so the menu uses the explicitly tested `authenticate` flow.

For enterprise setup, run `node scripts/login.ts oauth-business` from the installed plugin directory after configuring Google's prerequisites. Find that directory with `paseo plugin ls agy-provider --json`; a second checkout is unnecessary. Only personal Google OAuth has been verified here.

The official server keeps settings under `$GEMINI_HOME/antigravity-acp` (default `~/.gemini/antigravity-acp`). The terminal and daemon must use the same `GEMINI_HOME` and executable configuration. A bare `GEMINI_API_KEY` does not select API-key authentication in server 1.1.1.

#### Gemini API key (no browser)

The official server also supports API-key authentication. Configure `GEMINI_API_KEY` securely in the environment that starts the Paseo daemon, then merge this selection into `~/.gemini/antigravity-acp/settings.json` (or the matching file under your `GEMINI_HOME`), preserving other settings:

```json
{
  "auth": { "type": "gemini-api-key" }
}
```

Restart the daemon from the configured environment if it was already running. This settings-based API-key route needs no browser, clone, or login-helper invocation. Alternatively, with `GEMINI_API_KEY` available to the setup terminal, `node scripts/login.ts gemini-api-key` asks the official server to record that selection for you. Never put a real key in this repository, an issue, or an agent conversation. The plugin does not store keys. The API-key path is supported by server 1.1.1 but has not been tested here with a live key; see [Google's authentication options](https://antigravity.google/docs/ide/extensions/zed).

### 4. Use Antigravity

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

Update the official server separately using its registry distribution. Removing this plugin does not uninstall the server or remove Google's credentials or saved conversations. To pin a plugin release, install with `--ref v0.1.1`.

## Limitations

- **Paseo system prompts are ignored by official ACP server 1.1.1.** Workflows requiring Paseo's injected instructions are not supported. MCP transport support alone does not establish those workflows work.
- **Authentication is a setup step.** Use **Antigravity: Log in with Google** again if credentials expire or you sign out. The action needs an open workspace and the default plugin ID `agy-provider`; it reuses Paseo's terminal and Google's login flow.
- **Capabilities are bounded by both the server and Paseo 0.8's shim.** In-place steering, structured output guarantees, and provider-specific extras are not added by this plugin. Use Paseo's stop/retry behavior where appropriate.
- **Models and access depend on Google.** Availability, quotas, and failures are controlled by the official server and your account. No entitlement or model compatibility patches are applied.
- **Real-agent validation is on macOS ARM64 only.** Other listed architectures have official distributions, but have not been verified end to end here.
- **Timeline presentation follows Paseo's shim.** In the verified versions, file operations can display duplicate rows and streamed text can be split across paragraphs, including inside links. No custom renderer is added here.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Executable not found / `ENOENT` | The daemon's PATH or `PASEO_AGY_ACP_BIN`, not only your interactive shell's environment. |
| `Internal error` while opening a session | Preserve `localharness_external` beside the server; extract the full archive. |
| `Authentication required` | Use **Antigravity: Log in with Google** in the workspace's Command Center, then reload the plugin if needed. |
| Login action is missing | Update the plugin to v0.1.1+, use Paseo 0.8 on the client, and open a workspace. |
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

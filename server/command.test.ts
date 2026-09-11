import assert from "node:assert/strict";
import { test } from "node:test";
import { agyCommand } from "./command.ts";
import contribute from "../index.client.ts";
import type { PluginClientContext, PluginWorkspaceCommandContext } from "@getpaseo/plugin/client";

test("official platform commands and literal executable overrides", () => {
  assert.deepEqual(agyCommand("darwin", ""), ["agy_acp_server.par"]);
  assert.deepEqual(agyCommand("linux", ""), ["agy_acp_server.par", "--uid="]);
  assert.deepEqual(agyCommand("win32", ""), ["agy_acp_server.exe"]);
  const executable = "/Applications/Antigravity ACP/agy_acp_server.par";
  assert.deepEqual(agyCommand("darwin", executable), [executable]);
  assert.deepEqual(agyCommand("linux", executable), [executable, "--uid="]);
  assert.throws(() => agyCommand("freebsd", ""), /does not support freebsd/);
});

test("login uses the daemon's current install path and selected workspace", async () => {
  let onSelect: (context: PluginWorkspaceCommandContext) => void | Promise<void>;
  contribute({
    addCommandCenterItem(item) {
      assert.equal(item.context, "workspace");
      onSelect = item.onSelect as typeof onSelect;
      return () => {};
    },
  } as PluginClientContext);
  const plugin = { path: "/daemon/Plugin Checkout", enabled: true };
  const launches: unknown[] = [];
  const keys: unknown[] = [];
  const context = {
    workspace: { id: "selected-workspace" },
    paseo: {
      config: { get: async () => ({ config: { plugins: { "agy-provider": plugin } } }) },
      terminals: { create: async (options: unknown) => {
        launches.push(options);
        return { sendKeys: (input: unknown) => keys.push(input) };
      } },
    },
  } as unknown as PluginWorkspaceCommandContext;
  await onSelect!(context);
  assert.deepEqual(launches, [{ workspaceId: "selected-workspace", cwd: plugin.path, name: "Antigravity login" }]);
  assert.deepEqual(keys, [["node scripts/login.ts", "Enter"]]);
  plugin.enabled = false;
  await assert.rejects(async () => onSelect!(context), /Enable agy-provider/);
  assert.equal(launches.length, 1);
});

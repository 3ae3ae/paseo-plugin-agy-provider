import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assertPluginCompatibility } from "@getpaseo/protocol/plugin-requirements";
import { agyCommand } from "./command.ts";
import contribute from "../index.client.ts";
import contributeServer from "../index.server.ts";
import type { PluginClientContext, PluginWorkspaceCommandContext } from "@getpaseo/plugin/client";
import type { PluginServerContext } from "@getpaseo/plugin/server";

test("manifest accepts Paseo 0.8 and later for both runtimes", () => {
  const manifest = JSON.parse(readFileSync(new URL("../paseo-plugin.json", import.meta.url), "utf8"));
  for (const runtime of ["app", "daemon"] as const) {
    for (const version of ["0.8.0", "0.8.1", "0.9.0-beta.1", "0.9.0", "0.10.0", "1.0.0"]) {
      assert.doesNotThrow(() => assertPluginCompatibility({ ...manifest, runtime, version }));
    }
    assert.throws(() => assertPluginCompatibility({ ...manifest, runtime, version: "0.7.2" }), /requires Paseo/);
  }
});

test("official platform commands and literal executable overrides", () => {
  assert.deepEqual(agyCommand("darwin", ""), ["agy_acp_server.par"]);
  assert.deepEqual(agyCommand("linux", ""), ["agy_acp_server.par", "--uid="]);
  assert.deepEqual(agyCommand("win32", ""), ["agy_acp_server.exe"]);
  const executable = "/Applications/Antigravity ACP/agy_acp_server.par";
  assert.deepEqual(agyCommand("darwin", executable), [executable]);
  assert.deepEqual(agyCommand("linux", executable), [executable, "--uid="]);
  const windowsExecutable = "C:\\Program Files\\Antigravity ACP\\agy_acp_server.exe";
  assert.deepEqual(agyCommand("win32", windowsExecutable), [windowsExecutable]);
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

test("sanitizes failed tool call timeline events with null error", async () => {
  let registeredProvider: any;
  let interceptedListener: ((event: any) => void) | undefined;

  const mockConnection = {
    version: 1,
    capabilities: [],
    send: async () => {},
    close: async () => {},
    onEvent(listener: (event: any) => void) {
      interceptedListener = listener;
      return () => {};
    },
  };

  const mockProvider = {
    id: "agy",
    label: "Antigravity",
    connect: async () => mockConnection,
  };

  contributeServer(
    {
      registerProvider(provider: any) {
        registeredProvider = provider;
      },
    } as unknown as PluginServerContext,
    (() => mockProvider) as any,
  );

  assert.ok(registeredProvider, "Provider should be registered");
  assert.equal(registeredProvider.id, "agy");

  const connection = await registeredProvider.connect({ versions: [1], capabilities: [] });
  const received: any[] = [];
  connection.onEvent((event: any) => received.push(event));

  assert.ok(interceptedListener, "Listener should be attached");

  // 1. Failed tool call with null error and detail.output
  interceptedListener({
    type: "timeline.item",
    sessionId: "session-1",
    item: {
      type: "tool_call",
      callId: "call-1",
      name: "bash",
      status: "failed",
      error: null,
      detail: { output: "Command not found" },
    },
  });
  assert.equal(received.length, 1);
  assert.equal(received[0].item.error, "Command not found");

  // 2. Failed tool call with null error and no detail.output
  interceptedListener({
    type: "timeline.item",
    sessionId: "session-1",
    item: {
      type: "tool_call",
      callId: "call-2",
      name: "read",
      status: "failed",
      error: null,
    },
  });
  assert.equal(received.length, 2);
  assert.equal(received[1].item.error, "Tool call failed");

  // 3. Failed tool call with existing non-null error
  interceptedListener({
    type: "timeline.item",
    sessionId: "session-1",
    item: {
      type: "tool_call",
      callId: "call-3",
      name: "edit",
      status: "failed",
      error: "Original failure message",
    },
  });
  assert.equal(received.length, 3);
  assert.equal(received[2].item.error, "Original failure message");

  // 4. Completed tool call with error: null (should remain null)
  interceptedListener({
    type: "timeline.item",
    sessionId: "session-1",
    item: {
      type: "tool_call",
      callId: "call-4",
      name: "bash",
      status: "completed",
      error: null,
    },
  });
  assert.equal(received.length, 4);
  assert.equal(received[3].item.error, null);

  // 5. Non-tool_call timeline item
  interceptedListener({
    type: "timeline.item",
    sessionId: "session-1",
    item: {
      type: "user_message",
      text: "hello",
    },
  });
  assert.equal(received.length, 5);
  assert.equal(received[4].item.type, "user_message");

  // 6. Non-timeline event
  interceptedListener({
    type: "session.turn",
    sessionId: "session-1",
    turnId: "turn-1",
    state: "completed",
  });
  assert.equal(received.length, 6);
  assert.equal(received[5].type, "session.turn");
});

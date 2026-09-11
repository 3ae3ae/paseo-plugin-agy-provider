import assert from "node:assert/strict";
import { test } from "node:test";
import { agyCommand } from "./command.ts";

test("official platform commands and literal executable overrides", () => {
  assert.deepEqual(agyCommand("darwin", ""), ["agy_acp_server.par"]);
  assert.deepEqual(agyCommand("linux", ""), ["agy_acp_server.par", "--uid="]);
  assert.deepEqual(agyCommand("win32", ""), ["agy_acp_server.exe"]);
  const executable = "/Applications/Antigravity ACP/agy_acp_server.par";
  assert.deepEqual(agyCommand("darwin", executable), [executable]);
  assert.deepEqual(agyCommand("linux", executable), [executable, "--uid="]);
  assert.throws(() => agyCommand("freebsd", ""), /does not support freebsd/);
});

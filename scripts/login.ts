import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import os from "node:os";
import { agyCommand } from "../server/command.ts";

// Setup only: Paseo's workspace terminal runs this, not the provider connection.
const [executable, ...args] = agyCommand();
const child = spawn(executable, args, {
  env: { ...process.env, PYTHONUNBUFFERED: "1" },
  stdio: ["pipe", "pipe", "pipe"],
});
const lines = createInterface({ input: child.stdout });
const errLines = createInterface({ input: child.stderr });
errLines.on("line", (line) => {
  console.log(line);
  if (!(process.env.SSH_CONNECTION || process.env.SSH_CLIENT)) return;
  if (!line.startsWith("Open the following link to authenticate")) return;
  const match = line.match(/redirect_uri=http%3A%2F%2F127\.0\.0\.1%3A(\d+)%2F/);
  if (!match) return;
  const port = match[1];
  const user = process.env.USER;
  const target = `${user ? `${user}@` : ""}${os.hostname()}`;
  console.log(
    `\nRemote SSH session detected. The OAuth callback targets 127.0.0.1:${port} on the browser's machine. Run this in a new terminal on your laptop to bridge it back here, then open the link above in your laptop browser:\n  ssh -L ${port}:127.0.0.1:${port} ${target}`,
  );
});
let nextId = 0;

function request(method: string, params: object): Promise<void> {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      lines.off("line", onLine);
      child.off("error", onError);
      child.off("exit", onExit);
      error ? reject(error) : resolve();
    };
    const onError = (error: Error) => finish(error);
    const onExit = () => finish(new Error("The official ACP server exited before login completed."));
    const onLine = (line: string) => {
      let message;
      try { message = JSON.parse(line); } catch {
        if (line.startsWith("Open the following link to authenticate")) console.log(line);
        return;
      }
      if (message?.id !== id) return;
      finish(message.error ? new Error(message.error.message) : undefined);
    };
    const timer = setTimeout(() => finish(new Error(`${method} timed out. Run the login command again.`)), 300_000);
    lines.on("line", onLine);
    child.once("error", onError);
    child.once("exit", onExit);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n", (error) => {
      if (error) finish(error);
    });
  });
}

const stop = () => child.kill();
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  await request("initialize", { protocolVersion: 1, clientCapabilities: {} });
  console.log("Complete Google's sign-in in your browser if prompted.");
  await request("authenticate", { methodId: process.argv[2] ?? "oauth-personal" });
  console.log("Antigravity ACP authentication completed. Reload agy-provider in Paseo.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  lines.close();
  errLines.close();
  child.kill();
}

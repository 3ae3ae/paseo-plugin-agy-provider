import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { agyCommand } from "../server/command.ts";

// Setup only: the provider never runs this script or handles credentials.
const [executable, ...args] = agyCommand();
const child = spawn(executable, args, {
  env: { ...process.env, PYTHONUNBUFFERED: "1" },
  stdio: ["pipe", "pipe", "ignore"],
});
const lines = createInterface({ input: child.stdout });
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
  child.kill();
}

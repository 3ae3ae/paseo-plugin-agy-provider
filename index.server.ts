import type { PluginServerContext } from "@getpaseo/plugin/server";
import { runAcpProvider } from "@getpaseo/plugin/server/acp";
import { agyCommand } from "./server/command.js";

export default function contribute(server: PluginServerContext) {
  server.registerProvider(
    runAcpProvider({
      id: "agy",
      label: "Antigravity",
      description: "Google's Antigravity coding agent through its official ACP server",
      icon: "icon.svg",
      command: agyCommand(),
    }),
  );
  return () => {};
}

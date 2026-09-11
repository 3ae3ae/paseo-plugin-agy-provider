import type { PluginClientContext } from "@getpaseo/plugin/client";

export default function contribute(client: PluginClientContext) {
  return client.addCommandCenterItem({
    id: "login",
    title: "Antigravity: Log in with Google",
    icon: "LogIn",
    keywords: ["agy", "login", "sign in", "authenticate"],
    context: "workspace",
    async onSelect({ paseo, workspace }) {
      const { config } = await paseo.config.get();
      const plugin = config.plugins?.["agy-provider"];
      if (!plugin || plugin.enabled === false) {
        throw new Error("Enable agy-provider in Settings → Plugins first.");
      }
      const terminal = await paseo.terminals.create({
        workspaceId: workspace.id,
        cwd: plugin.path,
        name: "Antigravity login",
      });
      terminal.sendKeys(["node scripts/login.ts", "Enter"]);
    },
  });
}

import type { PluginServerContext } from "@getpaseo/plugin/server";
import { runAcpProvider } from "@getpaseo/plugin/server/acp";
import { agyCommand } from "./server/command.ts";

export default function contribute(
  server: PluginServerContext,
  createProvider: typeof runAcpProvider = runAcpProvider,
) {
  const provider = createProvider({
    id: "agy",
    label: "Antigravity",
    description: "Google's Antigravity coding agent through its official ACP server",
    icon: "icon.svg",
    command: agyCommand(),
  });

  server.registerProvider({
    ...provider,
    async connect(request) {
      const connection = await provider.connect(request);
      return {
        ...connection,
        onEvent(listener) {
          return connection.onEvent((event: any) => {
            if (
              event.type === "timeline.item" &&
              event.item?.type === "tool_call" &&
              event.item?.status === "failed" &&
              event.item?.error == null
            ) {
              event = {
                ...event,
                item: {
                  ...event.item,
                  error: event.item.detail?.output ?? "Tool call failed",
                },
              };
            }
            listener(event);
          });
        },
      };
    },
  });

  return () => {};
}

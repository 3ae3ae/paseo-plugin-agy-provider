export function agyCommand(
  platform: NodeJS.Platform = process.platform,
  override = process.env.PASEO_AGY_ACP_BIN,
): readonly [string, ...string[]] {
  if (platform !== "darwin" && platform !== "linux" && platform !== "win32") {
    throw new Error(`Google's official Antigravity ACP server does not support ${platform}`);
  }

  const executable = override?.trim()
    ? override
    : platform === "win32" ? "agy_acp_server.exe" : "agy_acp_server.par";
  return platform === "linux" ? [executable, "--uid="] : [executable];
}

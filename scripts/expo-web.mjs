import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath
  ? process.execPath
  : process.platform === "win32" && process.env.APPDATA
    ? path.join(process.env.APPDATA, "npm", "npm.cmd")
    : "npm";
const npmBaseArgs = npmExecPath ? [npmExecPath] : [];
const useShell = !npmExecPath && process.platform === "win32";
const port = process.env.EXPO_WEB_PORT || "8081";

const child = spawn(npmCommand, [...npmBaseArgs, "run", "web", "--", "--port", port, "--max-workers", "1"], {
  cwd: path.join(rootDir, "frontend-expo"),
  env: {
    ...process.env,
    BROWSER: process.env.BROWSER || "none",
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1",
    __UNSAFE_EXPO_HOME_DIRECTORY:
      process.env.__UNSAFE_EXPO_HOME_DIRECTORY || path.join(rootDir, ".expo-home"),
  },
  shell: useShell,
  stdio: "inherit",
  windowsHide: true,
});

child.on("error", (error) => {
  console.error(`Failed to start Expo web: ${error.message}`);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code || 0);
});

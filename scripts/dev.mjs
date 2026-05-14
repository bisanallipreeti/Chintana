import { spawn } from "node:child_process";
import net from "node:net";
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

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.setTimeout(500);
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

function startService(serviceName, cwd, args, extraEnv = {}) {
  const relativeCwd = path.relative(rootDir, cwd) || ".";
  console.log(`[${serviceName}] starting in ${relativeCwd}`);

  const child = spawn(npmCommand, [...npmBaseArgs, ...args], {
    cwd,
    env: { ...process.env, ...extraEnv },
    shell: useShell,
    stdio: "inherit",
    windowsHide: true,
  });

  child.on("error", (error) => {
    console.error(`[${serviceName}] Failed to start: ${error.message}`);
  });

  return child;
}

async function main() {
  const children = [];

  console.log("Starting Chintana locally...");

  if (await isPortOpen(5000)) {
    console.log("[backend] http://localhost:5000 is already in use; using the running backend.");
  } else {
    children.push(startService("backend", path.join(rootDir, "backend"), ["run", "dev"]));
  }

  if (await isPortOpen(8081)) {
    console.log("[expo-web] http://localhost:8081 is already in use; using the running frontend.");
  } else {
    children.push(startService("expo-web", rootDir, ["run", "dev:expo"]));
  }

  console.log("Frontend: http://localhost:8081");
  console.log("Backend health: http://localhost:5000/health");

  if (children.length === 0) {
    return;
  }

  let stopping = false;
  const stop = (signal) => {
    stopping = true;
    for (const child of children) {
      if (!child.killed) {
        child.kill(signal);
      }
    }
  };

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  for (const child of children) {
    child.on("exit", (code) => {
      if (!stopping && code && !process.exitCode) {
        process.exitCode = code;
      }
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

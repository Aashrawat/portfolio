#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createConnection } from "node:net";

const API_PORT = 3001;
const HEALTH_URL = `http://127.0.0.1:${API_PORT}/health`;

function waitForPort(port, timeoutMs = 30_000) {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const check = () => {
			const socket = createConnection({ port, host: "127.0.0.1" });
			socket.once("connect", () => {
				socket.end();
				resolve(undefined);
			});
			socket.once("error", () => {
				if (Date.now() - start > timeoutMs) {
					reject(new Error(`Timed out waiting for port ${port}`));
					return;
				}
				setTimeout(check, 500);
			});
		};
		check();
	});
}

async function waitForHealth(timeoutMs = 60_000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const response = await fetch(HEALTH_URL);
			if (response.ok) return;
		} catch {
			// retry
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error("API health check failed");
}

function run(command, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: "inherit", shell: true, ...options });
		child.on("exit", (code) => {
			if (code === 0) resolve(undefined);
			else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
		});
	});
}

const api = spawn("pnpm", ["--filter", "@chirp/api", "start"], {
	stdio: "inherit",
	shell: true,
});

try {
	await waitForPort(API_PORT);
	await waitForHealth();
	await run("pnpm", ["exec", "turbo", "run", "test:e2e"]);
} finally {
	if (process.platform === "win32") {
		spawn("taskkill", ["/pid", String(api.pid), "/f", "/t"], { shell: true });
	} else {
		api.kill("SIGTERM");
	}
}

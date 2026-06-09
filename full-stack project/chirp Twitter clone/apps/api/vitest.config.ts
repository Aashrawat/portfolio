import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
		setupFiles: ["./tests/setup.ts"],
		fileParallelism: false,
		pool: "forks",
		poolOptions: {
			forks: {
				isolate: true,
			},
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/services/**/*.ts", "src/lib/**/*.ts", "src/middleware/**/*.ts"],
			exclude: ["src/**/*.test.ts"],
		},
	},
});

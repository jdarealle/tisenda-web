import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			"^/api/(query|health)(?:\\?.*)?$": {
				target: process.env.API_PROXY_TARGET || "http://127.0.0.1:3000",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		tailwindcss(),
		viteReact(),
	],
});

export default config;

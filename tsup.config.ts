import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/**/*.ts", "src/**/*.tsx"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    clean: true,
    external: ["*.css"],
});

import babel from "rollup-plugin-babel";

export default {
	input: "./src/index.js",
	output: {
		format: "cjs",
		file: "./dist/index.js",
		exports: "named",
	},
	external: ["path"],
	plugins: [
		babel({
			exclude: "node_modules/**",
		}),
	],
};

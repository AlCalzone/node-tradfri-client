// This script helps find unused exports.
// It has some false positives, so be careful what you remove

// run with `npm run find-unused-exports`

import * as fs from "fs";
import * as path from "path";
import analyzeTsConfig from "ts-unused-exports";

const files = ["./src/index.ts", "./src/tradfri-client.ts"];
files.push(...
	fs
		.readdirSync("./src/lib")
		.filter(p => p.endsWith(".ts") && !p.endsWith(".test.ts"))
		.map(f => path.join("./src/lib", f)),
);

const result = analyzeTsConfig("./tsconfig.json", files);
for (const file of Object.keys(result)) {
	if (file === "src") continue;
	const unused = result[file];
	console.warn(`${file}.ts has ${unused.length} unused symbols:`);
	unused.forEach(u => console.warn("  " + u));
}

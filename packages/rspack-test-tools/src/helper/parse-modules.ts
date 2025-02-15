const BOOTSTRAP_SPLIT_LINE =
	"/************************************************************************/";
const MODULE_START_FLAG = "/* start::";
const MODULE_END_FLAG = "/* end::";
const MODULE_FLAG_END = " */";

function getStringBetween(
	raw: string,
	position: number,
	start: string,
	end: string
) {
	const startFlagIndex = raw.indexOf(start, position);
	if (startFlagIndex === -1) {
		return {
			result: null,
			remain: position
		};
	}
	const endFlagIndex = raw.indexOf(end, startFlagIndex + start.length);
	if (endFlagIndex === -1) {
		return {
			result: null,
			remain: position
		};
	}
	return {
		result: raw.slice(startFlagIndex + start.length, endFlagIndex),
		remain: endFlagIndex + end.length
	};
}

export function parseModules(content: string) {
	const modules: Map<string, string> = new Map();
	const runtimeModules: Map<string, string> = new Map();

	let currentPosition = 0;

	// parse bootstrap code
	const bootstrap = getStringBetween(
		content,
		0,
		BOOTSTRAP_SPLIT_LINE,
		BOOTSTRAP_SPLIT_LINE
	);
	if (bootstrap.result) {
		runtimeModules.set("webpack/bootstrap", bootstrap.result);
	}
	// parse module & runtime module code
	let moduleName = getStringBetween(
		content,
		currentPosition,
		MODULE_START_FLAG,
		MODULE_FLAG_END
	).result;
	let totalLength = 0;
	while (moduleName) {
		const moduleContent = getStringBetween(
			content,
			currentPosition,
			`${MODULE_START_FLAG}${moduleName}${MODULE_FLAG_END}`,
			`${MODULE_END_FLAG}${moduleName}${MODULE_FLAG_END}`
		);
		if (!moduleContent.result) {
			throw new Error(`Module code parsed error: ${moduleName}`);
		}
		if (moduleName.startsWith("webpack/runtime")) {
			totalLength += moduleContent.result.length;
			runtimeModules.set(moduleName, moduleContent.result);
		} else {
			totalLength += moduleContent.result.length;
			modules.set(moduleName, moduleContent.result);
		}
		currentPosition = moduleContent.remain;
		moduleName = getStringBetween(
			content,
			currentPosition,
			MODULE_START_FLAG,
			MODULE_FLAG_END
		).result;
	}
	return {
		modules,
		runtimeModules
	};
}

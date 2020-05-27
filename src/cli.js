const path = require("path");

const blessed = require('blessed');

const Application = require("./Application").default;

const _print = (outStream, data) => outStream.write(data);

const _err = (errStream, data) => errStream.write(data);

const globals = {};

const initialize = (process, done) => {
	// process.stdin.on("end", done);

	// const print = data => _print(process.stdout, data);

	// const err = data => _err(process.stderr, data);

	// process.on("uncaughtException", err => {});

	const screen
	= blessed.screen({
		// dump: __dirname +"/layout.log",
		warnings: true,
		// debug: true
	});
	globals.screen = screen;

	const program
	= blessed.program();
	globals.program = program;

	// console.log("globals in init", globals);
	// console.log("globals in init", "screen:", !!globals.screen, "program:", !!globals.program);
	// const screen = globals.screen;
	// const program = globals.program;
	// return done(0);
};

const start = (process, done) => {
	process.stdin.on("end", done);

	const print = data => _print(process.stdout, data);

	const err = data => _err(process.stderr, data);

	// process.on("uncaughtException", err => {
	// 	err("uncaughtException:", err);
	// 	globals.program.emit("quit");
	// });

	// console.log("argv", process.argv);

	globals.program.on("quit", function() {
		globals.screen.destroy();
		print("program quitting.\n"); /* TODO delete before publishing */
		process.stdin.setRawMode(false);
		process.stdin.end();
		done(0);
	});

	/* TODO? "enable quitting on these keys" */
	globals.screen.key('q', function() {
		globals.program.emit("quit");
	});

	const argv = process.argv && process.argv.length && process.argv.slice(2);

	const configFlagIdx = argv.indexOf("-c");
	const configFileName = configFlagIdx >= 0 && argv[configFlagIdx + 1]

	const app = new Application(globals.screen, globals.program);

	try {
		app.loadConfig(configFileName || "in current dir" || path.join(process.env.HOME, ".ratsrc"));
	}
	catch (e) {
		if (e.code === "E_CONFIG_FILE_NOT_FOUND") {
			print(e.message);
			globals.program.emit("quit");
		} else {
			throw e;
		}
	}

	app.initialize();
	app.render();
};

module.exports = {
	initialize,
	start,
	globals,
	getGlobals: () => {
		// console.log("globals in getter", "screen:", !!globals.screen, "program:", !!globals.program);
		return globals;
	}
};

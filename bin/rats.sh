#!/usr/bin/env node

try {
    const Jea = require("../lib/cli");
    Jea.initialize(process, process.exit);
    Jea.start(process, process.exit);
} catch (e) {
    console.error(e);
    process.exit(255);
}

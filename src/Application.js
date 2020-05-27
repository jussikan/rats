const fs = require("fs");
const { omit, orderBy } = require("lodash");

const UI = require("./UI").default;

function Application(screen, program) {
	this.screen = screen;
	this.program = program;
	this.ui = new UI(screen);
	this.config = {
		collection: {}
	};
}

Application.prototype.quit = function quit() {
	// this.screen.destroy();
	this.program.emit("quit");
	// process.exit(0);
};

Application.prototype.loadConfig = function loadConfig(location) {
	// console.log("location", location);
	let data;
	try {
		data = fs.readFileSync(location);
	} catch (e) {
		if (e.code === "ENOENT") {
			const myErr = new Error(`Configuration file "${location}" not found.`);
			myErr.code = "E_CONFIG_FILE_NOT_FOUND";
			throw myErr;
		} else {
			throw e;
		}
	}

	const config = JSON.parse(data);

	this.setEnvironments(config.environments);
	this.setDomains(config.domains);
	this.setCollections(config.collections);
	this.setCalls(config.calls);
};

Application.prototype.initialize = function initialize() {
	this.ui.setData("environments", this.config.environments);
	this.ui.setData("domains", this.config.domains);
	this.ui.setData("collections", this.config.collections);

	this.ui.setCallback("getSelectedEntry", this.getSelectedEntry);
	this.ui.setCallback("setSelectedEntry", this.setSelectedEntry);
	this.ui.setCallback("getEnvironmentTitleById", this.getEnvironmentTitleById);
	this.ui.setCallback("getDomainContents", this.getDomainContents);
	this.ui.setCallback("getCollectionContents", (...argv) => this.getCollectionContents(...argv));
	this.ui.setCallback("getCallInstructions", (...argv) => this.getCallInstructions(...argv));
	this.ui.setCallback("getEnvironmentVariables", (...argv) => this.getEnvironmentVariables(...argv));
	this.ui.setCallback("getCLIArguments", this.getCLIArguments);

	this.ui.initialize();
};

Application.prototype.clickLeButton = function clickLeButton() {
	this.ui.clickLeButton();
};

Application.prototype.setSelectedEntry = function setSelectedEntry(entries, selectedId) {
	const oldOne = entries.find(e => e.selected);

	if (oldOne) {
		oldOne.selected = false;
	}

	const newOne = entries.find(e => e.id === selectedId);
	if (newOne) {
		newOne.selected = true;
	}
};

Application.prototype.getSelectedEntry = function getSelectedEntry(entries) {
	return entries.find(e => e.selected);
};

function printCollectionEntry(ce) {
	console.log("CE", omit(ce, "uiContainer", "elementDefinition.element"));
}

Application.prototype.getCollectionContents = function getCollectionContents(collection, environmentId, collectionId, bindToDomain) {
	if (! collection.data) {
		return undefined;
	}
	
	// console.log("collection", collection);
	// console.log("environmentId", environmentId);

	// const contents = collection.data.reduce((stack, cd) => {
	// 	// console.log("CD", cd);
	// 	// console.log("env match?", cd.originEnvironmentId === environmentId);
	// 	// console.log("typeof bindToDomain", typeof bindToDomain, typeof bindToDomain === "undefined");

	// 	// const t_bindToDomain = typeof bindToDomain === "undefined" ? true : cd.bindToDomain === bindToDomain;
	// 	const t = cd.originEnvironmentId === environmentId
	// 		&& ((typeof bindToDomain === "undefined") ? true : cd.bindToDomain === bindToDomain)
	// 	;
	// 	console.log("t_bindToDomain", t_bindToDomain);
	// 	console.log("T", t);
	// 	console.log("----");
	// 	return t ? stack.concat(cd) : stack;
	// }, []);
	const contents = collection.data.filter(cd => {
		// console.log("CD", cd);
		// console.log("env match?", cd.originEnvironmentId === environmentId);
		// console.log("typeof bindToDomain", typeof bindToDomain, typeof bindToDomain === "undefined");

		// const t_bindToDomain = typeof bindToDomain === "undefined" ? true : cd.bindToDomain === bindToDomain;
		const t = cd.originEnvironmentId === environmentId
			&& ((typeof bindToDomain === "undefined") ? true : cd.bindToDomain === bindToDomain)
		;
		// console.log("t_bindToDomain", t_bindToDomain);
		// console.log("T", t);
		// console.log("----");
		return t;
	});

	// console.log("contents", contents);
	// console.log("--------");
	
	return contents;
};

Application.prototype.getEnvironmentTitleById = function getEnvironmentTitleById(environments, environmentId) {
	const env = environments.find(e => e.id === environmentId);
	return env ? env.title : undefined;
};

Application.prototype.setEnvironments = function setEnvironments(environments) {
	this.config.environments = {
		...omit(environments, "data"),
		data: orderBy(environments.data, ["title"], environments.orderBy)
	};
};

Application.prototype.bindCollectionEntryToDomain = function bindCollectionEntryToDomain(collectionType, collectionEntry) {
	const {
		domainId,
		originEnvironmentId,
	} = collectionEntry;
	// console.log("collectionEntry", collectionEntry);

	console.log("domainId", domain);
	console.log("CONF domains data", this.config.domains.data);

	const domain = this.config.domains.data.find(d => d.id === domainId);
	console.log("domain", domain);
	console.log("originEnvironmentId", originEnvironmentId);

	if (! domain.data) {
		domain.data = {
			environments: {}
		};
	}
	
	if (! domain.data.environments[originEnvironmentId]) {
		domain.data.environments[originEnvironmentId] = [];
	}
	
	domain.data.environments[originEnvironmentId].push(collectionEntry);
};

Application.prototype.setCollections = function setCollections(collections) {
	this.config.collections = collections;
	const _this = this;
	
	this.config.collections.data.forEach(c => {
		if (c.type === "service") {
			/* TODO get sort key(s) from config */
			c.data = orderBy(c.data, ["location"], c.sortBy);
			_this.addCollection(c);
			console.log("this.config", _this.config);
			
			c.data.forEach(ce => {
				if (ce.bindToDomain) {
					_this.bindCollectionEntryToDomain(c.type, ce);
				}
			});
		}
		else if (c.type === "key") {
			/* TODO get sort key(s) from config */
			c.data = orderBy(c.data, "key", c.sortBy);
			_this.addCollection(c);
		}
	});
};

Application.prototype.addCollection = function addCollection(collection) {
	const collectionType = collection.type;
	
	if (! this.config[ collectionType ]) {
		this.config[ collectionType ] = [];
	}
	
	this.config[ collectionType ].push(collection);
};

Application.prototype.setCalls = function setCalls(calls) {
	this.config.calls = calls;
};

Application.prototype.getCallInstructions = function getCallInstructions(collectionId) {
	const { calls } = this.config;
	if (collectionId) {
		return calls.filter(c => c.collectionId === collectionId);
	} else {
		return calls;
	}
};

Application.prototype.getEnvironmentVariables = function getEnvironmentVariables(environmentId, keyMap) {
	const envvars = {};
	
	const keys = Object.keys(keyMap);
	keys.forEach(key => {
		const environment = this.config.environments.data.find(e => e.id === environmentId);
		if (! environment) {
			return;
		}
		
		const value = environment[key];
		
		if (value) {
			envvars[ keyMap[key] ] = value;
		}
	});
	
	return envvars;
};

Application.prototype.getCLIArguments = function getCLIArguments(collectionEntry) {
	// const argv = collectionEntry.cliParams.trim().split(" ").map(key => {
	// 	const value = collectionEntry[key] || ""; // fallback or fail?
	// 	return value;
	// });
	// console.log("collectionEntry", collectionEntry);
	const { cliParamMap } = collectionEntry;
	const argv = Object.keys(cliParamMap).reduce((stack, appKey) => {
		// const cliKey = cliParamMap[appKey];
		// return {
		// 	...stack,
		// 	[cliKey]: collectionEntry[appKey] || ""
		// }
		const rawValue = collectionEntry[appKey];
		// return (value && value.length) ? stack.concat(value) : stack;
		// return stack.concat(JSON.stringify(rawValue));
		let value;
		if (typeof rawValue === "undefined") {
			value = undefined;
		}
		else if (typeof rawValue === "boolean") {
			value = String(rawValue);
		}
		else {
			value = String(rawValue);
		}
		// console.log("rawValue type", typeof rawValue);
		// console.log("VALUE", value);
		return value ? stack.concat(value) : stack;
	}, [])
		.filter(Boolean)
	;
	// console.log("argv:", argv);

	return argv.join(" ");
};

Application.prototype.setDomains = function setDomains(domains) {
	this.config.domains = {
		...omit(domains, "data"),
		data: orderBy(domains.data, ["title"], domains.sortBy)
	};
};

Application.prototype.render = function render() {
	this.ui.render();
};

exports.default = Application;

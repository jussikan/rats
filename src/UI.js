const { isEqual, omit, sortBy } = require("lodash");

const blessed = require("blessed");

const exec = require("child_process").execSync;

const ControlButton = require("./ControlButton").default;
const DomainWidget = require("./DomainWidget").default;
DomainWidget.Button = require("./DomainWidgetButton").default;

const RootLayoutDefinition = {
	// parent: screen,
	top: 0,
	// left: "50%",
	left: 0,
	shrink: false,
	clickable: true,
	width: "100%",
	height: "100%",
	scrollable: true,
};

const DomainSuperContainerDefinition = {
	// parent: rootLayout,
	shrink: true,
	transparent: false,
	// ...position,
	// border: {
	//   type: "line",
	//   fg: "red",
	// },
	width: "100%",
	// content: "foo",
	hidden: true,
};

const HorizontalContainerDefinition = {
	// parent: rootLayout,
	shrink: false,
	transparent: false,
	width: "100%"
};

const collectionButtonLeftMargin = 3; /* delete? */

const KeysContainerDefinition = {
	// parent: rootLayout,
	shrink: true,
	transparent: false,
	// ...rightPosition,
	// border: {
	//     type: "line",
	//     fg: "red",
	// },
	width: "100%",
	// height: 6,
	// content: "foo",
	hidden: true,
};

const KeyButtonDefinition = {
	// style: {
	//   fg: "black",
	//   hover: {
	//     fg: "blue"
	//   }
	// },
	shrink: true,
	height: 1,
	mouse: true,
	clickable: true,
	transparent: false,
};


function UI(screen, program) {
	this.screen = screen;
	this.program = program;

	/* TODO abstract */
	this.layout = blessed.layout({
		...RootLayoutDefinition,
		parent: this.screen
	});
	
	this.data = {};
	this.callback = {};
}

UI.prototype.setData = function setData(name, value) {
	this.data[name] = value;
};

UI.prototype.getData = function getData(name) {
	return this.data[name].data;
};

UI.prototype.setCallback = function(name, fn) {
	this.callback[name] = fn;
};

UI.prototype.initialize = function initialize() {
	const position = {
		top: 0,
		// left: 30,
		left: 0
	};
	/* TODO abstract */
	this.environmentsContainer = blessed.radioset({
		...HorizontalContainerDefinition,
		parent: this.layout,
		keys: false,
	});
	
	this.generateEnvironmentButtons(this.getData("environments"), this.environmentsContainer, position);
	
	// position.left = 30; // hack
	this.addHorizontalLine(this.layout, position);
	
	// position.left = 30; // hack
	position.left = 0;
	/* TODO abstract away */
	this.collectionButtonsContainer = blessed.form({
		...HorizontalContainerDefinition,
		parent: this.layout,
		keys: false,
	});
	this.generateCollectionButtons(this.getData("collections"), this.collectionButtonsContainer, position);

	this.addHorizontalLine(this.layout, position);
	// position.top = 4;
	position.left = 0;
	
	const domainSuperContainerPosition = {...position};

	/* TODO abstract away (must it be a form?) */
	this.domainSuperContainer = blessed.form({
		...DomainSuperContainerDefinition,
		parent: this.layout,
		...domainSuperContainerPosition,
	});
	this.domainSuperContainer.set("role", "domainSuperContainer");
	this.generateDomainContainers(this.getData("domains"), this.domainSuperContainer, domainSuperContainerPosition);
	
	
	const keysContainerPosition = {...position};
	/* TODO abstract away */
	this.keysContainer = blessed.form({
		...KeysContainerDefinition,
		parent: this.layout,
		...keysContainerPosition
	});
	this.keysContainer.set("role", "keysContainer");

	/* TODO move to a function */
	const keysData = this.getData("collections").reduce((stack, collection) => {
		if (collection.type === "key") {
			return stack.concat(collection.data);
		} else {
			return stack;
		}
	}, []);
	
	keysData && this.initializeKeyButtons(keysData, this.keysContainer, keysContainerPosition);
	
	this.applySwitching(this.domainSuperContainer, this.keysContainer);
};

UI.prototype.applySwitching = function applySwitching(...elementDefinitions) {
	elementDefinitions.forEach(ed => {
		ed.on("show", () => {
			const others = elementDefinitions.filter(ed2 => ed2 !== ed);
			others.forEach(o => o.hide());
		});
	});
};

UI.prototype.addHorizontalLine = function addHorizontalLine(container, position, width) {
	const myPosition = {...position};
	
	position.left ++;
	
	const options = {
		parent: container,
		orientation: "horizontal",
		...myPosition,
		width: width || "100%",
	};
	
	return blessed.line(options);
};

UI.prototype.initializeEnvironmentButton = function initializeEnvironmentButton(envData, container, position) {
	const myPosition = {...position};
	const width = envData.title.length + 2 + 4;
	
	envData.elementDefinition = new ControlButton({
		parent: container,
		width,
		...myPosition,
		content: envData.title,
		name: envData.title,
		id: `control-button_${envData.title}`,
	});
	envData.uiContainer = envData.elementDefinition.getElement();
	
	envData.uiContainer.on("click", (data) => {
		this.callback.setSelectedEntry(this.getData("environments"), envData.id);
		
		const selectedCollection = this.callback.getSelectedEntry(this.getData("collections"));
		if (selectedCollection) {
			selectedCollection.uiContainer.emit("click");
		}
	});
	
	// position.left = position.left + width + collectionButtonLeftMargin;
	position.left = position.left + width + 1;
};

UI.prototype.generateEnvironmentButtons = function generateEnvironmentButtons(environments, container, position) {
	environments.forEach(e => this.initializeEnvironmentButton(e, container, position));
};

function printCollectionEntry(ce) {
	console.log("CE", omit(ce, "uiContainer", "elementDefinition.element"));
}

UI.prototype.initializeCollectionButton = function initializeCollectionButton(colData, container, position) {
	const myPosition = {...position};
	const width = colData.title.length + 2 + 4;
	
	colData.elementDefinition = new ControlButton({
		parent: container,
		width,
		...myPosition,
		content: colData.title,
		name: `CB ${colData.title}`
	});
	colData.uiContainer = colData.elementDefinition.getElement();
	
	/* this element is selected */
	colData.uiContainer.on("click", (data) => {
		
		this.callback.setSelectedEntry(this.getData("collections"), colData.id);
		
		const selectedEnvironment = this.callback.getSelectedEntry(this.getData("environments"));
		// printCollectionEntry(selectedEnvironment);
		
		if (colData.type === "service") {
			const collection = this.getData("collections").find(c => c.id === colData.id);
			
			const envXcol = selectedEnvironment && this.callback.getCollectionContents(collection, selectedEnvironment.id, undefined, true);
			
			if (envXcol) {
				envXcol.forEach(ec => {
					if (ec.bindToDomain) {
						const domainWidget = this.getData("domains").find(d => d.id === ec.domainId);
						const domainUiContainer = domainWidget.uiContainer;
						this.domainSuperContainer.show();
						
						const buttons = domainUiContainer.children.filter(c => c instanceof blessed.button);
						
						buttons.forEach((b, idx) => {
							const data = b.get("definition").getData("data");
							
							const selectedEnvironment = this.callback.getSelectedEntry(this.getData("environments"));
							const environmentTitle = this.callback.getEnvironmentTitleById(this.getData("environments"), data.originEnvironmentId) || "";
							
							const environmentTitleForContent = data.originEnvironmentId === selectedEnvironment.id ? undefined : environmentTitle;
							const content = data.location + (environmentTitleForContent ? " ("+ environmentTitleForContent +")" : "");
							
							b.setContent(content);
						});
					}
				});
				
				this.screen.render();
			}
		} else if (colData.type === "key") {
			this.keysContainer.show();

			const myPosition = {...position};

			const collection = this.getData("collections").find(c => c.id === colData.id);
			const envXcol = collection && collection.data;

			if (envXcol && selectedEnvironment) {
				envXcol.forEach(ec => {
					const environmentTitle = this.callback.getEnvironmentTitleById(this.getData("environments"), ec.originEnvironmentId) || "";
					const environmentTitleForContent = ec.originEnvironmentId === selectedEnvironment.id ? undefined : environmentTitle;

					const content = `${ec.key}: ${ec.value} ${(environmentTitleForContent ? " ("+ environmentTitleForContent +")" : "")}`;
					ec.uiContainer.setContent(content);

					myPosition.top ++;
				});
			}

			this.screen.render();
		}
	});

	// position.left += colData.title.length + collectionButtonLeftMargin;
	position.left = position.left + width;
};

UI.prototype.clickLeButton = function clickLeButton() {
	// console.log("asdfasdf", this.getData("environments"));
	this.getData("environments")[0].elementDefinition.element.emit("click");
};

UI.prototype.generateCollectionButtons = function generateCollectionButtons(items, container, position) {
	items.forEach(i => this.initializeCollectionButton(i, container, position));
};

UI.prototype.generateDomainWidgetButtons = function generateDomainWidgetButtons(domain, container, position) {
	const myPosition = {...position};
	const data = [];
	const buttons = [];
	myPosition.top = 1;

	/* TODO simplify */
	this.getData("environments").forEach((environment) => {
		/* TODO get rid of this sortBy / abstract it away */
		const envXcol = sortBy(this.getData("collections").reduce((stack, collection) => {
			
			const cc = this.callback.getCollectionContents(collection, environment.id, undefined, true);
			
			if (! cc || ! cc.length) {
				return stack;
			}
			
			const uniques = cc.filter(entry => {
				return stack.filter(s => isEqual(s, entry)).length === 0;
			});

			return stack.concat(uniques);
		}, []), ["originEnvironmentId"]);
		
		const uniques = envXcol.filter(entry => {
			return data.filter(s => isEqual(s, entry)).length === 0;
		});
		
		uniques.forEach(ec => {
			data.push(ec);
		});
	});

	data.forEach(entry => {
		if (entry.bindToDomain) {
			if (entry.domainId !== domain.id) {
				return;
			}
		}

		const environmentTitle = this.callback.getEnvironmentTitleById(this.getData("environments"), entry.originEnvironmentId) || "";

		const content = entry.location + (environmentTitle ? " ("+ environmentTitle +")" : "");

		const button = new DomainWidget.Button({
			parent: container,
			content,
			...myPosition,
			// hidden: true,
			name: `DWB ${environmentTitle}`
		});

		const element = button.getElement();

		element.on("press", () => {
			// console.log("DWB pressed");
			/* TODO symbol to signify processing */
			const selectedEnvironment = this.callback.getSelectedEntry(this.getData("environments"));

			try {
				const callInstructions = this.callback.getCallInstructions(entry.collectionId);

				callInstructions.forEach(ci => {
					if (ci.command) {
						const envvars = this.callback.getEnvironmentVariables(selectedEnvironment.id, ci.envKeyMap);
						const args = this.callback.getCLIArguments(entry);

						// console.log("command", ci.command, args);
						try {
							// const stdout = exec(`${ci.command} ${entry.domainId} ${entry.location}`, {
							const stdout = exec(`${ci.command} ${args}`, {
								env: envvars,
								encoding: "utf8",
								timeout: 1000,
							});
							// console.log("stdout:", stdout);
							/* TODO: set some symbol to signify of success */
						} catch (e) {
							// console.log("le fu");
						}
					}
				});
			} catch (e) {
				console.error(e);
			}
		});

		/* TODO abstract */
		button.setData("data", entry);
		buttons.push(button);
		
		myPosition.top ++;
	});
	position.top = myPosition.top + 1;
	
	return buttons;
};

UI.prototype.makeDomainContainer = function makeDomainContainer(domainData, container, position) {
	const myPosition = {...position};
	
	const content = domainData.id + " domain";
	const width = content.length + 1;
	
	domainData.elementDefinition = new DomainWidget({
		parent: container,
		// width,
		// width: "100%",
		...myPosition,
		content: domainData.title,
		border: {
			type: "line",
			fg: "black"
		},
		// hidden: true,
		name: `DW_ ${domainData.title}`
	});

	/* TODO abstract some of these calls */
	domainData.elementDefinition.setData("domainId", domainData.id);
	domainData.uiContainer = domainData.elementDefinition.getElement();
	domainData.uiContainer.set("domainId", domainData.id);
	domainData.uiContainer.set("role", "domainContainer");
	
	position.top ++;
	
	const buttons = this.generateDomainWidgetButtons(domainData, domainData.uiContainer, position);
	
	position.top ++;
};

UI.prototype.generateDomainContainers = function generateDomainContainers(domains, superContainer, position) {
	this.getData("domains").forEach(d => this.makeDomainContainer(d, superContainer, position));
};

UI.prototype.initializeKeyButton = function initializeKeyButton(keyData, container, position) {
	const myPosition = {...position};
	
	const environmentTitle = this.callback.getEnvironmentTitleById(this.getData("environments"), keyData.originEnvironmentId);
	
	const content = `${keyData.key}: ${keyData.value} ${(environmentTitle ? " ("+ environmentTitle +")" : "")}`;

	keyData.elementDefinition = KeyButtonDefinition;
	/* TODO abstract away */
	keyData.uiContainer = blessed.button({
		...KeyButtonDefinition,
		style: {
			fg: "black",
			hover: {
				fg: "blue"
			}
		},
		parent: container,
		...myPosition,
		content,
		width: content.length,
	});
	
	keyData.uiContainer.set("environment", keyData.originEnvironmentId);
	keyData.uiContainer.set("key", keyData.key);
	keyData.uiContainer.set("value", keyData.value);
	
	keyData.uiContainer.on("press", data => {
		// console.log("derp", keyData);

		const selectedEnvironment = this.callback.getSelectedEntry(this.getData("environments"));

		/* TODO try generalize with the one for domains */
		try {
			const callInstructions = this.callback.getCallInstructions(keyData.collectionId);

			callInstructions.forEach(ci => {
				if (ci.command) {
					const envvars = this.callback.getEnvironmentVariables(selectedEnvironment.id, ci.envKeyMap);
					const args = this.callback.getCLIArguments(keyData);

					// console.log("command", ci.command, args);
					try {
						// const stdout = exec(`${ci.command} ${entry.domainId} ${entry.location}`, {
						const stdout = exec(`${ci.command} ${args}`, {
							env: envvars,
							encoding: "utf8",
							timeout: 1000,
						});
						// console.log("stdout:", stdout);
						/* TODO: set some symbol to signify of success */
					} catch (e) {
						// console.log("le fu");
					}
				}
			});
		} catch (e) {
			console.error(e);
		}
	});
	
	position.top ++;
}

UI.prototype.initializeKeyButtons = function initializeKeyButtons(keys, container, position) {
	keys.forEach(k => this.initializeKeyButton(k, container, position));
};

UI.prototype.render = function render() {
	this.screen.render();
};

exports.default = UI;

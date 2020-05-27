const fs = require("fs");

const { orderBy } = require("lodash");

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

const buttonTypes = ["button", "radio-button"];
function isAnyButton(e) {
	return buttonTypes.indexOf(e.__proto__.type) >= 0;
}

function isBox(e) {
    return e.__proto__.type === "box";
}

function isForm(e) {
    return e.__proto__.type === "form";
}

function getForms(elements) {
    return elements.filter(isForm);
}

function isVisible(element) {
    return element.visible;
}

function getVisibles(elements) {
    return elements.filter(e => {
        // if (typeof e.visible === "undefined") {
        //     return !e.hidden;
        // } else {
        //     return e.visible;
        // }
        return isVisible(e);
    });
}

function getElementsWithContent(elements, content) {
    return elements.filter(e => {
        // console.log("E", e.getContent(), content);
        const match = e.getContent().match(content);
        return match !== null;
        // return e.getContent() === content;
    });
}

function getAnyButtons(elements) {
    return elements.filter(isAnyButton);
}

function findDomainSuperContainer(elements) {
    // return getForms(elements).find(f => {
    //     return f.get("role") === "domainSuperContainer";
    // });
    const e = elements.find(f => f.get("role") === "domainSuperContainer");
    // console.log("E", e);
    return e;
}

function isDomainContainer(element) {
    // console.log("EL", element.get("role"));
    return element.get("role") === "domainContainer";
}

function getDomains(domainSuperContainer) {
    return domainSuperContainer.collectDescendants().filter(isDomainContainer);
}

function findKeysContainer(elements) {
    // return getForms(elements).find(f => {
    //     return f.get("role") === "keysContainer";
    // });
    return elements.find(f => f.get("role") === "keysContainer");
}

function inspectDomains(domainSuperContainer) {
    // const domainContainers = getVisibles(getDomains(domainSuperContainer));
    const domainContainers = getDomains(domainSuperContainer);
    // console.log("domainContainers", domainContainers);
    // console.log("domainContainers", domainContainers);
    expect(domainContainers.length).toBeGreaterThan(0);

    domainContainers.forEach(dc => {
        expect(dc.getContent()).toBeTruthy();

        // const desc = dc.collectDescendants();
        // console.log("DC descendants", desc.length);
        // if (desc.length === 0) {
        //     console.log("no descendants", dc);
        // }
        const buttons = dc.collectDescendants().filter(isAnyButton);
        expect(buttons.length).toBeGreaterThan(0);

        buttons.forEach(b => {
            expect(b.getContent()).toBeTruthy();
        });
    });
}

function inspectKeys(keysContainer) {
    const buttons = getVisibles(getKeyButtons(keysContainer));
    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach(b => {
        expect(b.getContent()).toBeTruthy();
    });
}

function getKeyButtons(keysContainer) {
    return getAnyButtons(keysContainer.collectDescendants());
}

describe("App", () => {
    let screen;
    let Jea;
    let cliExit;

    beforeEach(() => {
        Jea = require("./cli");

        const { initialize } = Jea;
        const cli = Jea.start;
        // console.log("Jea", Jea);

        initialize(process);
        // initialize(process, (rc) => {
        //     console.log("initialize returned rc", rc);
        // });
        // console.log("back from initialize");

        // console.log("process argv in test", process.argv);
        const processWithExtraArgs = {
            ...process,
            // argv: process.argv.concat("./test-config.json")
            argv: [
                ...process.argv,
                "-c",
                "./test-config.json"
            ]
        };
        cli(processWithExtraArgs, (rc) => {
            // console.log("cli returned rc", rc);
        });
        // console.log("back from cli");

        // console.log("getting globals");
        const globals = Jea.getGlobals();
        // console.log("globals in beforeEach", "screen:", !!globals.screen, "program:", !!globals.program);

        screen = globals.screen;

        cliExit = () => {
            globals.program.emit("quit");
        };
    });

    afterEach(() => {
        cliExit();
    });

    it("visible content changes every time environment or collection is changed",
        async () => {
        // () => {

        const descendants = screen.collectDescendants();
        // console.log("descendants count", descendants.length);
        // console.log("descendant 0 keys", Object.keys(descendants[0]));
        // console.log("descendant", descendants[0].name);

        const buttons = descendants.filter(isAnyButton);

        const visibleButtons = getVisibles(buttons);
        // console.log("visibleButtons count", visibleButtons.length);
        // expect(visibleButtons).toHaveLength(0); // testin smoke-testeri vaan
        expect(visibleButtons.length).toBeGreaterThan(0);

        // const visibleButtonsSorted = orderBy(visibleButtons, ["aleft", "atop"], "asc");
        // console.log("visibleButtonsSorted length", visibleButtonsSorted.length);

        const env0Button = getElementsWithContent(visibleButtons, /Beta/)[0];
        const servicesButton = getElementsWithContent(visibleButtons, /Services/)[0];
        const env1Button = getElementsWithContent(visibleButtons, /Alpha/)[0];
        const keysButton = getElementsWithContent(visibleButtons, /Keys/)[0];

        expect(env0Button).toBeTruthy();
        expect(env0Button.visible).toBeTruthy();
        expect(env1Button).toBeTruthy();
        expect(env1Button.visible).toBeTruthy();
        expect(servicesButton).toBeTruthy();
        expect(servicesButton.visible).toBeTruthy();
        expect(keysButton).toBeTruthy();
        expect(keysButton.visible).toBeTruthy();

        // const domainSuperContainer = findDomainSuperContainer(getVisibles(descendants));
        const domainSuperContainer = findDomainSuperContainer(descendants);
        expect(domainSuperContainer).toBeTruthy();
        expect(domainSuperContainer.visible).not.toBeTruthy();

        const keysContainer = findKeysContainer(descendants);
        expect(keysContainer).toBeTruthy();
        expect(keysContainer.visible).not.toBeTruthy();

        env0Button.emit("click");
        servicesButton.emit("click");

        expect(domainSuperContainer.visible).toBeTruthy();

        inspectDomains(domainSuperContainer);
        // const domains0 = getVisibles(getDomains(domainSuperContainer));
        const domains0 = getDomains(domainSuperContainer);
        const domainSuperContainerDomains0Content = domainSuperContainer.collectDescendants().map(d => d.getContent()).join();

        // console.log("DSC content", domainSuperContainer.collectDescendants().map(d => d.getContent()).join(" | "));

        env1Button.emit("click");
        inspectDomains(domainSuperContainer);
        const domains1 = getDomains(domainSuperContainer);

        const domainSuperContainerDomains1Content = domainSuperContainer.collectDescendants().map(d => d.getContent()).join();

        expect(domainSuperContainerDomains0Content).not.toEqual(domainSuperContainerDomains1Content);
        // console.log("domains test", domains0 === domains1);
        // console.log("domains lengths", domains0.length, domains1.length);

        /* two environments may share some domains, and may have unique domains also.
         * TODO assert shared domains are visible for both environments,
         * and both environments have unique domains.
         */
        domains1.forEach((d1, i) => {
            domains0.forEach((d0, j) => {
                console.log(`d0(${i}) vs d1(${j})`, d0 === d1);
            });
        });

        keysButton.emit("click");
        expect(domainSuperContainer.visible).not.toBeTruthy();
        expect(keysContainer.visible).toBeTruthy();

        inspectKeys(keysContainer);
        const keys0 = getKeyButtons(keysContainer);
        const keys0Contents = keys0.map(k => k.getContent()).join();

        env0Button.emit("click");
        inspectKeys(keysContainer);
        const keys1 = getKeyButtons(keysContainer);
        const keys1Contents = keys1.map(k => k.getContent()).join();

        expect(keys0Contents).not.toEqual(keys1Contents);
    });

    describe("calls external program for services", () => {
        let env0Button;
        let servicesButton;
        let env1Button;
        let domainButtons;
        let domains;

        beforeAll(() => {
            Jea = require("./cli");
    
            const { initialize } = Jea;
            const cli = Jea.start;
            // console.log("Jea", Jea);
    
            initialize(process);
            // console.log("back from initialize");
    
            const processWithExtraArgs = {
                ...process,
                argv: [
                    ...process.argv,
                    "-c",
                    "./test-config.json"
                ]
            };

            // console.log("calling cli");
            cli(processWithExtraArgs, (rc) => {
                // console.log("cli returned rc", rc);
            });
            // console.log("back from cli");
    
            // console.log("getting globals");
            const globals = Jea.getGlobals();
            // console.log("globals in beforeAll", "screen:", !!globals.screen, "program:", !!globals.program);
    
            screen = globals.screen;
    
            cliExit = () => {
                globals.program.emit("quit");
            };

            const descendants = screen.collectDescendants();

            const buttons = descendants.filter(isAnyButton);

            const visibleButtons = getVisibles(buttons);
            // expect(visibleButtons.length).toBeGreaterThan(0);

            env0Button = getElementsWithContent(visibleButtons, /Beta/)[0];
            env1Button = getElementsWithContent(visibleButtons, /Alpha/)[0];
            // console.log("yarr", env1Button.getContent());
            servicesButton = getElementsWithContent(visibleButtons, /Services/)[0];

            const domainSuperContainer = findDomainSuperContainer(descendants);

            servicesButton.emit("click");

            // console.log("domainSuperContainer", domainSuperContainer);
            domains = getDomains(domainSuperContainer);
            // console.log("domains", domains);
            domainButtons = domains.reduce((stack, d) => {
                return stack.concat(d.collectDescendants().filter(isAnyButton));
            }, []);
            // console.log("domainButtons[0]", domainButtons[0]);
            // console.log("derp", env1Button.getContent(), domainButtons[2].getContent());
        });
    
        afterAll(() => {
            cliExit();
        });

        function test(envButton, domainButton, domain, filename) {
            envButton.emit("click");
            domainButton.emit("click");

            let data;
            try {
                data = fs.readFileSync(filename, {encoding: "utf8"});
                fs.unlink(filename);
            } catch (e) {
                console.error(e);
                throw e;
            }

            const pieces = data.split(" ");
            expect(pieces).toContain(domain.get("domainId"));

            const valuesInDomainButton = domainButton.getContent().split(" ");
            const argFound = pieces.find(p => valuesInDomainButton.find(v => v === p));
            expect(argFound).toBeTruthy();
        }

        it("environment 1, service 1", () => {
            return test(env0Button, domainButtons[0], domains[0], "dataa");
        });

        it("environment 1, service 2", () => {
            return test(env0Button, domainButtons[2], domains[1], "dataa");
        });

        it("environment 2, service 1", () => {
            return test(env1Button, domainButtons[1], domains[0], "dataa");
        });

        it("environment 2, service 2", () => {
            return test(env1Button, domainButtons[3], domains[1], "dataa");
        });
    });

    describe("calls external program for keys", () => {
        let env0Button;
        let env1Button;
        let keysButtons;
        let cliExit;

        beforeAll(() => {
            Jea = require("./cli");
    
            const { initialize } = Jea;
            const cli = Jea.start;
            // console.log("Jea", Jea);
    
            initialize(process);
            // initialize(process, (rc) => {
            //     console.log("initialize returned rc", rc);
            // });
            // console.log("back from initialize");
    
            const processWithExtraArgs = {
                ...process,
                argv: [
                    ...process.argv,
                    "-c",
                    "./test-config.json"
                ]
            };

            // console.log("calling cli");
            cli(processWithExtraArgs, (rc) => {
                // console.log("cli returned rc", rc);
            });
            // console.log("back from cli");
    
            // console.log("getting globals");
            const globals = Jea.getGlobals();
            // console.log("globals in beforeAll", "screen:", !!globals.screen, "program:", !!globals.program);
    
            screen = globals.screen;
    
            cliExit = () => {
                globals.program.emit("quit");
            };

            const descendants = screen.collectDescendants();

            const buttons = descendants.filter(isAnyButton);

            const visibleButtons = getVisibles(buttons);
            // expect(visibleButtons.length).toBeGreaterThan(0);

            env0Button = getElementsWithContent(visibleButtons, /Beta/)[0];
            env1Button = getElementsWithContent(visibleButtons, /Alpha/)[0];
            const keysButton = getElementsWithContent(visibleButtons, /Keys/)[0];

            keysButton.emit("click");

            const keysContainer = findKeysContainer(descendants);
            keysButtons = getKeyButtons(keysContainer);
        });
    
        afterAll(() => {
            cliExit();
        });

        function test(envButton, keyButton, filename) {
            envButton.emit("click");
            keyButton.emit("click");

            let data;
            try {
                data = fs.readFileSync(filename, {encoding: "utf8"});
                fs.unlink(filename);
            } catch (e) {
                console.error(e);
                throw e;
            }

            // console.log("input", data);
            const pieces = data.split(" ");
            expect(pieces).toContain(keyButton.get("key"));

            const valuesInKeyButton = keyButton.getContent().replace(":", "").split(" ");
            // console.log("valuesInKeyButton", valuesInKeyButton);
            // console.log("key", keyButton.get("key"));
            // console.log("paska", String(keyButton.get("value")));

            expect(valuesInKeyButton).toContain(keyButton.get("key"));
            expect(valuesInKeyButton).toContain(String(keyButton.get("value")));

            // const argFound = pieces.find(p => valuesInKeyButton.find(v => v === p));
            // expect(argFound).toBeTruthy();
        }

        it("environment 1, key 1", () => {
            return test(env0Button, keysButtons[0], "dataa");
        });

        it("environment 1, key 2", () => {
            return test(env0Button, keysButtons[2], "dataa");
        });

        it("environment 2, key 1", () => {
            return test(env1Button, keysButtons[1], "dataa");
        });

        it("environment 2, key 2", () => {
            return test(env1Button, keysButtons[3], "dataa");
        });
    });
});

const fs = require("fs");

const { isMatch, orderBy } = require("lodash");

const Application = require("./Application").default;

// jest.mock("blessed", () => {})

jest.mock("./UI", () => {
    const ctor = function UI(screen) {
        console.log("UI ctor", screen);

        this.setData = jest.fn();
        this.setCallback = jest.fn();
        this.initialize = jest.fn();
    };
    return {
        default: ctor
    }
});

describe("Application", () => {

    let app;
    let program;

    const domainsConfig = {
        "data": [
            {
                "id": "spamFinder",
                "title": "Spam Finder"
            },
            {
                "id": "moneyTracker",
                "title": "Money Tracker"
            }
        ],
        "sortBy": "asc"
    };

    const collections = {
        "data": [
            {
                "id": "services",
                "type": "service",
                "title": "Services",
                "data": [
                    {
                        "originEnvironmentId": "alpha",
                        "bindToDomain": true,
                        "domainId": "moneyTracker",
                    },
                    {
                        "originEnvironmentId": "alpha",
                        "bindToDomain": false,
                        "domainId": "spamFinder",
                    },
                    {
                        "originEnvironmentId": "beta",
                        "bindToDomain": true,
                        "domainId": "spamFinder",
                    }
                ]
            },
            {
                "id": "keys",
                "type": "key",
                "title": "Keys",
                "data": [
                    {
                        "originEnvironmentId": "alpha",
                        "key": "https_requests_only",
                        "value": false,
                    },
                    {
                        "originEnvironmentId": "alpha",
                        "key": "brand",
                        "value": "ALL",
                    },
                    {
                        "originEnvironmentId": "beta",
                        "key": "https_requests_only",
                        "value": true,
                    },
                ]
            }
        ]
    };

    beforeAll(() => {
    });

    beforeEach(() => {
        program = {
            emit: jest.fn()
        };

        app = new Application(undefined, program);
    });

    afterEach(() => {
        // cliExit();
    });

    describe("#quit", () => {
        it("emits quit event to program", () => {
            app.quit();
            expect(program.emit).toHaveBeenCalledWith("quit");
        });
    });

    describe("#loadConfig()", () => {
        let myApp;

        beforeEach(() => {
            program = {
                emit: jest.fn()
            };
    
            myApp = new Application(undefined, program);
        });
    
        it("sets loaded configuration to self", () => {
            const fileName = "test-config.json";
            const config = JSON.parse(fs.readFileSync(fileName));
            myApp.loadConfig(fileName);

            const helper = new Application(undefined, program);
            helper.setDomains({...domainsConfig});

            /* next two not so straightforward..
             * test bindCollectionEntryToDomain first, then use it here?
             */
            console.log("config.collections", config.collections);
            const collectionsClone = {
                ...config.collections
            };

            // let domains = {};
            collectionsClone.data.forEach(ce => {
                // pass each collectionEntry to the function..
                // console.log("_CE_", ce);
                ce.data
                    .filter(e => e.bindToDomain)
                    .forEach(e => helper.bindCollectionEntryToDomain(undefined, e))
                ;
            });

            expect(myApp.config.environments).toEqual(config.environments);
            expect(myApp.config.domains).toEqual(helper.config.domains);

            // console.log("myApp.config.collections", myApp.config.collections.data[0].data);
            // console.log("collectionsClone", collectionsClone.data[0].data);
            // expect(myApp.config.collections).toEqual(collectionsClone);

            myApp.config.collections.data.forEach(ce => {
                ce.data.forEach(de => {
                    const compCol = collectionsClone.data.find(e => e.type === ce.type);
                    expect(compCol).toBeTruthy();

                    const found = compCol.data.find(e => isMatch(e, de));

                    expect(found).toBeTruthy();
                });
            });

            expect(myApp.config.calls).toEqual(config.calls);
        });

        it("throws a custom Error when config file not found", () => {
            const fileName = "non-existent";

            expect(() => {
                myApp.loadConfig(fileName);
            }).toThrow();

            try {
                myApp.loadConfig(fileName);
            }
            catch (e) {
                expect(e.message).toContain(fileName);
                expect(e.code).toEqual("E_CONFIG_FILE_NOT_FOUND");
            }
        });
    });

    xit("#initialize()", () => {
        console.log(app);
        app.initialize();
        expect(app.ui.setData).toHaveBeenCalled();
    });

    describe("#getCLIArguments", () => {
        const collectionEntry = {
            "originEnvironmentId": "alpha",
            "bindToDomain": true,
            "domainId": "moneyTracker",
            "domainName": "MoneyTracker",
            "location": "1.2.3.4:5000",
            "cliParamMap": {
                "domainName": "name",
                "location": "value",
                "domainId": "id"
            }
        };

        it("returns a string that contains the arguments", () => {
            const argv = app.getCLIArguments(collectionEntry);
            expect(argv).toContain(collectionEntry.domainId);
            expect(argv).toContain(collectionEntry.domainName);
            expect(argv).toContain(collectionEntry.location);
        });

        it("returns a string wherein the arguments are in the same order as in configuration", () => {
            const argv = app.getCLIArguments(collectionEntry);
            expect(argv).toEqual("MoneyTracker 1.2.3.4:5000 moneyTracker");
        });
    });

    it("#addCollection", () => {
        const collection = {
            "id": "keys",
            "type": "key",
            "title": "Keys"
        };
        app.addCollection(collection);

        expect(app.config.key).toEqual([collection]);
    });

    it("#bindCollectionEntryToDomain", () => {
        const environmentId = "alpha";

        const collectionEntry = {
            originEnvironmentId: "alpha",
            domainId: "moneyTracker"
        };

        app.setEnvironments({
            "data": [
                {
                    "id": "alpha",
                    "title": "Alpha",
                },
                {
                    "id": "beta",
                    "title": "Beta",
                }
            ]
        });
        app.setDomains({...domainsConfig});
        app.bindCollectionEntryToDomain(undefined, collectionEntry);

        console.log("collectionEntry", collectionEntry);
        console.log("app.config.domains.data[0]", app.config.domains.data[0]);
        console.log("app.config.domains.data[1]", app.config.domains.data[1]);
        // expect(app.config.domains.data[0].data.environments[environmentId]).toEqual([collectionEntry]);
        const domain = app.config.domains.data.find(dde => dde.id === collectionEntry.domainId);
        // const found = app.config.domains.data.find(dde => {
        //     console.log("DDE", dde);
        //     return dde.find(de => de.data.find(e => isMatch(e, collectionEntry)));
        // });
        console.log("domain", domain);
        console.log("domain environments", domain.data.environments);
        const found = domain.data.environments[environmentId].find(de => isMatch(de, collectionEntry));
        expect(found).toBeTruthy();
    });

    describe("#setCollections", () => {
        let app;

        beforeAll(() => {
            app = new Application(undefined, program);

            app.setDomains({
                ...domainsConfig
            });

            const collectionEntry = {
                originEnvironmentId: "alpha",
                domainId: "moneyTracker"
            };

            app.bindCollectionEntryToDomain(undefined, collectionEntry);
            app.setCollections(collections);
        });

        it("service", () => {
            expect(app.config.service).toEqual(collections.data.filter(c => c.type === "service"));

            const flattenedServices = app.config.service.reduce((stack, s) => {
                return stack.concat(s.data);
            }, []);
            const domainBounds = flattenedServices.filter(s => s.bindToDomain);
            const unbounds = flattenedServices.filter(s => !s.bindToDomain);

            const flattenedDomains = app.config.domains.data.reduce((stack, d) => {
                return stack.concat(d);
            }, []);

            domainBounds.forEach(e => {
                const found = flattenedDomains.find(d => d.id === e.domainId /*&& d.originEnvironmentId === e.originEnvironmentId*/);
                expect(found).toBeTruthy();
            });

            unbounds.forEach(e => {
                const found = flattenedDomains.find(d => d.id === e.domainId && d.originEnvironmentId === e.originEnvironmentId);
                expect(found).not.toBeTruthy();
            });
        });

        it("key", () => {
            expect(app.config.key).toEqual(collections.data.filter(c => c.type === "key"));
        });
    });

    describe("#getCollectionContents", () => {
        let app;
        
        beforeAll(() => {
            app = new Application(undefined, program);
            app.setDomains({
                ...domainsConfig
            });
            app.setCollections(collections);
        });

        it("returns undefined when collection contains no data", () => {
            expect(app.getCollectionContents({})).toBeUndefined();
        });

        it("returns data for specified environment", () => {
            const keys = collections.data.reduce((stack, d) => {
                return d.type === "key" ? stack.concat(d.data) : stack;
            }, []);

            console.log("KEYS", keys);
            const environmentId = "alpha";
            const envData = app.getCollectionContents({data: keys}, environmentId);

            envData.forEach(e => {
                console.log("E", e);
                expect(e.originEnvironmentId).toEqual(environmentId);
            });

            const otherEnvironments = envData
                .reduce((stack, e) => stack.concat(e.originEnvironmentId), [])
                .filter(envId => envId !== environmentId)
            ;

            expect(otherEnvironments).toHaveLength(0);
        });

        it("returns domain-bound data for specified environment", () => {
            // const services = collections.data.reduce((stack, d) => {
            //     return d.type === "service" ? stack.concat(d) : stack;
            // }, []);
            console.log("collections", collections.data);
            const services = collections.data.reduce((stack, d) => {
                return d.type === "service" ? stack.concat(d.data) : stack;
            }, []);

            console.log("SERVICES", services);
            const environmentId = "alpha";
            const envData = app.getCollectionContents({data: services}, environmentId, undefined, true);

            envData.forEach(e => {
                console.log("E", e);
                expect(e.originEnvironmentId).toEqual(environmentId);
            });
        });

        it("returns non-domain-bound data for specified environment", () => {
            const keys = collections.data.reduce((stack, d) => {
                return d.type === "key" ? stack.concat(d) : stack;
            }, []);
            const environmentId = "alpha";
            const envData = app.getCollectionContents({data: keys}, environmentId, undefined, false);

            envData.forEach(e => {
                console.log("E", e);
                expect(e.originEnvironmentId).toEqual(environmentId);
                expect(e.bindToDomain).toEqual(true);
            });
        });
    });

    describe("#getCallInstructions", () => {
        it("returns all when no collection specified", () => {
            //
        });

        it("returns calls for specified collection", () => {
            //
        });
    });

    // getEnvironmentVariables
    // getEnvironmentTitleById
    // setSelectedEntry
    // getSelectedEntry
});

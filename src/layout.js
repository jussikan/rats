const { flatten } = require("lodash");
const { isEqual } = require("lodash");
const { sortBy } = require("lodash");

var blessed = require('blessed')
  , screen = blessed.screen({
    dump: __dirname +"/layout.log",
    warnings: true,
    debug: true
  })
  , program = blessed.program()
;

program.on("quit", function() {
  process.exit(0);
});

var RootLayoutDefinition = {
  parent: screen,
  top: 0,
  left: 0,
  shrink: false,
  clickable: true,
  width: "100%",
  height: "100%",
};
var rootLayout = blessed.layout(RootLayoutDefinition);


var environments = sortBy([
  {
    id: "amber",
    title: "amber",
    location: "http://localhost:8499",
    elementDefinition: null,
    uiContainer: null
  },
  {
    id: "baseline",
    title: "Baseline",
    location: "http://localhost:8500",
    elementDefinition: null,
    uiContainer: null
  }
], ["title"]);


// rootLayout.on("click", function() {
//   lastChoiceBox.setValue("none selected");
//   screen.render();
// });

var HorizontalContainerDefinition = {
  parent: rootLayout,
  shrink: false,
  transparent: false,
  width: "100%"
};

// function EnvironmentButton(optionsOrObject) {
//   if (optionsOrObject instanceof EnvironmentButton) {
//     this.options = optionsOrObject.getOptions;
//   } else if (typeof optionsOrObject === "object") {
//     this.options = {
//       shrink: true,
//       padding: {
//         left: 1,
//         right: 1,
//       },
//       transparent: false,
//       style: {
//         fg: "blue",
//         hover: {
//           bg: "blue",
//           fg: "#fff"
//         },
//       },
//       clickable: true,
//       scrollable: false,
//       ...optionsOrObject
//     };
//     // console.log("env button options", this.options);
//   } else {
//     this.options = undefined;
//   }
// }
// EnvironmentButton.prototype.getOptions = function getOptions() {
//   return this.options;
// };
// EnvironmentButton.prototype.getElement = function getElement() {
//   return blessed.button(this.options);
// };

function ControlButton(optionsOrObject) {
  if (optionsOrObject instanceof ControlButton) {
    this.options = optionsOrObject.getOptions();
  } else if (typeof optionsOrObject === "object") {
    this.options = {
      shrink: true,
      padding: {
        left: 1,
        right: 1
      },
      transparent: false,
      style: {
        fg: "blue",
        hover: {
          bg: "blue",
          fg: "white"
        },
        focus: {
          bg: "blue",
          fg: "white"
        }
      },
      mouse: true,
      keys: false,
      scrollable: false,
      ...optionsOrObject
    };
  } else {
    this.options = undefined;
  }

  this.element = null;
}
ControlButton.prototype.setOption = function setOption(name, value) {
  this.options[name] = value;
};
ControlButton.prototype.getOptions = function getOptions() {
  return this.options;
};
ControlButton.prototype.getElement = function getElement() {
  this.element = blessed.button(this.options);
  this.element.set("definition", this);
  return this.element;
};

var collectionButtonLeftMargin = 3;

function initializeEnvironmentButton(envData, container, position) {
  var myPosition = {...position};

  envData.elementDefinition = new ControlButton({
    parent: container,
    width: envData.title.length + 2,
    ...myPosition,
    content: envData.title
  });
  envData.uiContainer = envData.elementDefinition.getElement();

  envData.uiContainer.on("mousedown", function(data) {
    lastChoiceBox.setValue(envData.title +" selected");

    setSelectedEntry(environments, envData.id);

    var selectedCollection = getSelectedEntry(collections);
    if (selectedCollection) {
      // console.log("selectedCollection", selectedCollection.id);
      // console.log("selectedCollection", selectedCollection.uiContainer);
      selectedCollection.uiContainer.emit("press");
    }

    // envData.uiContainer.free();

    // envData.elementDefinition = new EnvironmentButton({
    //   ...envData.elementDefinition.getOptions(),
    //   style: {
    //     bg: "blue",
    //     fg: "white"
    //   },
    // });
    // envData.elementDefinition.setOption("style", {
    //   bg: "blue",
    //   fg: "white"
    // });

    // envData.uiContainer = envData.elementDefinition.getElement();
    // envData.uiContainer.on("clickOutside", () => {
    //   // envData.uiContainer.free();

    //   envData.elementDefinition = new EnvironmentButton({
    //     ...envData.elementDefinition.getOptions(),
    //     style: {
    //       // bg: "white",
    //       fg: "blue"
    //     },
    //   });
    //   envData.uiContainer = envData.elementDefinition.getElement();
    // });
    // setOnClickOutside(envData.uiContainer, container);

    // screen.render();
    // envData.uiContainer.focus();
  });

  position.left += envData.title.length + collectionButtonLeftMargin;
}

function setSelectedEntry(entries, selectedId) {
  var oldOne = entries.find(e => e.selected);

  if (oldOne) {
    oldOne.selected = false;
  }

  var newOne = entries.find(e => e.id === selectedId);
  if (newOne) {
    newOne.selected = true;
  }
}

function getSelectedEntry(entries) {
  return entries.find(e => e.selected);
}

function setUnselectHandler(colData) {
  colData.uiContainer.on("unselect", () => {
    console.log("coll button id", colData.id);
    console.log("coll button style", colData.elementDefinition.getOptions().style);
    // colData.uiContainer.free();

    // colData.elementDefinition = new ControlButton({
    //   ...colData.elementDefinition.getOptions(),
    //   style: {
    //     // bg: "white",
    //     fg: "blue"
    //   },
    // });

    // colData.uiContainer = colData.elementDefinition.getElement();

    screen.render();
  });
}

function getDomainContents(collection, environmentId, collectionId) {
  // console.log("derp");
  // console.log("collection", collection);
  // console.log("collection", collection.map(c => {return {
  //   originEnvironmentId: c.originEnvironmentId,
  //   key: c.key,
  //   value: c.value
  // };}), collection.filter(c => Boolean(c[collectionId])))

  var contents = flatten(collection
    .filter(d => Boolean(d[collectionId]))
    .map(d => d[collectionId])
    .filter(dc => Boolean(dc[environmentId]))
    .map(dc => dc[environmentId]))
  ;

  return contents;
}

function getKeyContents(collection, environmentId, collectionId) {
  // console.log("derp");
  // console.log("collection", collection);
  // console.log("collection", collection.map(c => {return {
  //   originEnvironmentId: c.originEnvironmentId,
  //   key: c.key,
  //   value: c.value
  // };}), collection.filter(c => Boolean(c[collectionId])))

  var contents = flatten(collection
    .filter(d => Boolean(d[collectionId]))
    .map(d => d[collectionId])
    .filter(dc => Boolean(dc[environmentId]))
    .map(dc => dc[environmentId]))
  ;

  return contents;
}

function getDomainSettings(environmentId, collectionId) {
  var settings = domains.reduce((stack, domain) => {
    var collectionSettings = domain[collectionId];
    var envXcolSettings = collectionSettings && collectionSettings[environmentId];

    if (!envXcolSettings) {
      return stack;
    }

    var exists = stack.find(s => isEqual(s, envXcolSettings));
    if (exists) {
      return stack;
    }

    return stack.concat(collectionSettings[environmentId]);
  }, []);

  return settings;
}

function initializeCollectionButton(colData, container, position) {
  var myPosition = {...position};

  colData.elementDefinition = new ControlButton({
    parent: container,
    width: colData.title.length + 2,
    ...myPosition,
    content: colData.title
  });
  colData.uiContainer = colData.elementDefinition.getElement();

  /* this element is selected */
  colData.uiContainer.on("press", (data) => {
    lastChoiceBox.setValue(colData.title +" selected");

    setSelectedEntry(collections, colData.id);

    var selectedEnvironment = getSelectedEntry(environments);
    // console.log("colData", colData.id);

    // var selectedCollection = getSelectedEntry(collections);

    if (colData.id === "services") {
      var envXcol = selectedEnvironment && getDomainContents(domains, selectedEnvironment.id, colData.id);
      // var envXcol = undefined;

      if (envXcol) {
        envXcol.forEach(ec => {
          // console.log("ec", ec);
          var domainWidget = domains.find(d => d.id === ec.domainId);
          var domainUiContainer = domainWidget.uiContainer;
          // domainUiContainer.show();
          domainSuperContainer.show();

          // selectedCollection.uiContainer.hide();
          keysContainer.hide(); // TODO abstract this; hide all other collections
          // setSelectedEntry(collections, colData.id);

          var buttons = domainUiContainer.children.filter(c => c instanceof blessed.button);

          // buttons
          //   .filter(b => b.get("definition").data.data.originEnvironmentId === selectedEnvironment.id)
          //   .forEach(b => b.hide())
          // ;

          // buttons
          //   .filter(b => b.get("definition").data.data.originEnvironmentId !== selectedEnvironment.id)
          //   .forEach(b => b.show())
          // ;

          buttons.forEach((b, idx) => {
            var data = b.get("definition").getData("data");
            var selectedEnvironment = getSelectedEntry(environments);
            var environmentTitle = getEnvironmentTitleById(environments, data.originEnvironmentId) || "";

            var environmentTitleForContent = data.originEnvironmentId === selectedEnvironment.id ? undefined : environmentTitle;
            var content = data.location + (environmentTitleForContent ? " ("+ environmentTitleForContent +")" : "");

            b.setContent(content);
            b.show();
          });
        });

        // widget.uiContainer.show();
        // var domainButton = blessed.button({
        //   parent: widget.uiContainer,
        //   content: envXcol[0].location
        // });
        // console.log("domainButton", domainButton);

        screen.render();
      }
    } else if (colData.id === "keys") {
      // var envXcol = selectedEnvironment && getKeyContents(keys, selectedEnvironment.id);
      domainSuperContainer.hide(); // TODO abstract away
      keysContainer.show(); // TODO abstract away

      // console.log("envXcol", envXcol);
      // envXcol.forEach(ec => {
      //   // console.log("ec", ec);
      //   // var domainWidget = domains.find(d => d.id === ec.domainId);
      //   // var domainUiContainer = domainWidget.uiContainer;
      //   keyContainer.show();

      //   // var buttons = domainUiContainer.children.filter(c => c instanceof blessed.button);

      //   // buttons.forEach((b, idx) => {
      //   //   var data = b.get("definition").getData("data");
      //   //   var selectedEnvironment = getSelectedEntry(environments);
      //   //   var environmentTitle = getEnvironmentTitleById(environments, data.originEnvironmentId) || "";

      //   //   var environmentTitleForContent = data.originEnvironmentId === selectedEnvironment.id ? undefined : environmentTitle;
      //   //   var content = data.location + (environmentTitleForContent ? " ("+ environmentTitleForContent +")" : "");

      //   //   b.setContent(content);
      //   //   b.show();
      //   // });
      // });

      // screen.render();
    }
  });

  position.left += colData.title.length + collectionButtonLeftMargin;
}

function addHorizontalLine(container, position, width) {
  var myPosition = {...position};

  position.left ++;

  var options = {
    parent: container,
    orientation: "horizontal",
    ...myPosition,
    width: width || "100%",
  };

  return blessed.line(options);
}

function generateEnvironmentButtons(environments, container, position) {
  environments.forEach(e => initializeEnvironmentButton(e, container, position));
}

function generateCollectionButtons(items, container, position) {
  items.forEach(i => initializeCollectionButton(i, container, position));
}

function DomainWidget(optionsOrObject) {
  if (optionsOrObject instanceof DomainWidget) {
    this.options = optionsOrObject.getOptions();
  } else if (typeof optionsOrObject === "object") {
    this.options = {
      shrink: true,
      padding: {
        left: 1,
        right: 1
      },
      transparent: false,
      mouse: false,
      keys: false,
      scrollable: false,
      ...optionsOrObject
    };
  } else {
    this.options = undefined;
  }

  this.element = null;

  this.data = {};
}
DomainWidget.prototype.setData = function setData(name, value) {
  this.data[name] = value;
};
DomainWidget.prototype.getData = function getData(name) {
  return this.data[name];
};
DomainWidget.prototype.setOption = function setOption(name, value) {
  this.options[name] = value;
};
DomainWidget.prototype.getOptions = function getOptions() {
  return this.options;
};
DomainWidget.prototype.getElement = function getElement() {
  this.element = blessed.box(this.options);
  return this.element;
};

DomainWidget.Button = function DomainWidgetButton(optionsOrObject) {
  if (optionsOrObject instanceof DomainWidget) {
    this.options = optionsOrObject.getOptions();
  } else if (typeof optionsOrObject === "object") {
    this.options = {
      shrink: true,
      clickable: true,
      mouse: true,
      width: optionsOrObject.content.length + 1,
      height: 1,
      transparent: false,
      style: {
        fg: "black",
        hover: {
          fg: "blue",
        }
      },
      // hidden: true,
      ...optionsOrObject
    };
  } else {
    this.options = undefined;
  }

  this.element = null;

  this.data = {};
};
DomainWidget.Button.prototype.setData = function setData(name, value) {
  this.data[name] = value;
};
DomainWidget.Button.prototype.getData = function getData(name) {
  return this.data[name];
};
DomainWidget.Button.prototype.setOption = function setOption(name, value) {
  this.options[name] = value;
};
DomainWidget.Button.prototype.getOptions = function getOptions() {
  return this.options;
};
DomainWidget.Button.prototype.getElement = function getElement() {
  this.element = blessed.button(this.options);
  this.element.set("definition", this);
  return this.element;
};

function getEnvironmentTitleById(environments, environmentId) {
  var env = environments.find(e => e.id === environmentId);
  return env ? env.title : undefined;
}

function generateDomainWidgetButtons(domain, container, position) {
  var myPosition = {...position};
  var data = [];
  var buttons = [];
  myPosition.top = 1;

  environments.forEach((environment, idx) => {
    var envXcol = sortBy(collections.reduce((stack, collection) => {
      var cc = getDomainContents(domains, environment.id, collection.id)

      var uniques = cc.filter(entry => {
        return stack.filter(s => isEqual(s, entry)).length === 0;
      });

      return stack.concat(uniques);
    }, []), ["originEnvironmentId"]);

    var uniques = envXcol.filter(entry => {
      return data.filter(s => isEqual(s, entry)).length === 0;
    });

    uniques.forEach(ec => {
      data.push(ec);
    });
  });

  var previousOriginEnvironmentId = data[0].originEnvironmentId;
  data.forEach(entry => {
    var selectedEnvironment = getSelectedEntry(environments);

    if (entry.domainId !== domain.id) {
      return;
    }

    var environmentTitle = getEnvironmentTitleById(environments, entry.originEnvironmentId) || "";

    var content = entry.location + (environmentTitle ? " ("+ environmentTitle +")" : "");

    var button = new DomainWidget.Button({
      parent: container,
      content,
      ...myPosition,
      // hidden: true
    });

    var element = button.getElement();
    element.on("press", () => {
      var selectedEnvironment = getSelectedEntry(environments);
      console.log(entry.location +" chosen for "+ entry.domainId +" in "+ environmentTitle);
    });

    button.setData("data", entry);
    buttons.push(button);

    myPosition.top ++;
  });
  position.top = myPosition.top + 1;

  return buttons;
}

function makeDomainContainer(domainData, container, position) {
  var myPosition = {...position};

  var content = domainData.id + " domain";
  var width = content.length + 1;

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
  });
  domainData.elementDefinition.setData("domainId", domainData.id);
  domainData.controller = collections.find(c => c.id === "services");
  domainData.uiContainer = domainData.elementDefinition.getElement();
  domainData.uiContainer.set("domainId", domainData.id);

  position.top ++;

  var buttons = generateDomainWidgetButtons(domainData, domainData.uiContainer, position);

  position.top ++;
}

function generateDomainContainers(domains, superContainer, position) {
  domains.forEach(d => makeDomainContainer(d, superContainer, position));
}


var KeyButtonDefinition = {
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

function initializeKeyButton(keyData, container, position) {
  var myPosition = {...position};

  var environmentTitle = getEnvironmentTitleById(environments, keyData.originEnvironmentId);

  var content = `${keyData.key}: ${keyData.value} ${(environmentTitle ? " ("+ environmentTitle +")" : "")}`;

  var selectedEnvironment = getSelectedEntry(environments);
  if (selectedEnvironment) {
    console.log("selectedEnvironment", selectedEnvironment);
  }

  // console.log("myPosition", myPosition);
  keyData.elementDefinition = KeyButtonDefinition;
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

  keyData.uiContainer.on("click", data => {
    console.log("derp", keyData.key);
  });

  position.top ++;
}

function initializeKeyButtons(keys, container, position) {
  keys.forEach(k => initializeKeyButton(k, container, position));
}


var collections = [
  {
    id: "services",
    title: "Services"
  },
  {
    id: "keys",
    title: "Keys"
  },
  {
    id: "aaa",
    title: "AAA"
  }
];
/* TODO: a panel for each collection. do like in consul's page first,
 * then sliding panels just for fun.
 */


var top = 0;
var left = 30; // hack
var position = { top, left };

var environmentsContainer = blessed.box(HorizontalContainerDefinition);

generateEnvironmentButtons(environments, environmentsContainer, position);

position.left = 30; // hack
addHorizontalLine(rootLayout, position);

position.left = 30; // hack
var collectionsContainer = blessed.form(HorizontalContainerDefinition);

// collectionsContainer.on("element click", (element, mouse) => {
//   collections.forEach(c => c.uiContainer.emit("clickOutside"));

//   if (element === collectionsContainer) {
//     return false;
//   }
// });
generateCollectionButtons(collections, collectionsContainer, position);

addHorizontalLine(rootLayout, position);
// position.top = 4;
position.left = 0;


var lastChoiceBox = blessed.textbox({
  parent: rootLayout,
  top: 'center',
  left: 'center',
  shrink: true,
  border: {
    type: "line",
    fg: "red",
  },
  mouse: false,
  hidden: true,
  height: 3,
  width: 100
});
lastChoiceBox.setValue("plop");

lastChoiceBox.on("clickOutside", () => {
  lastChoiceBox.setValue("nothing selected");
});

function setOnClickOutside(element, contextElement) {
  contextElement.on("click", (data) => {
    element.emit("clickOutside", data);
    screen.render();
  });
}

// setOnClickOutside(lastChoiceBox, rootLayout);

var storedServices = sortBy([
  {
    originEnvironmentId: "amber",
    domainId: "aggregator",
    location: "10.154.34.18:8080",
  },
  {
    originEnvironmentId: "baseline",
    domainId: "aggregator",
    location: "52.1.2.3:61175",
  },
  {
    originEnvironmentId: "amber",
    domainId: "address-validation",
    location: "10.154.34.18:9947",
  },
  {
    originEnvironmentId: "baseline",
    domainId: "address-validation",
    location: "52.1.2.3:19947",
  },
], ["originEnvironmentId"]);

var storedKeys = [
  {
    originEnvironmentId: "amber",
    key: "https_requests_only",
    value: false
  },
  {
    originEnvironmentId: "amber",
    key: "x_brand",
    value: "ALL"
  },
  {
    originEnvironmentId: "baseline",
    key: "https_requests_only",
    value: true
  },
  {
    originEnvironmentId: "baseline",
    key: "x_brand",
    value: "foo"
  }
];

var keys = sortBy([...storedKeys], ["key"]);
// var keys = storedKeys;

var domains = [
  {
    id: "aggregator",
    title: "BSSAPI aggregator",
    elementDefinition: null,
    uiContainer: null,
    children: [],
    services: {}
  },
  {
    id: "address-validation",
    title: "Address validation",
    elementDefinition: null,
    uiContainer: null,
    children: [],
    services: {}
  }
];

domains.forEach(d => {
  storedServices.forEach(s => {
    d.services[ s.originEnvironmentId ] = sortBy(
        storedServices.reduce((stack, service) => {
          var isServiceForDomain = service.domainId === d.id;
          return isServiceForDomain ? stack.concat(service) : stack;
        }, [])
      ,
      ["originEnvironmentId"]
    );
  });

  // storedKeys.forEach(s => {
  //   d.services[ s.originEnvironmentId ] = sortBy(
  //       storedKeys.reduce((stack, entry) => {
  //         // var isKeyForDomain = entry.domainId === d.id;
  //         // return isKeyForDomain ? stack.concat(entry) : stack;
  //         return stack.concat(entry);
  //       }, [])
  //     ,
  //     ["originEnvironmentId"]
  //   );
  // });
});

var DomainSuperContainerDefinition = {
  parent: rootLayout,
  shrink: true,
  transparent: false,
  ...position,
  border: {
    type: "line",
    fg: "red",
  },
  width: "100%",
  content: "foo",
  hidden: true,
};
var domainSuperContainer = blessed.form(DomainSuperContainerDefinition);

generateDomainContainers(domains, domainSuperContainer, position);


var rightPosition = {
  top: 0,
  left: 0,
};
var KeysContainerDefinition = {
  parent: rootLayout,
  shrink: true,
  transparent: false,
  // ...rightPosition,
  border: {
    type: "line",
    fg: "red",
  },
  width: "100%",
  // height: 6,
  content: "foo",
  hidden: true,
};
var keysContainer = blessed.form(KeysContainerDefinition);
initializeKeyButtons(keys, keysContainer, rightPosition);

keysContainer.on("show", () => {
  var selectedEnvironment = getSelectedEntry(environments);
  console.log(selectedEnvironment.id);

  keysContainer.children.forEach(c => {
    var key = c.get("key");
    var value = c.get("value");
    var environmentId = c.get("environment");
    var environmentTitle = getEnvironmentTitleById(environments, environmentId);

    if (environmentId === selectedEnvironment.id) {
      // c.show();
      var content = `${key}: ${value}`;
      c.setContent(content);
    } else {
      // c.hide();
      var content = `${key}: ${value} ${(environmentTitle ? " ("+ environmentTitle +")" : "")}`;
      c.setContent(content);
    }
  });
});


var focusedDomainIndex = null;

screen.key("tab", function() {
  if (null === focusedDomainIndex) {
    domains[0].uiContainer.focus();
    focusedDomainIndex = 0;
    return;
  }

  if (focusedDomainIndex + 1 == domains.length) {
    focusedDomainIndex = 0;
  } else {
    ++ focusedDomainIndex;
  }

  domains[focusedDomainIndex].uiContainer.focus();
});


screen.key("enter", function() {
  if (null === focusedDomainIndex) {
    return;
  }

  lastChoiceBox.setValue(domains[focusedDomainIndex].title);
  screen.render();
});

// screen.enableKeys();

screen.key('q', function() {
  program.emit("quit");
});

screen.render();

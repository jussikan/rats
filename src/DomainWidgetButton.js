const blessed = require('blessed');

const DomainWidget = require("./DomainWidget").default;

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
	if (! this.element) {
		this.element = blessed.button(this.options);
		this.element.set("definition", this);
	}

	return this.element;
};

exports.default = DomainWidget.Button;

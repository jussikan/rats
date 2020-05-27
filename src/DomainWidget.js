const blessed = require('blessed');

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
	if (! this.element) {
		this.element = blessed.box(this.options);
	}

	return this.element;
};

exports.default = DomainWidget;

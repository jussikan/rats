const blessed = require('blessed');

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
				// focus: {
				//   bg: "blue",
				//   fg: "white"
				// }
			},
			mouse: true,
			keys: true,
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
	if (! this.element) {
		this.element = blessed.radiobutton(this.options);
		this.element.set("definition", this);
		this.element.set("id", this.options.id);
	}

	return this.element;
};

exports.default = ControlButton;

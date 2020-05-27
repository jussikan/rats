
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

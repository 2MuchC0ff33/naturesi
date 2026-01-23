// Safeguarded mock for HTMLFormElement.prototype.requestSubmit
if (typeof global.HTMLFormElement !== "undefined") {
  global.HTMLFormElement.prototype.requestSubmit = function () {
    if (this.tagName === "FORM") {
      this.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  };
}

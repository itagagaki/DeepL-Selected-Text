var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var Helper = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      Helper: {
        async getSelectedText() {
          return Services.wm.getMostRecentWindow(null).document.commandDispatcher.focusedWindow.getSelection().toString();
        }
      }
    };
  }
};

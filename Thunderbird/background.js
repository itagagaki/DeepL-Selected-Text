async function goDeepL(text, allowReload = true)
{
  let result = await messenger.storage.local.get(['target', 'width', 'height', 'source_lang', 'target_lang']);
  let source_lang = result.source_lang ? result.source_lang : '?';
  let target_lang = result.target_lang ? result.target_lang : '?';

  if (source_lang == '?') {
    source_lang = 'null';
  }

  if (target_lang == '?') {
    target_lang = chrome.i18n.getUILanguage();
  }

  const escapedText = text.replace(/\\/g, '\\\\')
                          .replace(/\//g, '\\/')
                          .replace(/\|/g, '\\|');

  const url = 'https://www.deepl.com/translator#' + source_lang + '/' + target_lang + '/' + encodeURIComponent(escapedText);

  // Wait for the page load in the opened tab/window to trigger a reload if needed.
  let status = await new Promise(async resolve => {
    let tabId;
    let listener = async details => {
      //console.log("Received tabId", details.tabId);
      if (details.tabId != tabId) {
        return;
      }
      let releaseGroups = await messenger.cookies.get({ name: "releaseGroups", url: "https://www.deepl.com" });
      if (releaseGroups == null) {
        messenger.webNavigation.onCompleted.removeListener(listener);
        resolve({ tabId, needsReload: false });
        return;
      }
      // We have to delete this cookie and re-request due to the DeepL translator bug.
      await messenger.cookies.remove({ name: "releaseGroups", url: "https://www.deepl.com" });
      messenger.webNavigation.onCompleted.removeListener(listener);
      resolve({ tabId, needsReload: true });
    }
    messenger.webNavigation.onCompleted.addListener(listener);

    switch (result.target) {
    case "window":
      let window = await messenger.windows.create({ url: url, type: "popup", width: Number(result.width), height: Number(result.height) });
      let { tabs } = await browser.windows.get(window.id, { populate: true });
      tabId = tabs[0].id;
      break;
    case "tabs":
    default:
      let tab = await messenger.tabs.create({ 'url': url });
      tabId = tab.id;
      break;
    }
    //console.log("Created tabId:", tabId);
  })

  if (status.needsReload && allowReload) {
    console.log("Needs Reload");
    let { version } = await browser.runtime.getBrowserInfo();
    let majorVersion = parseInt(version.split(".").shift());
    if (result.target == "window" && majorVersion < 115) {
      messenger.tabs.remove(status.tabId);
      // Prevent endless loops by not allowing closing and re-opening a second time.
      await goDeepL(text, false);
    } else {
      messenger.tabs.reload(status.tabId);
    }
  }

}

function onCreated() {
  if (messenger.runtime.lastError) {
    console.log('DeepL:' + `Error: ${messenger.runtime.lastError}`);
  }
}

messenger.menus.create({
  id: "menuDeepL",
  title: messenger.i18n.getMessage("menuItemTranslate"),
  contexts: ["selection"]
}, onCreated);

messenger.menus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
  case "menuDeepL":
    goDeepL(info.selectionText);
    break;
  }
});

messenger.commands.onCommand.addListener((command) => {
  switch (command) {
  case "deepl":
  case "deepl2":
    messenger.Helper.getSelectedText().then(text => {
      if (text && text.match(/\S/g)) {
        goDeepL(text);
      }
    });
    break;
  }
});

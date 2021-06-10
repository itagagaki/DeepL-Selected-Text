function goDeepL(text)
{
  messenger.storage.local.get(['target', 'width', 'height', 'source_lang', 'target_lang'], function(result) {
    let source_lang = result.source_lang ? result.source_lang : '?';
    let target_lang = result.target_lang ? result.target_lang : '?';

    if (source_lang == '?') {
      source_lang = 'default';
    }

    if (target_lang == '?') {
      target_lang = chrome.i18n.getUILanguage();
    }

    const escapedText = text.replace(/\\/g, '\\\\')
                            .replace(/\//g, '\\/')
                            .replace(/\|/g, '\\|');

    const url = 'https://www.deepl.com/translator#'+source_lang+'/'+target_lang+'/'+encodeURIComponent(escapedText);
    switch (result.target) {
    case "window":
      messenger.windows.create({url: url, type: "popup", width: Number(result.width), height: Number(result.height)});
      break;
    case "tabs":
    default:
      messenger.tabs.create({'url': url});
      break;
    }
  });
}

function onCreated() {
  if (messenger.runtime.lastError) {
    console.log('DeepL:'+`Error: ${messenger.runtime.lastError}`);
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
    messenger.Helper.getSelectedText().then(text => {
      if (text && text.match(/\S/g)) {
        goDeepL(text);
      }
    });
    break;
  }
});

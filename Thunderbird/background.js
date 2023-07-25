function goDeepL(text)
{
  messenger.storage.local.get(['target', 'width', 'height', 'source_lang', 'target_lang'], function(result) {
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

    const url = 'https://www.deepl.com/translator#'+source_lang+'/'+target_lang+'/'+encodeURIComponent(escapedText);
    //console.log(url);

    switch (result.target) {
    case "window":
      messenger.windows.create({url: url, type: "normal", width: Number(result.width), height: Number(result.height)});
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

/**/

// Workaround for the DeepL translator bug
function addressDeepLBug(details)
{
  if (details.url.match(/^https:\/\/.*\.deepl\.com/)) {
    messenger.cookies.get({name: "releaseGroups", url: "https://www.deepl.com"})
      .then(releaseGroups => {
        if (releaseGroups != null) {
          messenger.cookies.remove({name: "releaseGroups", url: "https://www.deepl.com"})
            .finally(() => chrome.tabs.reload(details.tabId));
        }
      });
  }
}
messenger.webNavigation.onCompleted.addListener(addressDeepLBug);

/**/

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

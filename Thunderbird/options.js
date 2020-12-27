function saveOptions(e) {
  const targetValue = Array.from(document.getElementsByName('target')).find(elem => elem.checked).value;
  browser.storage.local.set({
    "target": targetValue
  });
  const width = document.getElementsByName('width')[0].value;
  const height = document.getElementsByName('height')[0].value;
  const source_lang = document.getElementById('source_lang').value;
  const target_lang = document.getElementById('target_lang').value;
  browser.storage.local.set({
    "width": width,
    "height": height,
    "source_lang": source_lang,
    "target_lang": target_lang
  });
  e.preventDefault();
}

function selectLangOption(id, lang) {
  const select = document.getElementById(id);
  if (select) {
    if (!lang) {
      lang = '?';
    }
    select.value = lang;
  }
}

function restoreOptions() {
  browser.storage.local.get(['target', 'source_lang', 'target_lang'], function(result) {
    const target = result.target ? result.target : 'tab';
    Array.from(document.getElementsByName('target')).forEach(
      elem => { elem.checked = elem.value == target; }
    );
    selectLangOption('source_lang', result.source_lang);
    selectLangOption('target_lang', result.target_lang);
  });
}

/*
  l10n
  license: The MIT License, Copyright (c) 2016-2019 YUKI "Piro" Hiroshi
  original: http://github.com/piroor/webextensions-lib-l10n
*/
const l10n = {
  updateString(string) {
    return string.replace(/__MSG_([@\w]+)__/g, (matched, key) => {
      return chrome.i18n.getMessage(key) || matched;
    });
  },

  $log(message, ...args) {
    message = `l10s: ${message}`;
    if (typeof window.log === 'function')
      log(message, ...args);
    else
      console.log(message, ...args);
  },

  updateSubtree(node) {
    const texts = document.evaluate(
      'descendant::text()[contains(self::text(), "__MSG_")]',
      node,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (let i = 0, maxi = texts.snapshotLength; i < maxi; i++) {
      const text = texts.snapshotItem(i);
      text.nodeValue = this.updateString(text.nodeValue);
    }

    const attributes = document.evaluate(
      'descendant::*/attribute::*[contains(., "__MSG_")]',
      node,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (let i = 0, maxi = attributes.snapshotLength; i < maxi; i++) {
      const attribute = attributes.snapshotItem(i);
      this.$log('apply', attribute);
      attribute.value = this.updateString(attribute.value);
    }
  },

  updateDocument() {
    this.updateSubtree(document);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  l10n.updateDocument();
  restoreOptions();
});

document.querySelectorAll('input, select').forEach(elem => {
  elem.addEventListener("change", e => saveOptions(e));
});

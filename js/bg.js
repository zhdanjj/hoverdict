var API_KEY = 'dict.1.1.20141016T192728Z.09188df21d2c7744.34e10163a71f9f5fb431051d89c25c6cd609af60';

var cache = {
  get: function (word) {

  }
}

function getWordTranslation(options, callback) {
  var word = options.word

  if (typeof cache[word] !== 'undefined') {
    callback(cache[word])
    return
  }

  var url = 'https://dictionary.yandex.net/api/' +
            'v1/dicservice.json/lookup?' +
            'key=' + API_KEY +
            '&lang=en-ru&ui=ru&text=' + word;
  fetch(url)
   .then((response) => {
     return response.json()
   })
   .then((json) => {
     cache[word] = json
     console.log(json)
     callback(json)
   })
}

function getConfig(options, callback) {
  chrome.storage.sync.get('config', function (items) {
    callback(items)
  })
}

function setConfig(options, callback) {
  chrome.storage.sync.set({config: options}, function () {
    callback()
  })
}

chrome.runtime.onMessage.addListener(function(message, sender, callback){

  function route(action, func) {
    if (message.action === action) {
      console.log(action)
      func(message.options, callback)
    }
  }

  route('translate.get', getWordTranslation)
  route('config.get',    getConfig)
  route('config.set',    setConfig)

  // Make response async
  return true
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  getConfig(null, function (items) {
    chrome.tabs.query({}, function (result) {
      for (let tab of result) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'config.update',
          options: items
        })
      }
    })
  })
})


var API_KEY = 'dict.1.1.20141016T192728Z.09188df21d2c7744.34e10163a71f9f5fb431051d89c25c6cd609af60';

function getWordTranslation(word, callback) {
  var url = 'https://dictionary.yandex.net/api/' +
            'v1/dicservice.json/lookup?' +
            'key=' + API_KEY +
            '&lang=en-ru&ui=ru&text=' + word;
  fetch(url)
   .then((response) => {
     return response.json()
   })
   .then((json) => {
     callback(json)
   })
}

chrome.runtime.onMessage.addListener(function(message, sender, callback){
  if (message && message.word) {
    getWordTranslation(message.word, callback)
  }
  return true
});
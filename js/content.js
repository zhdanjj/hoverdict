function l(arg) {
  console.log.apply(console, arguments)
}

var cursor = {
  x: 0,
  y: 0,
  init: function () {
    document.addEventListener('mousemove', this.onMouseMove.bind(this))
  },
  onMouseMove: function (event) {
    this.x = event.clientX
    this.y = event.clientY
  }
}

var wordHighlight = {
  init: function () {
    this.element = document.createElement('div')
    this.element.className = 'hodi-highlight'
    document.body.appendChild(this.element)
    document.addEventListener('scroll', this.onWindowScroll.bind(this))
    document.addEventListener('click', this.onDocumentClick.bind(this))
  },
  show: function () {
    this.element.style.display = 'block'
    return this
  },
  hide: function () {
    this.element.style.display = 'none'
    return this
  },
  setRect: function (rect) {
    this.element.style.top = rect.top + 'px'
    this.element.style.left = rect.left + 'px'
    this.element.style.width = rect.width + 'px'
    this.element.style.height = rect.height + 'px'
    return this
  },
  onWindowScroll: function () {
    this.hide()
  },
  onDocumentClick: function () {
    this.hide()
  }
}

var popup = {
  html: '<div id="hodi-word"></div><hr id="hodi-line"><div id="hodi-preloader"></div><div id="hodi-translations"></div>',
  init: function () {
    this.box = document.createElement('div');
    this.box.id = 'hodi-box';
    this.box.innerHTML = this.html;
    document.body.appendChild(this.box);

    this.word = document.getElementById('hodi-word');

    this.preloader = document.getElementById('hodi-preloader');
    this.preloader
      .style
      .backgroundImage =
      'url("' + chrome.extension.getURL('img/preloader.gif') + '")';
    this.translations = document.getElementById('hodi-translations');

    window.addEventListener('scroll', this._onWindowScroll.bind(this))
    document.addEventListener('click', this._onDocumentClick.bind(this))

  },
  hide: function () {
    this.box.classList.remove('visible')
    return this
  },
  show: function (x, y) {
    var offsetX = this._getOverflowOffsetX(x)
    this.box.style.left = x + 10 - (offsetX > 0 ? offsetX + 40 : 0) + 'px';
    this.box.style.top = y + 10 + window.pageYOffset + 'px';
    this.box.classList.add('visible')
    return this
  },
  setTitle: function (word) {
    this.word.textContent = word.toLowerCase()
    return this
  },
  setContent: function (markup) {
    this.translations.innerHTML = ''
    this.translations.appendChild(markup)
    return this
  },
  enablePreloader: function () {
    this.preloader.style.display = 'block'
    this.translations.style.display = 'none'
    return this
  },
  disablePreloader: function () {
    this.preloader.style.display = 'none'
    this.translations.style.display = 'block'
    return this
  },
  _onWindowScroll: function () {
    this.hide()
  },
  _onDocumentClick: function (event) {
    if (event.target !== this.box || !this.box.contains(event.target)) {
      this.hide()
    }
  },
  _getOverflowOffsetX: function (x) {
    return this.box.offsetWidth + x - window.innerWidth
  },
}

var selection = {
  isTextSelected: false,
  init: function () {
    document.addEventListener('mouseup', this.onMouseUp.bind(this))
  },
  onMouseUp: function () {
    var text = getSelection().toString()

    this.isTextSelected = text.length > 0 ? true : false
  }
}

var api = {
  getTranslationFor: function (word) {
    return new Promise(function (resolve) {
      chrome.runtime.sendMessage({word: word}, null, resolve)
    })

    // setTimeout(function () {
    //   callback({def: []})
    // }, 500)
  },
  createMarkupFrom: function (json) {
    //структура описана здесь
    //https://tech.yandex.ru/dictionary/doc/dg/reference/lookup-docpage/

    var markup = document.createElement('div')

    var defs = json['def'];
    for (var i = 0; i < defs.length; i++) {
      var def = document.createElement('div');
      var trs = [];
      for (var j = 0; j < defs[i]['tr'].length; j++) {
        trs.push(defs[i]['tr'][j]['text']);
      }
      def.innerText = trs.join(', ');

      var pos = document.createElement('span');
      pos.className = 'hodi-pos';
      pos.innerText = ' ' + defs[i]['pos'];
      def.appendChild(pos);
      markup.appendChild(def);
    }

    if (!defs.length) {
      var div = document.createElement('div')
      div.textContent = 'There\'s no translation for this word'
      markup.appendChild(div)
    }

    return markup
  }
}

var app = {
  init: function () {
    cursor.init()
    wordHighlight.init()
    popup.init()
    selection.init()

    document.addEventListener('keydown', this.onKeyDown.bind(this))
  },
  getWordUnderCursor: function () {
    var el = document.elementFromPoint(cursor.x, cursor.y)

    for (var i = 0; i < el.childNodes.length; i++) {
      var currentTextNode = el.childNodes[i]

      if (currentTextNode.nodeType !== 3) { // TEXT_NODE
        continue
      }

      var range = document.createRange()
      var word = null

      currentTextNode.textContent.replace(/\b\w+\b/g, function (match, offset) {
        range.setStart(currentTextNode, offset)
        range.setEnd(currentTextNode, offset + match.length)

        var r = range.getBoundingClientRect()

        var horizontal = r.left <= cursor.x && r.right >= cursor.x
        var vertical = r.top <= cursor.y && r.bottom >= cursor.y

        if (horizontal && vertical) {
          word = {
            value: range.toString(),
            rect: r
          }
        }

      })

      range.detach()

      if (word) {
        return word
      }
    }
  },
  onKeyDown: function (event) {
    // TODO: тип нажатой кнопки должен браться из настроек
    if (event.key === 'Alt') {
      var selection = getSelection().toString()

      if (selection) {
        this.handleSelection()
      } else {
        this.handlePopup()
      }
    }
  },
  handlePopup: function () {
    var word = this.getWordUnderCursor()

    if (!word) {
      return
    }

    wordHighlight
      .setRect(word.rect)
      .show()

    popup
      .hide()
      .enablePreloader()
      .setTitle(word.value)
      .show(cursor.x, cursor.y)

    this.makeRequest(word.value)
  },
  handleSelection: function () {
    var range = getSelection().getRangeAt(0)
    var word = range.toString()
    var r = range.getBoundingClientRect()
    popup
      .hide()
      .enablePreloader()
      .setTitle(word)
      .show(r.right, r.bottom)

    this.makeRequest(word)
  },
  makeRequest: function (word) {
    api.getTranslationFor(word)
      .then(function (json) {
          var markup = api.createMarkupFrom(json)
          popup
            .setContent(markup)
            .disablePreloader()
      })
  }
}

document.addEventListener('DOMContentLoaded', function () {
  app.init()
})

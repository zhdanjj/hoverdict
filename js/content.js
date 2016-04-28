function getWordAtPoint(elem, x, y) {
    var range;
    if (elem.nodeType == elem.TEXT_NODE) {
        range          = elem.ownerDocument.createRange();
        range.selectNodeContents(elem);
        var currentPos = 0;
        var endPos     = range.endOffset;
        while (currentPos + 1 < endPos) {
            range.setStart(elem, currentPos);
            range.setEnd(elem, currentPos + 1);
            if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x &&
                range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
                range.expand("word");
                var ret = range.toString();
                range.detach();
                return (ret);
            }
            currentPos += 1;
        }
    }
    else {
        for (var i = 0; i < elem.childNodes.length; i++) {
            range = elem.childNodes[i].ownerDocument.createRange();
            range.selectNodeContents(elem.childNodes[i]);
            if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x &&
                range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
                range.detach();
                return (getWordAtPoint(elem.childNodes[i], x, y));
            }
            else {
                range.detach();
            }
        }
    }
    return (null);
}
var API_KEY = 'dict.1.1.20141016T192728Z.09188df21d2c7744.34e10163a71f9f5fb431051d89c25c6cd609af60';
var content =
        '<div id="hodi-word"></div>' +
        '<hr  id="hodi-line">' +
        '<div id="hodi-preloader"></div>' +
        '<div  id="hodi-translations"></div>';
var popup   = {
    init       : function () {
        this.box             = document.createElement('div');
        this.box.style.display   = 'none';
        this.box.id          = 'hodi-box';
        this.box.innerHTML   = content;
        document.body.appendChild(this.box);
        this.word            = document.getElementById('hodi-word');
        this.preloader       = document.getElementById('hodi-preloader');
        this.preloader
            .style
            .backgroundImage =
            'url("' + chrome.extension.getURL('img/preloader.gif') + '")';
        this.translations    = document.getElementById('hodi-translations');

        document.addEventListener('mousemove', function (e) {
            x       = e.clientX;
            y       = e.clientY;
            var pos = popup.getPosition();
            //скрываем окошко когда мышь уходит
            if (!popup.isHidden()) {
                if (Math.abs(x + 10 - pos.x) > 20
                    || Math.abs(y + 10 - (pos.y - window.pageYOffset)) > 20) {
                    popup.hide();
                }
            }
        });

        document.addEventListener('keyup', function (e) {
            if (e.which === 16) { //Shift key
                var word = getWordAtPoint(document.elementFromPoint(x, y), x, y);
                if (word !== null) {
                    popup.show(x, y, word);
                }
            }
        });
    },
    isHidden   : function () {
        return this.box.style.display === 'none';
    },
    hide       : function () {
        this.box.style.display = 'none';
    },
    show       : function (x, y, word) {
        this.box.style.left             = x + 10 + 'px';
        this.box.style.top              = y + 10 + window.pageYOffset + 'px';
        this.box.style.display          = 'block';
        this.word.innerText             = word;
        this.preloader.style.display    = 'block';
        this.translations.style.display = 'none';
        this.translations.innerHTML     = '';

        var request                = new XMLHttpRequest();
        var url                    = 'https://dictionary.yandex.net/api/' +
                                     'v1/dicservice.json/lookup?' +
                                     'key=' + API_KEY +
                                     '&lang=en-ru&ui=ru&text=' + word;
        request.open('get', url, true);
        request.onreadystatechange = function () {
            //структура описана здесь
            //https://tech.yandex.ru/dictionary/doc/dg/reference/lookup-docpage/
            if (request.readyState !== 4) {
                return;
            }
            var objAnswer = JSON.parse(request.responseText);
            var defs      = objAnswer['def'];
            for (var i = 0; i < defs.length; i++) {
                var def = document.createElement('div');
                var trs = [];
                for (var j = 0; j < defs[i]['tr'].length; j++) {
                    trs.push(defs[i]['tr'][j]['text']);
                }
                def.innerText = trs.join(', ');

                var pos       = document.createElement('span');
                pos.className = 'hodi-pos';
                pos.innerText = ' ' + defs[i]['pos'];
                def.appendChild(pos);
                popup.translations.appendChild(def);
            }
            if (!defs.length) {
                popup.translations.innerText = 'По этому слову ничего нет.';
            }
            popup.preloader.style.display    = 'none';
            popup.translations.style.display = 'block';
        };
        request.send(null);
    },
    /**
     *
     * @returns {{x: number, y: number}}
     */
    getPosition: function () {
        return {
            x: Number(this.box.style.left.replace('px', '')),
            y: Number(this.box.style.top.replace('px', ''))
        }
    }
};

window.addEventListener('load', function () {
    console.log('Window is loaded.');
    popup.init();
});

var x, y;

chrome.runtime.sendMessage({});
console.log('HoverDict injected.');
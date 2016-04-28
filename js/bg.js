chrome.runtime.onMessage.addListener(function(message, sender, callback){
    chrome.tabs.query({}, function(tabs) {
        for (var i=0; i<tabs.length; i++) {
            chrome.pageAction.show(tabs[i].id);
        }
    });
});
function getConfigObject() {
  var form = document.getElementById('config')
  var obj = {}

  for (let i of form.elements) {
    if (i.type === 'checkbox') {
      obj[i.name] = i.checked
    } else {
      obj[i.name] = i.value
    }
  }

  return obj

}

function setConfigObject(object) {
  var form = document.getElementById('config')

  for (let key of Object.keys(object.config)) {
    if (form[key].type === 'checkbox') {
      form[key].checked = object.config[key]
    } else {
      form[key].value = object.config[key]
    }
  }
}

var form = document.getElementById('config')

form.addEventListener('change', function () {
  chrome.runtime.sendMessage({
    action: 'config.set',
    options: getConfigObject()
  }, null, function () {})
})

document.addEventListener('DOMContentLoaded', function () {
  chrome.runtime.sendMessage({
    action: 'config.get'
  }, null, setConfigObject)
})


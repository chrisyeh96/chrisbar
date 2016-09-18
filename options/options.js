function saveOptions(key, value) {
  value = value.trim();
  if (value.length != 0) {
    options = {};
    options[key] = value;
    chrome.storage.local.set(options);
  } else {
    chrome.storage.local.remove(key);
  }
}

function restoreOptions() {
  var savedOptions = ["zipCode", "newTab", "screenshot"];
  chrome.storage.local.get(savedOptions, function(result) {
    // zip code
    var zipCode = result.zipCode;
    if (!zipCode) zipCode = "";
    document.querySelector("#zipCode").value = zipCode;

    // new tab
    var newTab = result.newTab;
    if (!newTab) newTab = "stay";
    var newTabButtons = document.querySelectorAll("input[name='newTab']");
    for (var button of newTabButtons) {
      button.checked = (button.value == newTab);
    }

    // screenshot
    var screenshot = result.screenshot;
    if (!screenshot) screenshot = "copy";
    var screenshotButtons = document.querySelectorAll("input[name='screenshot']");
    for (var button of screenshotButtons) {
      button.checked = (button.value == screenshot);
    }
  })
}

document.addEventListener("DOMContentLoaded", restoreOptions);

// add listeners for changes in options
var allInputs = document.querySelectorAll("input");
for (var input of allInputs) {
  input.onchange = function(event) {
    saveOptions(this.name, this.value);
  }
}
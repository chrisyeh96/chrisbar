function copyText() {
  var selection = window.getSelection().toString();
  selection = selection.trim();

  // create <textarea> element and put the selected text into it
  var textArea = document.createElement("textarea");
  textArea.value = selection;
  textArea.contentEditable = "true";
  document.body.appendChild(textArea);

  // select the text
  textArea.select();

  // remove formatting
  document.execCommand("removeFormat");

  // try to copy the text from the <textarea>
  var successful = document.execCommand("copy");
  if (!successful) {
    console.log("chrisbar: Unable to copy selected text.");
  }

  document.body.removeChild(textArea);
}

// define a handler
function handleKeyUp(event) {
  // check for Ctrl-Alt-C
  if (event.ctrlKey && event.altKey && event.key == "c") {
    copyText();
  }
}

// register the keyboard shortcut handler
document.addEventListener('keyup', handleKeyUp, false);

// set up message listener
function handleMessage(request, sender, sendResponse) {
  switch (request.method) {
    case "copy-as-plain-text":
      copyText();
      break;
  }
}

chrome.runtime.onMessage.addListener(handleMessage);
// only enable context menu on Google Chrome,
// until Firefox supports document.execCommand("copy") in background scripts
var isFirefox = typeof InstallTrigger !== 'undefined';

if (!isFirefox) {
  var copyText = function(info) {
    var selection = info.selectionText;
    if (selection) {
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
  };

  // create the context menu
  chrome.contextMenus.create({
    title: "Copy as plain text",
    contexts: ["selection"],
    onclick: copyText
  });
}
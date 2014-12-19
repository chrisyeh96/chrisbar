var chrisbarobj = {

prefs: null,

/**********
* startup() runs when the browser opens.
**********/
startup: function()
{
	// Get handle to Mozilla preferences service
	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.chrisbar.");
	this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
	
	// Add observer to "listen" for preference changes
	this.prefs.addObserver("", this, false);
	
	// Add listener to run contextPopUp() when contextMenu shows
	var contextMenu = document.getElementById("contentAreaContextMenu");
	if (contextMenu)
		contextMenu.addEventListener("popupshowing", this.contextPopUp, false);
	
	// update preferences
	this.updateToolbar();
},

shutdown: function()
{
	this.prefs.removeObserver("", this);
},

/**********
* observe() runs updateToolbar() when a preference is changed.
**********/
observe: function(subject, topic, data)
{
	if (topic = "nsPref:changed")
		this.updateToolbar();
},

updateToolbar: function()
{
	// Check for the toolbar mode
	var toolbarElem = document.getElementById("chrisbar-toolbar");
	toolbarElem.setAttribute("mode", this.prefs.getCharPref("display-mode"));
	
	// Check for which buttons should be displayed
	var buttons = ["gmail","maps","youtube","trans","cnet","dict","weather","tools"];
	
	for (var i=0; i<8; i++) {
		// Get the toolbar element
		var elem = document.getElementById("chrisbar-"+buttons[i]+"-Button");
		
		// Check to see if button should be displayed or not
		elem.hidden = !this.prefs.getBoolPref("show-"+buttons[i]);
	}
},

/**********
* ConvertTermsToURI() converts a string of search terms to a safe value
* for passing into a URL.
**********/
ConvertTermsToURI: function(terms)
{
	// Split the search term string at each whitespace 
	// and store it into an array
	termArray = terms.split(" ");
	
	// Create a variable to hold our resulting URI-safe value
	var result = "";
	
	// Loop through the search terms
	for(var i=0; i<termArray.length; i++) {
		// Separate all search terms with a '+'
		if(i > 0)
			result += "+";
		
		// Encode each search term using native javascript function
		result += encodeURIComponent(termArray[i]);
	}
	
	return result;
},

/**********
* KeyHandler() does a web search if the pressed key was [Enter].
**********/
KeyHandler: function(type, event)
{
	if (event.keyCode == event.DOM_VK_RETURN)
		this.Search(type, event);
},

/**********
* LoadURL() loads the specified URL in the browser according to both
* the event and also the preference newTab-setting.
**********/
LoadURL: function(url, event)
{
	if (event.ctrlKey) {// If [CTRL] was pressed
		event = new Object();
		event.button = 1; // treat the command like a middle-click
	}
	
	switch(event.button)
	{
	case 1: // Middle-click or [CTRL] was pressed
		if (this.prefs.getIntPref("newTab-setting") == 0)
			gBrowser.addTab(url); // load url in new tab, but stay in current tab
		else
			gBrowser.selectedTab = gBrowser.addTab(url); // add tab, then make active
		break;
	case 2: // Right click
		break; // do nothing
	default: // Left (Regular) click, or [ENTER] key
		// Set the browser window's location to the incoming URL and get focus
		window.content.document.location = url;
		window.content.focus();
		break;
	}
},

/**********
* Search() performs a search based on the specified type.
**********/
Search: function(type, event)
{
	var URL = ""; // Holds the URL we will browse to
	
	// Get a handle to our search terms box (the <menulist> element)
	var searchBox = ', ';
	
	// Get value of search terms box and trim whitespace using TrimString()
	var searchTerms = this.TrimString(searchBox.value);
	
  var isEmpty = (searchTerms.length == 0); // Tells whether search box is empty or not
  
	// If the search box is not empty, convert the terms to a URL-safe string.
	if(!isEmpty) {
    this.Populate(searchTerms);
		searchTerms = this.ConvertTermsToURI(searchTerms);
	}
	
	var Google = "http://www.google.com/";
	
	// store highlighted / selected text in a variable
	var selText = document.commandDispatcher.focusedWindow.getSelection();
	
	// Switch on the incoming type value. If the search box is empty,
	// redirect the user to the appropriate web site. Otherwise,
	// search for whatever they entered.
	
	switch(type) // Create URL for each type of search
	{
	case "web": // Google Search
	default:
		if(isEmpty) { URL = Google; }
		else		{ URL = Google + "search?q=" + searchTerms; }
		break;
	
	case "sageek": // Sageek Search
		var sageek = "http://theabsurdnerd.webs.com/";
		if(isEmpty) { URL = sageek; }
		else		{ URL = Google + "search?q=site:" + sageek + " " + searchTerms; }
		break;
	
	case "site": // Site search
		var site = this.getUpUrl(content.document.location.href);
		if(isEmpty) { URL = Google + "search?q=site:" + site; }
		else		{ URL = Google + "search?q=site:" + site + " " + searchTerms; }
		break;
  
	case "book": // Google Books
		if(isEmpty) { URL = "http://books.google.com/"; }
		else		{ URL = Google + "books?q=" + searchTerms; }
		break;
  
  case "drive": // Google Drive
		if(isEmpty) { URL = Google + "drive"; } 
		else		{ URL = "https://drive.google.com/drive/#search?q=" + searchTerms; }
		break;
    
	case "image": // Google Images
		if(isEmpty) { URL = Google + "images"; }
		else		{ URL = Google + "images?q=" + searchTerms; }
		break;
	
	case "news": // Google News
		if(isEmpty) { URL = Google + "news"; }
		else		{ URL = Google + "news?q=" + searchTerms; }
		break;
	
	case "patent": // Google Patents
		if(isEmpty) { URL = Google + "patents"; }
		else		{ URL = Google + "patents?q=" + searchTerms; }
		break;
	
	case "scholar": // Google Scholar
		if(isEmpty) { URL = Google + "scholar"; }
		else		{ URL = Google + "scholar?q=" + searchTerms; }
		break;
  
  case "shop": // Google Shopping
		if(isEmpty) { URL = Google + "shopping"; }
		else		{ URL = Google + "search?tbm=shop&q=" + searchTerms; }
		break;
  
	case "video": // Google Videos
		if(isEmpty) { URL = Google + "video"; }
		else		{ URL = Google + "search?tbm=vid&q=" + searchTerms; }
		break;
	
	case "gmail": // Gmail
		if(isEmpty) { URL = Google + "mail"; }
		else		{ URL = "https://mail.google.com/mail/u/0/#search/" + searchTerms; }
		break;
	
	case "map": // Google Maps
		if(isEmpty) { URL = Google + "maps"; }
		else		{ URL = Google + "maps?q=" + searchTerms; }
		break;
	
	case "youtube": // YouTube
		if(isEmpty) { URL = "http://www.youtube.com/"; }
		else		{ URL = "http://www.youtube.com/results?search_query=" + searchTerms; }
		break;
	
	case "trans": // Google Translate
		if(isEmpty) { URL = Google + "translate"; }
		else		{ URL = "http://translate.google.com/?q=" + searchTerms; }
		break;

	case "cnet": // CNET
		if(isEmpty) { URL = "http://www.cnet.com/"; }
		else		{ URL = "http://www.cnet.com/search/?query=" + searchTerms; }
		break;
	
	case "dict": // Dictionary
		if(isEmpty) { URL = "http://dictionary.reference.com/browse/" + selText; }
		else		{ URL = "http://dictionary.reference.com/browse/" + searchTerms; }
		break;
	
	case "thes": // Thesaurus
		if(isEmpty) { URL = "http://thesaurus.com/browse/" + selText; }
		else		{ URL = "http://thesaurus.com/browse/" + searchTerms; }
		break;
	
	case "weather": // Weather
		var searchURL = "http://www.weather.com/weather/today/l/";
		if(isEmpty) {
      var defLoc = this.prefs.getCharPref("weather-location"); // get default location
      if (defLoc) // default location exists -> search it up on weather.com
				URL = searchURL + defLoc;
			else // no default location -> go to weather.com homepage
				URL = "http://www.weather.com/";
		}
		else		{ URL = searchURL + searchTerms; }
		break;
	}
	
	this.LoadURL(URL, event); // Load the URL
	
	// Clear the search box
	searchBox.value = "";
},

/**********
* Middle() helps deal with middle-clicks.
**********/
Middle: function(event, actionType, data)
{
	if (event.button == 1) { // Middle-click
		// Close all menupopups
		var elems = document.getElementsByTagName("menupopup");
		for (var i=0; i<elems.length; i++)
			elems[i].hidePopup();
		
		switch(actionType) {
      case "search":
        this.Search(data, event); break;
      case "url":
        this.LoadURL(data, event); break;
      case "tool":
        this.Tools(data, event); break;
		}
	}
},

/**********
* TrimString() trims leading and trailing whitespaces from the incoming
* string, converts runs of more than one whitespace into a single
* whitespace, and returns the new string.
**********/
TrimString: function(string)
{
	// If incoming string is invalid, or nothing was passed in, return empty
	if (!string)
		return "";
	
	string = string.replace(/^\s+/, ''); // Remove leading whitespace
	string = string.replace(/\s+$/, ''); // Remove trailing whitespace
	
	// Replace whitespace runs with a single space
	string = string.replace(/\s+/g, ' ');
	
	return string; // Return the trimmed string
},

/**********
* Populate() manages the search history in the search box drop-down menu.
**********/
Populate: function(terms)
{
	// Get the menupopup element
	var menu = document.getElementById("chrisbar-SearchBoxMenu");
	menu.hidden = false; // Make the menupopup visible
	
	topItem = menu.childNodes.item(0);
	
	if (topItem.label != terms) {
		for(var i=9; i>0; i--) {
			var iMinusOne = menu.childNodes.item(i-1);
			if (iMinusOne.label.length != 0) {
				var item = menu.childNodes.item(i);
				item.label = iMinusOne.label;
				item.hidden = false;
			}
		}
		
		topItem.label = terms; // Set the new menuitem's label
		topItem.hidden = false; // Make the new menuitem visible
	}
},

/**********
* Up() moves to one folder higher in the web site directory.
**********/
Up: function(e)
{
	const loc = content.document.location, pro = loc.protocol;
	if(!/^ftp|http|https$/.test(pro)) return;
	const up = this.getUpUrl(loc.href);
	if(up) this.LoadURL(up, e);
},

/**********
* getUpUrl() helps the Up() function.
**********/
getUpUrl: function(url)
{
	var matches, origUrl = url;
	// trim filename (this makes subdriectory digging easier)
	matches = url.match(/(^.*\/)(.*)/);
	if(!matches) return null; //only fails when the "url" has no /'s
	url = matches[1];
	if(url!=origUrl && !/(index|main)\.(php3?|html?)/i.test(url))
		return url;
	// dig through subdirs
	matches = url.match(/^([^\/]*?:\/\/.*\/)[^\/]+?\//);
	if(matches) return matches[1];
	// we've reach (ht|f)tp://foo.com/, climb up through subdomains
	// split into protocol and domain
	matches = url.match(/([^:]*:\/\/)?(.*)/);
	var protocol = matches[1], domain = matches[2];
	matches = domain.match(/^[^\.]*\.(.*)/);
	if(matches) return (protocol+matches[1]);
	return null;
},

/**********
* Tools() runs the specified command.
**********/
Tools: function(type, event)
{
	var URL = "";
	
	// get URL of current website
	var currentURL = window.content.document.location;
	
	switch(type) { // Create URL for each type of tool
    case "scan": // URLVoid Scanner
      var hostURL = currentURL.hostname; // www.example.com/text/... -> www.example.com
      if (hostURL.indexOf("www.") == 0) hostURL = hostURL.substr(4); // remove 'www.' from URL
      URL = "http://www.urlvoid.com/scan/" + escape(hostURL);
      break;
    
    case "alarm": // Set Alarm
      var time = prompt("Please enter a valid time for the alarm:\n\n5 = 5 minutes\n1h3m2s = 1 hour, 3 minutes, and 2 seconds\n515pm = 5:15pm\nLeave blank for simple timer","");
      if (!time) break; // if user clicks on 'Cancel', do nothing
      URL = "http://cd.justinjc.com/" + time;
      break;
    
    case "cache": // Google Cache View
      URL = "http://webcache.googleusercontent.com/search?q=cache:" + currentURL;
      break;
	}
	
	if (URL) this.LoadURL(URL, event); // if URL is valid, load the URL
},

/**********
* Screenshot() takes a screenshot of the either the entire current webpage
* or just the visible area.
**********/
Screenshot: function(type)
{
	var win = window.content;
	var winDoc = win.document;
	
	// set screenshot dimensions
	var h = 0, w = 0, x = 0, y = 0;
	switch(type)
	{
	case 0: // entire page
		if (winDoc.compatMode == "CSS1Compat") { // if in Quirks Mode
			h = winDoc.documentElement.scrollHeight;
			w = winDoc.documentElement.scrollWidth;
		}
		else {
			h = winDoc.body.scrollHeight;
			w = winDoc.body.scrollWidth;
		}
		break;
	case 1: // visible area
		if (winDoc.compatMode == "CSS1Compat") { // if in Quirks Mode
			h = winDoc.documentElement.clientHeight;
			w = winDoc.documentElement.clientWidth;
		}
		else {
			h = winDoc.body.clientHeight;
			w = winDoc.body.clientWidth;
		}
		var x = win.scrollX;
		var y = win.scrollY;
		break;
	}
	
	// Firefox only supports an HTML canvas with width and height up to 8192 pixels
	// Scale the canvas size, if needed
	const MAX_DIM = 8192;
	var canvasW = w;
	var canvasH = h;
	if (w > MAX_DIM || h > MAX_DIM) {
		if (w > h) {
			canvasW = MAX_DIM;
			canvasH = canvasW * h / w;
		}
		else {
			canvasH = MAX_DIM;
			canvasW = canvasH * w / h;
		}
	}
	
	// Create a canvas element and draw the window contents onto it
	var canvas = document.createElementNS('http://www.w3.org/1999/xhtml','canvas');
	canvas.style.width = canvasW+"px";
	canvas.style.height = canvasH+"px";
	canvas.width = canvasW;
	canvas.height = canvasH;
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvasW, canvasH);
	ctx.save();
	ctx.scale(canvasW/w, canvasH/h);
	ctx.drawWindow(win, x, y, w, h, "rgb(255,255,255)");
	ctx.restore();
	
	data = canvas.toDataURL("image/png", "");
	
	// use preference to determine what to do with the screenshot
	action = this.prefs.getIntPref("screenshot-action");
	
	if (action == 0 || action == 2) { // Copy screenshot to clipboard
		// create image element to hold the screenshot
		var image = winDoc.createElement("img");
		image.setAttribute("style", "display: none");
		image.setAttribute("src", data);
		
		// append the image element to current document
		var body = winDoc.getElementsByTagName("html")[0];
		body.appendChild(image);
		
		// copy image onto the clipboard and remove the image element
		image.addEventListener("load",
			function(){
				document.popupNode = image;
				try { goDoCommand('cmd_copyImageContents'); }
				catch (ex) { alert(ex); }
				body.removeChild(image);
			}, false);
	}
	
	if (action == 1 || action == 2) { // Save screenshot to file
		// Get handle to the file save dialog
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		fp.init(window, "Save As", Components.interfaces.nsIFilePicker.modeSave);
		
		// build up default name of file
		var url = winDoc.domain;
		
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var day = date.getDate();
		var hours = date.getHours();
		var mins = date.getMinutes();
		var sec = date.getSeconds();
		
		if (month.length == 1)  month = "0" + month;
		if (day.length == 1)    day   = "0" + day;
		if (mins.length == 1)   mins  = "0" + mins;
		
		// default filename = "url year-month-day hours:mins:sec.png"
		fp.defaultString = url + " " + year + "-" + month + "-" + day + " " + hours + ":" + mins + ":" + sec + ".png";
		
		fp.appendFilter("PNG", "*.png"); // only show PNG files
		
		var result = fp.show();
		if (result == fp.returnOK || result == fp.returnReplace) {
			// get the path to the file
			var path = fp.file.path;
			
			// if file does not have ".png" at the end, add it
			if (path.substr(path.lastIndexOf(".")).toLowerCase() != ".png")
				path += ".png";
			
			file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(path);
			
			var io = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
			var source = io.newURI(data, "UTF8", null);
			var target = io.newFileURI(file);
			
			var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);
			
			persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
			persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
			
			var xfer = Components.classes["@mozilla.org/transfer;1"].createInstance(Components.interfaces.nsITransfer);
			xfer.init(source, target, "", null, null, null, persist, true);
			persist.progressListener = xfer;

			persist.savePrivacyAwareURI(source, null, null, null, null, file, true);
		}
	}
},

/**********
// ClearHistory() clears the search history and hides the drop-down menu.
**********/
ClearHistory: function()
{
	var menu = opener.document.getElementById("chrisbar-SearchBoxMenu");
	menu.hidden = true; // Hide the menupopup
	
	for (var i=0; i<10; i++) {
		// Hide each menuitem and clear its label
		var item = menu.childNodes.item(i);
		item.label = "";
		item.hidden = true;
	}
},

/**********
* openWin() opens a window based on type (either "about" or "options").
**********/
openWin: function(type)
{
	// open the window if it is not already open
	if (this._Window == null || this._Window.closed) {
		var features = "chrome,centerscreen,modal";
		this._Window = window.openDialog(
			"chrome://chrisbar/content/" + type + ".xul", "", features);
	}
	
	this._Window.focus();
},

/**********
* contextPopUp() runs when the context menu shows (see startup() function).
**********/	
contextPopUp: function()
{
	// only show "copy plain text" in the context menu if text is selected
	var copyplain = document.getElementById("chrisbar-context-copyplain");
	copyplain.hidden = !(gContextMenu.isTextSelected);
},

/**********
* editMenu_OnPopupShowing() enables / disables the copy plain text function
* based on whether text is selected.
**********/
editMenu_OnPopupShowing: function()
{
	try {
		// get highlighted / selected text
		var selText = document.commandDispatcher.focusedWindow.getSelection().toString();
		
		// disable copy plain text menu option if there is no selected text
    var edit_copyplain = document.getElementById('chrisbar-edit-copyplain');
		edit_copyplain.setAttribute("disabled", selText == null || selText.length == 0);
	} catch (ex) {
		alert("Copy Error: " + ex.message);
	}
},

/**********
* copyPlainText() removes formatting from the selected text and adds it to
* the clipboard.
**********/
copyPlainText: function()
{
	try {
		// get selected text
		var selText = document.commandDispatcher.focusedWindow.getSelection();
		
		// get handle to clipboard
		var clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
		
		// remove formatting from string, then add to clipboard
		clipboardHelper.copyString(this.TrimString(selText.toString()));
	} catch (ex) {
		alert("Copy Error: " + ex.message);
	}
}
};

window.addEventListener("load", function() { chrisbarobj.startup(); }, false);
window.addEventListener("unload", function() { chrisbarobj.shutdown(); }, false);
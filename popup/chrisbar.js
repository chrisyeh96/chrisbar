(function() {
  //////////////////////////////////////////////////
  // UTILITY FUNCTIONS
  //////////////////////////////////////////////////
  var utils = {
    getPreferenceForKey: function(key, resultHandler) {
      chrome.storage.local.get(key, function(result) {
        value = result[key];
        console.log(resultHandler);
        resultHandler(value);
      });
    },

    /* loadUrl
     * -------
     * loads the given url in the browser according to both the event and also the preference setNewTabActive
     */
    loadUrl: function(url, event) {
      if (event.ctrlKey) { // if [CTRL] was pressed
        event = { button: 1 }; // treat the command like a middle-click
      }

      switch(event.button) {
      case 1: // Middle-click or [CTRL] was pressed
        // open link in new tab, then optionally switch to it based on user preference
        utils.getPreferenceForKey("newTab", function(newTabSetting) {
          var switchToNewTab = (newTabSetting == "switch");
          console.log("Swith to new tab: " + switchToNewTab);
          chrome.tabs.create({url: url, active: switchToNewTab});
        });
        break;
      case 2: // Right click, do nothing
        break;
      default: // Left (Regular) click, or [ENTER] key
        // open link in current tab, get focus
        chrome.tabs.update({url: url, active: true});
      }

      // close the popup
      window.close();
    },

    /* trimString
     * ----------
     * trims leading and trailing whitespaces, squashes runs of more than one whitespace
     * into a single whitespace, and returns the new string
     */
    trimString: function(string) {
      // If incoming string is invalid, or nothing was passed in, return empty
      if (!string) return "";
      
      string = string.trim(); // remove leading and trailing whitespace
      string = string.replace(/\s+/g, ' '); // replace whitespace runs with a single space
      
      return string;
    },

    /* convertTermsToURI
     * -----------------
     * Escapes the given string into a URL-safe string
     */
    convertTermsToURI: function(terms) {
      // split the search term string at each whitespace and store it into an array
      var termArray = terms.split(" ");
      
      var result = "";
      for (var i=0; i<termArray.length; i++) {
        // Separate all search terms with a '+'
        if (i > 0)
          result += "+";
        
        // Encode each search term using native javascript function
        result += encodeURIComponent(termArray[i]);
      }
      
      return result;
    },

    /* getUpUrl
     * --------
     * Uses regex pattern matching to get the URL at one level up.
     */
    getUpUrl: function(url) {
      var matches, origUrl = url;
      // trim filename (this makes subdirectory digging easier)
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

    /* getCurrentUrl
     * -------------
     * Gets the URL of the active tab of the current window, and passes it asynchronously
     * as the only parameter to the given callback function.
     */
    getCurrentUrl: function(callback) {
      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        currentURL = tabs[0].url;
        callback(currentURL);
      });
    },

    /* getSelectedText
     * ---------------
     * Gets the selected (highlighted) text from the active tab of the current window,
     * and passes it asynchronously as the only parameter to the given callback function.
     */
    getSelectedText: function(callback) {
      chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
      }, function(result) {
        if (!result) result = "";

        // Firefox: result is a string
        // Google Chrome: result is an Array object
        if (typeof(result) == "object") {
          result = result[0]; // the selected text is the 1st element in the result array
        }
        callback(result);
      });
    }
  }

  //////////////////////////////////////////////////
  // SEARCH
  //////////////////////////////////////////////////
  // define search types
  var Google = "https://www.google.com/";
  var searchIcons = {
    "alarm" : {
      link: "http://cd.justinjc.com/",
      search: "http://cd.justinjc.com/"
    },
    "CNET" : {
      image: "cnet.png",
      link: "https://www.cnet.com/",
      search: "http://www.cnet.com/search/?query="
    },
    "Dictionary" : {
      image: "dict.png",
      link: "http://www.dictionary.com/",
      search: "http://www.dictionary.com/browse/"
    },
    "Gmail" : {
      image: "gmail.png",
      link: "https://mail.google.com/",
      search: "https://mail.google.com/mail/u/0/#search/"
    },
    "Google Books" : {
      image: "books.png",
      link: "https://books.google.com/",
      search: Google + "books?q="
    },
    "Google Calendar" : {
      image: "calendar.png",
      link: Google + "calendar",
      search: "https://calendar.google.com/calendar/render?q="
    },
    "Google Contacts" : {
      image: "contacts.png",
      link: Google + "contacts",
      search: "https://contacts.google.com/preview/search/"
    },
    "Google Drive" : {
      image: "drive.png",
      link: "https://drive.google.com/drive/u/0/my-drive",
      search: "https://drive.google.com/drive/#search?q="
    },
    "Google Images" : {
      image: "images.png",
      link: Google + "images",
      search: Google + "images?q="
    },
    "Google Keep" : {
      image: "keep.png",
      link: "https://keep.google.com/",
      search: "https://keep.google.com/#search/text="
    },
    "Google Maps" : {
      image: "maps.png",
      link: Google + "maps",
      search: Google + "maps?q="
    },
    "Google News" : {
      image: "news.png",
      link: Google + "news",
      search: Google + "news?q="
    },
    "Google Patents" : {
      image: "patents.png",
      link: Google + "patents",
      search: Google + "patents?q="
    },
    "Google Scholar" : {
      image: "scholar.png",
      link: Google + "scholar",
      search: Google + "scholar?q="
    },
    "Google Shopping" : {
      image: "shop.png",
      link: Google + "shopping",
      search: Google + "shopping?q="
    },
    "Google Translate" : {
      image: "translate.png",
      link: "https://translate.google.com/",  
      search: "https://translate.google.com/?q="
    },
    "Google Videos" : {
      image: "videos.png",
      link: Google + "video",
      search: Google + "search?tbm=vid&q="
    },
    "Site Search" : {
      image: "site.png",
      link: Google + "search?q=",
      search: Google + "search?q=",
      specialFunction: function(url, searchTerms, urlLoader) {
        utils.getCurrentUrl(function(currentUrl) {
          var finalUrl = url + " site:" + utils.getUpUrl(currentURL);
          urlLoader(finalUrl);
        })
      }
    },
    "Thesaurus" : {
      image: "thes.png",
      link: "http://www.thesaurus.com/",
      search: "http://www.thesaurus.com/browse/"
    },
    "Weather" : {
      image: "weather.png",
      link: "https://weather.com/",
      search: "https://weather.com/weather/today/l/",
      specialFunction: function(url, searchTerms, urlLoader) {
        if (searchTerms) { // url is search
          urlLoader(url);
        } else { // url is link
          utils.getPreferenceForKey("zipCode", function(zipCode) {
            urlLoader(zipCode ? "https://weather.com/weather/today/l/" + zipCode : url);
          });
        }
      }
    },
    "Web" : {
      image: "google.png",
      link: Google,
      search: Google + "search?q="
    },
    "YouTube" : {
      image: "youtube.png",
      link: "https://www.youtube.com/",
      search: "https://www.youtube.com/results?search_query="
    }
  };

  // define search icon ordering
  var spacer = "CHRISBAR_SPACER";
  var searchIconsOrder = [
    "Gmail", // row 1
    "Google Maps",
    "YouTube",
    "Google Translate",
    spacer, // row 2
    "Google Calendar", // row 3
    "Google Contacts",
    "Google Drive",
    "Google Keep",
    "Google Images", // row 4
    "Google Videos",
    "Google Books",
    "Google Shopping",
    "Google News", // row 5
    "Google Patents",
    "Google Scholar",
    spacer, // row 6
    "CNET", // row 7
    "Dictionary",
    "Thesaurus",
    "Weather"
  ];

  function performSearchHelper(searchTerms, type, event) {
    var icon = searchIcons[type];
    var url = "";
    if (searchTerms.length > 0) {
      // convert search terms to a URL-safe string
      searchInput.value = searchTerms;
      searchTerms = utils.convertTermsToURI(searchTerms);
      url = icon.search + searchTerms;
    } else {
      url = icon.link;
    }

    if (icon.specialFunction) {
      icon.specialFunction(url, searchTerms, function(finalUrl) {
        utils.loadUrl(finalUrl, event);
      });
    } else {
      utils.loadUrl(url, event);
    }
  }

  /* performSearch
   * -------------
   * Performs a search based on the specified type (string) and event.
   */
  function performSearch(type, event) {
    console.log("Type: " + type);
    console.log("searchTerms: '" + searchInput.value + "'");

    // get value of search terms box and trim whitespace
    var searchTerms = utils.trimString(searchInput.value);
    
    // if there's nothing in the search box, then try getting highlighted / selected text
    if (searchTerms.length == 0) {
      utils.getSelectedText(function(selection) {
        searchTerms = utils.trimString(selection);
        performSearchHelper(searchTerms, type, event);
      });
    } else {
      performSearchHelper(searchTerms, type, event);
    }
  }

  // set up main search button
  var searchButton = document.getElementById("chrisbar-search-button");
  searchButton.src = "icons/" + searchIcons["Web"].image;
  searchButton.onclick = function(event) {
    performSearch("Web", event);
  }

  // set up site search button
  var siteSearchButton = document.getElementById("chrisbar-site-search-button");
  siteSearchButton.src = "icons/" + searchIcons["Site Search"].image;
  siteSearchButton.onclick = function(event) {
    performSearch("Site Search", event);
  }

  // set up search input handling
  var searchInput = document.getElementById("chrisbar-search-input");
  searchInput.onKeyPress = function(event) {
    if (event.keyCode == event.DOM_VK_RETURN) {
      type = "Web";
      performSearch(type, event);
    }
  }

  function generateSearchFunction(type, event) {
    return function(event) {
      performSearch(type, event);
    }
  }

  // display all of the search icons
  var searchIconsDiv = document.getElementById("chrisbar-search-icons");
  for (var i=0; i<searchIconsOrder.length; i++) {
    var type = searchIconsOrder[i];
    if (type == spacer) {
      var elem = document.createElement("div");
      elem.classList.add("chrisbar-icon-spacer");
    } else {
      var elem = document.createElement("img");
      elem.src = "icons/" + searchIcons[type].image;
      elem.onclick = generateSearchFunction(type);
      elem.classList.add("row-element");
    }
    searchIconsDiv.appendChild(elem);
  }

  //////////////////////////////////////////////////
  // TOOLS
  //////////////////////////////////////////////////
  function loadCurrentUrl(urlHandler) {
    return function(event) {
      utils.getCurrentUrl(function(currentUrl) {
        var finalUrl = urlHandler(currentUrl);
        utils.loadUrl(finalUrl, event);
      });
    }
  }

  function Screenshot() {
    chrome.tabs.captureVisibleTab(null, {format: "png"}, function(imageUri) {
      var image = new Image();
      image.onload = function() {
        // create a canvas and draw the image onto it
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0);

        // create a link for downloading the image
        var link = document.createElement('a');
        link.download = "screenshot.png";
        link.href = canvas.toDataURL();

        // programmatically click on that link to begin the download
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        link.dispatchEvent(event);
      };
      image.src = imageUri; 
    });
  }

  var tools = {
    "Scan Webpage" : {
      image: "urlvoid.png",
      command: loadCurrentUrl(function(currentUrl) {
        var getUrlHostname = function(url) {
            var a = document.createElement("a");
            a.href = url;
            return a.hostname;
        };

        var hostname = getUrlHostname(currentUrl); // www.example.com/text/... -> www.example.com
        if (hostname.indexOf("www.") == 0) hostname = hostname.substr(4); // remove 'www.' from URL
        return "http://www.urlvoid.com/scan/" + escape(hostname);
      })
    },
    "Screenshot Visible Page" : {
      image: "grab_visible.png",
      command: Screenshot
    },
    "Set Alarm" : {
      image: "alarm.png",
      tooltip: "Valid inputs:\n\n5 = 5 minutes\n1h3m2s = 1 hour, 3 minutes, and 2 seconds\n515pm = 5:15pm\nLeave blank for simple timer",
      command: function(event) {
        performSearch("alarm", event);
      }
    },
    "Translate Webpage" : {
      image: "translate.png",
      command: loadCurrentUrl(function(currentUrl) {
        return "http://translate.google.com/translate?u=" + currentUrl;
      })
    },
    "Up" : {
      image: "up.png",
      command: loadCurrentUrl(function(currentUrl) {
        return utils.getUpUrl(currentUrl);
      })
    },
    "View Page in Google Cache" : {
      image: "site.png",
      command: loadCurrentUrl(function(currentUrl) {
        return "http://webcache.googleusercontent.com/search?q=cache:" + currentUrl;
      })
    }
  };

  var toolsOrder = [
    "Scan Webpage",
    "Screenshot Visible Page",
    "Set Alarm",
    "Translate Webpage",
    "Up",
    "View Page in Google Cache"
  ];

  var toolsDiv = document.getElementById("chrisbar-tools");
  for (var i=0; i<toolsOrder.length; i++) {
    var type = toolsOrder[i];
    var tool = tools[type];

    var img = document.createElement("img");
    img.src = "icons/" + tool.image;
    img.classList.add("row-element");

    var text = document.createElement("span");
    text.innerHTML = type;

    var row = document.createElement("div");
    row.onclick = tool.command;
    row.classList.add("chrisbar-tool");
    row.appendChild(img);
    row.appendChild(text);

    if (tool.tooltip) {
      row.title = tool.tooltip;
    }

    toolsDiv.appendChild(row);
  }

  // Hack for making popup display properly in both Firefox and Google Chrome
  var isFirefox = typeof InstallTrigger !== 'undefined';
  if (!isFirefox) {
    var searchToolsWrapper = document.getElementById("chrisbar-search-tools");
    var searchIconsDiv = document.getElementById("chrisbar-search-icons");
    var toolsDiv = document.getElementById("chrisbar-tools");
    searchToolsWrapper.style.width = searchIconsDiv.offsetWidth + toolsDiv.offsetWidth + 10 + "px";
  }
})();
/**********
* Chrisbar preferences
**********/

/* Toolbar Display Mode
'icons' = icons only
'text' = text only
'full' = icons and text */
pref('extensions.chrisbar.display-mode', 'full');

/* New Tab Setting
0 = load url in new tab, but stay in current tab
1 = load url in new tab, then make it active */
pref('extensions.chrisbar.newTab-setting', 0);

/* Show Buttons
true = enable button
false = disable button */
pref('extensions.chrisbar.show-gmail', true);
pref('extensions.chrisbar.show-maps', true);
pref('extensions.chrisbar.show-youtube', true);
pref('extensions.chrisbar.show-trans', true);
pref('extensions.chrisbar.show-cnet', true);
pref('extensions.chrisbar.show-dict', true);
pref('extensions.chrisbar.show-weather', true);
pref('extensions.chrisbar.show-tools', true);

/* Weather Location
'' = no set location
'string' = location set to 'string' */
pref('extensions.chrisbar.weather-location', '');

/* Screenshot Action
0 = copy to clipboard
1 = save to file
2 = copy to clipboard and save to file */
pref('extensions.chrisbar.screenshot-action', 0);

/**********
// Firefox preferences from about:config that should be changed
**********/

// Enables "Save and Quit" popup on browser close when 2+ tabs open
pref('browser.showQuitWarning', true);

// Prevents removal of "http://" from front of URL
pref('browser.urlbar.trimURLs', false);

// Reduces # of recent pages stored in cache for faster "Back / Forward" loading
// For more details, see http://kb.mozillazine.org/Browser.sessionhistory.max_total_viewers
pref('browser.sessionhistory.max_total_viewers', 5);

// Enable pipelining feature (multiple connections to server)
pref('network.http.pipelining', true);
pref('network.http.proxy.pipelining', true);
pref('network.http.pipelining.ssl', true);
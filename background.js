// Logs that the extension has been loaded
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({
    color: '#3aa757'
  }, function() {
    console.log("scamcheck is running");
  });
});

// Declares the url variable
var url;

// This script runs every time a tab is loading an url
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading' && tab.active) {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, tabs => {
      let url = tabs[0].url; // We add the url being loaded to the url variable
      console.log(url);

      const form = { // This is a basic form that is sent to the safe browsing api
        client: {
          clientId: 'yourcompanyname',
          clientVersion: '1.5.2'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
          platformTypes: ['WINDOWS'],
          threatEntryTypes: ['URL'],
          threatEntries: [{
            'url': url
          }, ]
        }
      };

      const safeBrowsing = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" // The safe browsing url and the api key
      const safeBrowsingParams = { // Essential parameters sent with the request
        headers: {
          "content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(form),
        method: "POST"
      }


      fetch(safeBrowsing, safeBrowsingParams) // We use fetch to make the api call
        .then(response => {
          return response.json()
        })
        .then(data => {
          console.log(data)
          if (data.matches) { // If the api returns an undefined object, the website is safe. If not, it has a match
            alert("This website may contain a scam. Tread carefully!"); // TODO: improve the warning message
          }
        })
        .catch(
          err => console.log(err)
        )
    });
  };
});

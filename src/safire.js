//
//
//

var browser = require("webextension-polyfill/dist/browser-polyfill.min");
var phoneSafe;
var urlSafe;


import {
  searchPhoneNumbersInText
} from 'libphonenumber-js'

async function getSource(tabId) {
  return new Promise((resolve, reject) => {
    browser.tabs.executeScript(tabId, {
      code: "document.documentElement.innerHTML"
    }).then(function(result) {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError.message);
      } else {
        resolve(result);
      }
    });
  })
};

function badgeStatus(string) {
  switch (string) {
    case 'scan':
      browser.browserAction.setBadgeText({
        text: "SCAN"
      });
      browser.browserAction.setBadgeBackgroundColor({
        color: "blue"
      });
      break;
    case 'safe':
      browser.browserAction.setBadgeText({
        text: "SAFE"
      });
      browser.browserAction.setBadgeBackgroundColor({
        color: "green"
      });
      break;
    case "warn":
      browser.browserAction.setBadgeText({
        text: "WARN"
      });
      browser.browserAction.setBadgeBackgroundColor({
        color: "yellow"
      });
      break;
    case "stop":
      browser.browserAction.setBadgeText({
        text: "STOP"
      });
      browser.browserAction.setBadgeBackgroundColor({
        color: "red"
      });
      break;
    default:
      console.error("badgeStatus function received invalid status: " + string);
  }
};

function safeBrowsing(url) {
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

  const safeBrowsing = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyDL7X04C3fWDLf2De5h_VVD-RlOvChKNRA" // The safe browsing url and the api key
  const safeBrowsingParams = { // Essential parameters sent with the request
    headers: {
      "content-type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify(form),
    method: "POST"
  }

  console.log("Consulting SafeBrowsing API for url: " + url);
  fetch(safeBrowsing, safeBrowsingParams) // We use fetch to make the api call
    .then(response => {
      return response.json()
    })
    .then(data => {
      if (data.matches) { // If the api returns an undefined object, the website is safe. If not, it has a match
        alert("This website may contain a scam. Tread carefully!"); // TODO: improve the warning message
        badgeStatus('stop');
        return null;
      } else {
        console.log("Async - URL not found on Safe Browsing API")
        return true;
        progressBadge(urlSafe, phoneSafe);
      }
    })
    .catch(
      err => console.log("This url could not be consulted with SafeBrowsing API")
    )
};

function rapidApiSpamCaller(number) {
  fetch("https://spamcheck.p.rapidapi.com/index.php?number=" + number, {
      "method": "GET",
      "headers": {
        "x-rapidapi-host": "spamcheck.p.rapidapi.com",
        "x-rapidapi-key": "316da80dddmshda7077af3148de5p1d7130jsn9d5d855cb788"
      }
    })
    .then(response => {
      return response.json()
    })
    .then(data => {
      console.log("Number " + number + ": " + data.response);
    })
    .catch(err => {
      console.log(err)
    });
}
async function analyzePhoneNumbers(tabId) {
  let source = await getSource(tabId);
  source = source.toString();
  console.log("Finding and analyzing phone numbers on tab " + tabId);
  for (const number of searchPhoneNumbersInText(source, 'US')) {
    console.log("Found phone number! " + number.number.number);
    rapidApiSpamCaller(number.number.number);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log('Async - Phone number search process finished');
  return true;
};

// Logs that the extension has been loaded
browser.runtime.onInstalled.addListener(function() {
  console.log("Safire is monitoring");
});

browser.declarativeContent.onPageChanged.removeRules(undefined, function() {
  browser.declarativeContent.onPageChanged.addRules([{
    conditions: [new browser.declarativeContent.PageStateMatcher({
      pageUrl: {
        schemes: ['http', 'https']
      },
    })],
    actions: [new browser.declarativeContent.ShowPageAction()]
  }]);
});

browser.storage.onChanged.addListener(function() {
  browser.storage.sync.get(debug)
});

function progressBadge(urlSafe, phoneSafe) {
  if (phoneSafe != null && urlSafe != null) {
    if (phoneSafe && urlSafe) {
      badgeStatus('safe')
    }
    return;
  } else return;
};

function safireEngine(tab) {
  let phoneSafe = null;
  let urlSafe = null;
  let url = tab.url;
  badgeStatus('scan');
  urlSafe = safeBrowsing(tab.url);
  phoneSafe = analyzePhoneNumbers(tab.id);
  progressBadge(urlSafe, phoneSafe);
  return;
};

browser.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'loading') {
    browser.tabs.query({
      status: 'loading'
    }).then(async tabs => {
      safireEngine(tabs[0])
    })
  }
});


// This script runs every time a tab loads an url
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.start == true && request.tab.url != null && request.tab.id != null) {
    safireEngine(request.tab);
    sendResponse({
      status: "complete"
    });
  };
});

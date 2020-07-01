import {
  searchPhoneNumbersInText
} from 'libphonenumber-js'

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
      if (data.matches) { // If the api returns an undefined object, the website is safe. If not, it has a match
        alert("This website may contain a scam. Tread carefully!"); // TODO: improve the warning message
      } else {
        console.log("URL not found on Safe Browsing API")
      }
    })
    .catch(
      err => console.log(err)
    )
};

async function getSource(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tabId, {
      code: "document.documentElement.innerHTML"
    }, function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(result);
      }
    });
  })
};
function rapidApiSpamCaller(number){
  fetch("https://spamcheck.p.rapidapi.com/index.php?number="+number, {
  	"method": "GET",
  	"headers": {
  		"x-rapidapi-host": "spamcheck.p.rapidapi.com",
  		"x-rapidapi-key": ""
  	}
  })
  .then(response => {
  	return response.json()
  })
  .then(data => {
    console.log("Number " + number + ": " + data.response)
  })
  .catch(err => {
  	console.log(err)
  });
}
async function analyzePhoneNumbers(source) {
  console.log("Finding and analyzing phone numbers...");
  let phoneList = source.toString();
  for (const number of searchPhoneNumbersInText(phoneList, 'US')) {
    console.log("Found phone number!: " + number.number.number);
    rapidApiSpamCaller(number.number.number);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  console.log('Finished');
};

// Logs that the extension has been loaded
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({
    color: '#3aa757'
  }, function() {
    console.log("scamcheck is running");
  });
});

chrome.storage.onChanged.addListener(function() {
  chrome.storage.sync.get(debug)
});

// This script runs every time a tab loads an url
chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.active) {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, async function(tabs) {
      let url = tabs[0].url; // We add the url being loaded to the url variable
      let source = await getSource(tabs[0].id);
      safeBrowsing(url);
      analyzePhoneNumbers(source);
    });
  };
});

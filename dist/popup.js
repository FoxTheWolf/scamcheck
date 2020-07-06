  // This script runs every time a tab loads an url
  browser.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'loading') {
      browser.tabs.query({
        status: 'loading'
      }).then(async tabs => {
        phoneSafe = false;
        urlSafe = false;
        browser.runtime.sendMessage({
          start: true,
          tab: tabs[0]
        }, function(response) {
          console.log(response.status);
        })
      })
    }
  });

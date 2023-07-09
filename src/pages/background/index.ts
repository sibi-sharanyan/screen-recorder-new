import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

console.log("background loaded");

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        console.log("message received", request.action);

        if (request.action === 'stop-recording') {
            (async () => {
                const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                await chrome.tabs.sendMessage(tab.id, { action: "stop-recording" });
            })();
        }

        if (request.action === 'recording-started') {
            (async () => {
                const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                await chrome.tabs.sendMessage(tab.id, { action: "recording-started" });
            })();
        }


        if (request.action === 'recording-stopped') {
            (async () => {
                const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                await chrome.tabs.sendMessage(tab.id, { action: "recording-stopped" });
            })();
        }
    }
);
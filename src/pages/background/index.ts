import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

console.log("background loaded");

let recordedChunks: any[] = [];

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {

        console.log("message received1", request.action);

        if (request.action === 'stop-recording') {
            (async () => {
                const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                await chrome.tabs.sendMessage(tab.id, { action: "stop-recording" });
            })();
        }

        if (request.action === 'recording-started') {
            recordedChunks = [];
        }


        if (request.action === 'recording-stopped') { /* empty */ }

        if (request.action === 'add-recording-chunk') {
            fetch(request.data)
                .then(res => res.blob())
                .then((data) => {
                    recordedChunks.push(data);
                })
        }

        if (request.action === "uploadToDrive") {

            console.log("recordedChunks", recordedChunks, request.data)

            const blob = await fetch(request.data).then(r => r.blob());

            const blob2 = new Blob(recordedChunks, {
                type: 'video/webm'
            });

            console.log("blobblobblob3", blob, blob2);

            const currentDate = new Date();
            const dateString = currentDate.toDateString();
            const filename = `video-${dateString}.webm`;

            // Convert blob to base64 so we can send it in JSON body to Google Drive
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
                chrome.identity.getAuthToken({ interactive: true }, function (token) {

                    console.log("token", token);

                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError });
                        return;
                    }

                    // Upload file to Google Drive
                    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'video/webm',
                            'Content-Length': String(blob.size)
                        },
                        body: blob
                    })
                        .then(response => response.json())
                        .then(data => {
                            const fileId = data.id;

                            // Make the file public on the web
                            return fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    role: 'reader',
                                    type: 'anyone'
                                })
                            })
                                .then(() => fileId);
                        })
                        .then(fileId => {
                            const publicUrl = `https://drive.google.com/file/d/${fileId}/view`;
                            sendResponse({ success: true, url: publicUrl });

                            console.log('File uploaded: ', publicUrl);
                        })
                        .catch(error => {
                            console.error(error);
                            sendResponse({ success: false, error: error.message });
                        });
                });
            };

            // This will keep the message channel open until sendResponse is called
            return true;
        }

    }
);
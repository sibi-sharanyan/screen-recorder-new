import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

console.log("background loaded");


async function retrieveFileFromStorage(chunkIndex: number): Promise<Blob> {
    const blobChunks = [];

    for (let i = 0; i < chunkIndex; i++) {
        const chunk = await new Promise<ArrayBuffer>(resolve => {
            chrome.storage.local.get([`chunk_${i}`], result => {
                resolve(new Uint8Array(result[`chunk_${i}`]).buffer as ArrayBuffer);
            });
        });
        blobChunks.push(new Blob([chunk]));
    }

    for (let i = 0; i < chunkIndex; i++) {
        chrome.storage.local.remove(`chunk_${i}`);
    }

    return new Blob(blobChunks, {
        type: 'video/webm'
    });
}


chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {

        console.log("message received1", request.action);

        if (request.action === 'stop-recording') {
            (async () => {
                const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                await chrome.tabs.sendMessage(tab.id, { action: "stop-recording" });
            })();
        }

        if (request.action === 'recording-started') { /* empty */ }


        if (request.action === 'recording-stopped') { /* empty */ }

        if (request.action === "uploadToDrive") {

            console.log("recordedChunks", request.data)

            const blob = await retrieveFileFromStorage(request.data)

            chrome.identity.getAuthToken({ interactive: true }, function (token) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    sendResponse({ success: false, error: chrome.runtime.lastError });
                    return;
                }

                // Upload file to Google Drive directly using the blob
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

            return true;
        }

    }
);
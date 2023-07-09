console.log("content loaded");
import RecordRTC from "recordrtc";

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
import("./components/Demo");
const audioCtx = new AudioContext();

let recorder;
let stream;

async function recordScreen() {
  return await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: 3840,
      height: 2160,
    },
    audio: true,
  });
}

function saveFile(recordedChunks) {

  const blob = new Blob(recordedChunks, {
    type: 'video/webm'
  });

  const currentDate = new Date();
  const dateString = currentDate.toDateString();

  const filename = `video-${dateString}`;
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${filename}.webm`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function createRecorder(stream, mimeType) {
  // the stream data is stored in this array
  let recordedChunks = [];

  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };
  mediaRecorder.onstop = function () {
    saveFile(recordedChunks);
    recordedChunks = [];

    chrome.runtime.sendMessage({ action: "recording-stopped" });

  };
  mediaRecorder.start(200); // For every 200ms the stream data will be stored in a separate chunk.
  return mediaRecorder;
}

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  console.log("message received", request.action);

  if (request.action === "start-recording") {
    stream = await recordScreen();
    const mimeType = 'video/webm';
    recorder = createRecorder(stream, mimeType);

    chrome.runtime.sendMessage({ action: "recording-started" });
  }

  if (request.action == "stop-recording") {
    console.log("stop recording");
    recorder.stop();


    stream.getTracks()
      .forEach(track => track.stop())

    chrome.runtime.sendMessage({ action: "recording-stopped" });
    return;
  }

  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  return true;
});

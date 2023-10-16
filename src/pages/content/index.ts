console.log("content loaded");

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
import("./components/Demo");

let recorder;
let stream;
let chunkIndex = 0;

async function recordScreen() {
  // Capture the screen stream
  const videoStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: 3840,
      height: 2160,
    }
  });

  // Capture the audio stream, you can adjust this to capture system sound or microphone
  const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Combine tracks from both streams into one
  const tracks = [...videoStream.getTracks(), ...audioStream.getTracks()];
  const combinedStream = new MediaStream(tracks);

  return combinedStream;
}

async function saveFile() {
  chrome.runtime.sendMessage({ action: "uploadToDrive", data: chunkIndex });

  chunkIndex = 0;
}


function createRecorder(stream, mimeType) {
  const options = {
    mimeType: mimeType,
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 10000000
  };

  const mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = async function (e) {
    if (e.data.size > 0) {
      const arrayBuffer = await e.data.arrayBuffer();
      chrome.storage.local.set({ [`chunk_${chunkIndex}`]: Array.from(new Uint8Array(arrayBuffer)) });
      chunkIndex++;
    }
  };
  mediaRecorder.onstop = function () {
    saveFile();
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
  console.log("message received2", request.action);

  if (request.action === "start-recording") {
    stream = await recordScreen();
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.onended = () => {
      console.log('User stopped sharing the screen');
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
      }
    };
    const mimeType = 'video/webm; codecs="vp9,opus"';
    recorder = createRecorder(stream, mimeType);
    chrome.runtime.sendMessage({ action: "recording-started" });
  }

  if (request.action == "stop-recording") {
    console.log("stop recording");
    recorder.stop();
    stream.getTracks().forEach(track => track.stop());
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

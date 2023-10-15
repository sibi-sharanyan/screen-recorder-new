console.log("content loaded");

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
import("./components/Demo");

let recorder;
let stream;

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

function saveFile(recordedChunks) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm'
  });

  const currentDate = new Date();
  const dateString = currentDate.toDateString();

  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = () => {
    chrome.runtime.sendMessage({ action: "uploadToDrive", data: reader.result });
  };

}

function createRecorder(stream, mimeType) {
  // the stream data is stored in this array
  let recordedChunks = [];

  const options = {
    mimeType: mimeType,
    audioBitsPerSecond: 128000,   // for audio
    videoBitsPerSecond: 10000000  // for video, aiming for 10 Mbps
  };

  const mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = async function (e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);


      const reader = new FileReader();
      reader.readAsDataURL(e.data);
      reader.onloadend = () => {
        chrome.runtime.sendMessage({ action: "add-recording-chunk", data: reader.result });
      };

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

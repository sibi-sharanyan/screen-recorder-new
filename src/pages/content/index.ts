console.log("content loaded");
import RecordRTC from "recordrtc";

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
import("./components/Demo");
const audioCtx = new AudioContext();

let recorder;

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );

  console.log("audio devices", await navigator.mediaDevices.enumerateDevices());

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: 3840,
      height: 2160,
    },
    audio: true,
    frameRate: {
      ideal: 60,
    },
  });

  recorder = new MediaRecorder(stream);

  if (stream.getAudioTracks().length == 0) {
    console.log("No Audio");
  }
  recorder.addTrack(stream.getVideoTracks()[0]);

  recorder.ondataavailable = (e) => {
    console.log("data available");
    console.log(e.data);

    //download data

    const blob = new Blob([e.data], { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "recorded_video.webm";
    a.click();

    URL.revokeObjectURL(url);
  };

  recorder.onMessage = (e) => {
    console.log("message available");
    console.log(e.data);
  };

  recorder.start();

  return true;
});

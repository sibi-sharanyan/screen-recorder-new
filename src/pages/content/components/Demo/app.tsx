import { useEffect, useState } from "react";

export default function App() {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    console.log("content view loaded");
  }, []);

  chrome.runtime.onMessage.addListener(async function (request) {
    if (request.action === "recording-started") {
      setIsRecording(true);
    } else if (request.action === "recording-stopped") {
      setIsRecording(false);
    }
  });

  return (
    <div className="flex space-x-4 content-view fixed bottom-20 left-1/2">
      {isRecording && (
        <button
          className="btn btn-error"
          onClick={async () => {
            const data = await chrome.runtime.sendMessage({
              action: "stop-recording",
            });
            console.log(data);
          }}
        >
          Stop recording
        </button>
      )}
    </div>
  );
}

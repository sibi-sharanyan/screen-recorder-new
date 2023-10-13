import React from "react";
import logo from "@assets/img/logo.svg";
import "@pages/popup/Popup.css";

const Popup = () => {
  return (
    <div className="App space-y-5">
      <button
        className="btn btn-primary"
        onClick={async () => {
          const [tab] = await chrome.tabs.query({
            active: true,
          });

          console.log(tab);

          const response = await chrome.tabs.sendMessage(tab.id || 0, {
            action: "start-recording",
          });
        }}
      >
        Start Recording
      </button>

      <button
        className="btn btn-primary"
        onClick={async () => {
          console.log("chrome.identity", chrome.identity);

          chrome.identity.getAuthToken({ interactive: true }, function (token) {
            console.log(token);
          });
        }}
      >
        Authenticate
      </button>
    </div>
  );
};

export default Popup;

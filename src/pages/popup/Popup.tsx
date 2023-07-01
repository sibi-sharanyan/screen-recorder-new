import React from "react";
import logo from "@assets/img/logo.svg";
import "@pages/popup/Popup.css";

const Popup = () => {
  return (
    <div className="App">
      <button
        className="btn btn-primary"
        onClick={async () => {
          const [tab] = await chrome.tabs.query({
            active: true,
          });

          console.log(tab);

          const response = await chrome.tabs.sendMessage(tab.id || 0, {
            greeting: "hello",
          });
        }}
      >
        Start Recording
      </button>
    </div>
  );
};

export default Popup;

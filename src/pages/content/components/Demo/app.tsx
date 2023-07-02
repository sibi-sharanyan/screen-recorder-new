import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    console.log("content view loaded");
  }, []);

  return (
    <div className="content-view text-red-400 fixed bottom-20 left-1/2">
      Stop recording
    </div>
  );
}

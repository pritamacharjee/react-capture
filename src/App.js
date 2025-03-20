import logo from "./logo.svg";
import "./App.css";
import CaptureImage from "./components/CaptureImage";
import DetectFace from "./components/DetectFace";
import LiveDetectFace from "./components/LiveDetectFace";

function App() {
  return (
    <div className="App">
      {/* <CaptureImage />   */}
      {/* <DetectFace/>   */}
      <LiveDetectFace/> 
    </div>
  );
}

export default App;

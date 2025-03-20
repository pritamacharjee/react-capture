import React, { useRef, useState, useEffect } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs";
const CaptureImage = () => {
  const [image, setImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(true); // Toggle state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const constraints = {
        video: { facingMode: useFrontCamera ? "user" : "environment" },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          console.log("Video width:", videoRef.current.videoWidth);
          console.log("Video height:", videoRef.current.videoHeight);
        };
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const capturePhoto = () => {
    if (errorMessage) {
      alert("Ensure your mouth and teeth are visible before capturing!");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL("image/png"));

      // Stop the camera stream
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setIsCapturing(false);
    }
  };
  const detectFace = async () => {
    if (!videoRef.current) {
      console.warn("Video element not found");
      return;
    }
    
    const model = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: "tfjs", // ✅ Specify runtime
      }
    )
    const video = videoRef.current.video;
    console.log("video",video)
    if (!video) return;
    const detect = async () => {
      const predictions = await model.estimateFaces(video);
      console.log("predictions", predictions);
      if (predictions.length > 0) {
        setErrorMessage(""); // Face detected
        drawGuidelines(predictions, video);
      } else {
        setErrorMessage("No face detected. Please upload a clear image.");
      }
     // requestAnimationFrame(detect);
    };
    detect();
  };
  useEffect(() => {
    if (isCapturing) {
      detectFace();
    }
  }, [isCapturing]);
  const drawGuidelines = (predictions, imgElement) => {
    if (!canvasRef.current) {
      console.error("Canvas is not initialized.");
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    predictions.forEach((prediction, index) => {
      const { box, keypoints } = prediction;
      if (!keypoints || keypoints.length === 0) {
        console.error(`Prediction ${index} has no keypoints`);
        return;
      }

      console.log(`Prediction ${index} box:`, box);

      if (box) {
        const { xMin, yMin, width, height } = box;
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.strokeRect(xMin, yMin, width, height);
      }

      // Extract mouth region (61 - 81)
      const mouthLandmarks = [
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 78, 191, 95, 88, 178, 87,
        14, 317, 402, 318, 324, 308,
      ].map((index) => keypoints[index]);

      // Draw lines around mouth
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      mouthLandmarks.forEach(({ x, y }, index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();

      if (mouthLandmarks.length >= 10) {
        setErrorMessage("");
      } else {
        setErrorMessage("Make sure your teeth are visible!");
      }
    });
  };
  return (
    <div className="container">
      {!isCapturing && !image && (
        <>
          <button onClick={startCamera} className="open-camera-btn">
            Open Camera
          </button>
          <button
            onClick={() => setUseFrontCamera((prev) => !prev)}
            className="toggle-camera-btn"
          >
            Switch to {useFrontCamera ? "Back" : "Front"} Camera
          </button>
        </>
      )}

      {isCapturing && (
        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-preview"
          />
          <div className="face-guide">
            <div className="face-outline"></div>
            <div className="mouth-guide"></div>
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button onClick={capturePhoto} className="capture-btn">
            Capture Photo
          </button>
        </div>
      )}
      {image && (
        <div className="image-container">
          <img src={image} alt="Captured" className="captured-image" />
          <button onClick={() => setImage(null)} className="retake-btn">
            Retake Photo
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden-canvas" />
    </div>
  );
};

export default CaptureImage;

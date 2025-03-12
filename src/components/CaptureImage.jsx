import React, { useRef, useState, useEffect } from "react";

const CaptureImage = () => {
  const [image, setImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(true); // Toggle state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const constraints = {
        video: { facingMode: useFrontCamera ? "user" : "environment" },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const capturePhoto = () => {
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
          <video ref={videoRef} autoPlay playsInline className="video-preview" />
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

import React, { useRef, useState, useEffect } from "react";

const CaptureImage = () => {
  const [image, setImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

      // Stop camera stream after capturing
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setIsCapturing(false);
    }
  };

  return (
    <div className="container">
      {!isCapturing && !image && (
        <button className="open-camera-btn" onClick={startCamera}>
          Open Camera
        </button>
      )}

      {isCapturing && (
        <div className="camera-container">
          <video ref={videoRef} autoPlay className="video-preview" />
          <button className="capture-btn" onClick={capturePhoto}>
            📸 Capture
          </button>
        </div>
      )}

      {image && (
        <div className="image-container">
          <img src={image} alt="Captured" className="captured-image" />
          <button className="retake-btn" onClick={() => setImage(null)}>
            Retake Photo
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden-canvas" />
    </div>
  );
};

export default CaptureImage;

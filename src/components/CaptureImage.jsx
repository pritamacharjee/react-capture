import React, { useRef, useState, useEffect } from "react";

const CaptureImage = () => {
  const [image, setImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  let streamRef = useRef(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCapturing(false);
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
      stopCamera();
    }
  };

  // Cleanup the camera when component unmounts
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col items-center p-4">
      {!isCapturing && !image && (
        <button
          onClick={startCamera}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer"
        >
          Open Camera
        </button>
      )}
      {isCapturing && (
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline className="w-64 h-64 rounded-lg shadow-lg" />
          <button
            onClick={capturePhoto}
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-green-500 text-white rounded-lg"
          >
            Capture Photo
          </button>
        </div>
      )}
      {image && (
        <div className="flex flex-col items-center">
          <img
            src={image}
            alt="Captured"
            className="mt-4 w-64 h-64 object-cover rounded-lg shadow-lg"
          />
          <button
            onClick={() => {
              setImage(null);
              startCamera();
            }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            Retake Photo
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CaptureImage;

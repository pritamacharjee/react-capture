import React, { useRef, useState, useEffect } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs";
import {FACE_LANDMARKS_TESSELATION, FACE_OVER_POINTS, isMouthOpen} from "./../utils/constants"
const LiveDetectFace = () => {
  const [image, setImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [isVideoLoaded, setVideoLoaded] = useState(false);
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
          // setCanvasSize();
          setVideoLoaded(true);
        };
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // const capturePhoto = () => {
  //   if (errorMessage) {
  //     alert("Ensure your mouth and teeth are visible before capturing!");
  //     return;
  //   }

  //   const canvas = canvasRef.current;
  //   const video = videoRef.current;
  //   if (canvas && video) {
  //     const context = canvas.getContext("2d");
  //     canvas.width = video.videoWidth;
  //     canvas.height = video.videoHeight;
  //     context.drawImage(video, 0, 0, canvas.width, canvas.height);
  //     setImage(canvas.toDataURL("image/png"));

  //     // Stop the camera stream
  //     const stream = video.srcObject;
  //     const tracks = stream.getTracks();
  //     tracks.forEach((track) => track.stop());
  //     setIsCapturing(false);
  //   }
  // };
  const capturePhoto = () => {
    if (errorMessage) {
      alert("Ensure your mouth and teeth are visible before capturing!");
      return;
    }
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const videoFrame = getVideoFrame();
      setImage(videoFrame.toDataURL("image/png"));
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setIsCapturing(false);
      setVideoLoaded(false);
    }
    // const video = getVideoFrame();
    // if (video) {
    //   setImage(video.toDataURL("image/png"));
    //   setIsCapturing(false);
    // }
  };
  const detectFace = async () => {
    if (!videoRef.current) {
      console.warn("Video element not found");
      return;
    }
    const detect = async () => {
      try {
        const videoFrame = getVideoFrame();
        // console.log("videoFrame", videoFrame);
        const predictions = await model.estimateFaces(videoFrame);
        // console.log("predictions", predictions);
        if (predictions.length > 0) {
          setErrorMessage("");
          drawGuidelines(predictions, videoFrame);
        
        } else {
          setErrorMessage("No face detected. Please upload a clear image.");
        }

        requestAnimationFrame(detect);
      } catch (error) {}
    };
    detect();
  };
  const getVideoFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      // return canvas.toDataURL("image/png");
      return canvas;
    }
  };
  useEffect(() => {
    if (isCapturing && isVideoLoaded) {
      detectFace();
    }
  }, [isCapturing, isVideoLoaded]);

  const drawGuidelines = (predictions, videoElement) => {
    if (!canvasRef.current) {
      console.error("Canvas is not initialized.");
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = videoElement.width;
    canvas.height = videoElement.height;
    // Flip the front camera
    // ctx.translate(canvas.width, 0);
    // ctx.scale(-1, 1);

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    predictions.forEach((prediction, index) => {
      const { box, keypoints } = prediction;
      if (!keypoints || keypoints.length === 0) {
        // console.error(`Prediction ${index} has no keypoints`);
        return;
      }

      // if (box) {
      //   const { xMin, yMin, width, height } = box;
      //   ctx.strokeStyle = "blue";
      //   ctx.lineWidth = 2;
      //   ctx.strokeRect(xMin, yMin, width, height);
      // }

      

      // // Draw lines around mouth
      // ctx.strokeStyle = "red";
      // ctx.lineWidth = 2;
      // ctx.beginPath();
      // mouthLandmarks.forEach(({ x, y }, index) => {
      //   if (index === 0) ctx.moveTo(x, y);
      //   else ctx.lineTo(x, y);
      // });
      // ctx.closePath();
      // ctx.stroke();
      // keypoints.forEach(({ x, y }) => {
      //   ctx.beginPath();
      //   ctx.arc(x, y, 2, 0, 2 * Math.PI);
      //   ctx.fillStyle = "red";
      //   ctx.fill();
      // });

      // if (mouthLandmarks.length >= 10) {
      //   setErrorMessage("");
      // } else {
      //   setErrorMessage("Make sure your teeth are visible!");
      // }
    
      // console.log("isMouthOpen",isMouthOpen(keypoints))

      // ctx.strokeStyle = "#00ff00";
      // ctx.lineWidth = 3;
      ctx.strokeStyle = "#C0C0C070";
      ctx.lineWidth = 1;
      ctx.beginPath();

      FACE_LANDMARKS_TESSELATION.forEach(({ start, end }) => {
        ctx.moveTo(keypoints[start].x, keypoints[start].y);
        ctx.lineTo(keypoints[end].x, keypoints[end].y);
      });

      ctx.stroke();
    });
  };
  const setCanvasSize = () => {
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
  };

  useEffect(() => {
    async function loadModel() {
      setLoading(true);
      try {
        const detector = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: "tfjs",
            maxFaces: 1,
          }
        );
        setModel(detector);
        console.log("Face Mesh model loaded! ✅");
      } catch (error) {
        console.error("Error loading model:", error);
      } finally {
        setLoading(false);
      }
    }

    loadModel();
  }, []);
  function drawLips(ctx, landmarks) {
    const lipConnections = [
      { start: 61, end: 146 },
      { start: 146, end: 91 },
      { start: 91, end: 181 },
      { start: 181, end: 84 },
      { start: 84, end: 17 },
      { start: 17, end: 314 },
      { start: 314, end: 405 },
      { start: 405, end: 321 },
      { start: 321, end: 375 },
      { start: 375, end: 291 },
      { start: 61, end: 185 },
      { start: 185, end: 40 },
      { start: 40, end: 39 },
      { start: 39, end: 37 },
      { start: 37, end: 0 },
      { start: 0, end: 267 },
      { start: 267, end: 269 },
      { start: 269, end: 270 },
      { start: 270, end: 409 },
      { start: 409, end: 291 },
      { start: 78, end: 95 },
      { start: 95, end: 88 },
      { start: 88, end: 178 },
      { start: 178, end: 87 },
      { start: 87, end: 14 },
      { start: 14, end: 317 },
      { start: 317, end: 402 },
      { start: 402, end: 318 },
      { start: 318, end: 324 },
      { start: 324, end: 308 },
      { start: 78, end: 191 },
      { start: 191, end: 80 },
      { start: 80, end: 81 },
      { start: 81, end: 82 },
      { start: 82, end: 13 },
      { start: 13, end: 312 },
      { start: 312, end: 311 },
      { start: 311, end: 310 },
      { start: 310, end: 415 },
      { start: 415, end: 308 },
    ];

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();

    lipConnections.forEach(({ start, end }) => {
      ctx.moveTo(landmarks[start].x, landmarks[start].y);
      ctx.lineTo(landmarks[end].x, landmarks[end].y);
    });

    ctx.stroke();
  }
  function isTeethVisible(landmarks) {
    try {
      const upperLip = landmarks[13]; // Upper lip center
      const lowerLip = landmarks[14]; // Lower lip center

      // Calculate Euclidean distance
      const lipGap = Math.sqrt(
        Math.pow(lowerLip.x - upperLip.x, 2) +
          Math.pow(lowerLip.y - upperLip.y, 2)
      );

      // Threshold: Adjust based on testing
      return lipGap > 5; // If gap > 5 pixels, assume teeth are visible
    } catch (error) {
      return false;
    }
  }

  // Example usage inside a face detection loop

  return (
    <div className="container">
      {isLoading ? (
        <div className="loaderContainer">
          <div className="loader"></div>
          {/* <p className="loaderText">Loading App... Please wait</p> */}
        </div>
      ) : (
        <>
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
              <canvas ref={canvasRef} />

              {/* <div className="face-guide">
            <div className="face-outline"></div>
            <div className="mouth-guide"></div>
          </div> */}
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
        </>
      )}
    </div>
  );
};

export default LiveDetectFace;

// import React, { useRef, useState, useEffect } from "react";
// import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
// import "@tensorflow/tfjs";
// const CaptureImage = () => {
//   const [image, setImage] = useState(null);
//   const [isCapturing, setIsCapturing] = useState(false);
//   const [useFrontCamera, setUseFrontCamera] = useState(true); // Toggle state
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const startCamera = async () => {
//     setIsCapturing(true);
//     try {
//       const constraints = {
//         video: { facingMode: useFrontCamera ? "user" : "environment" },
//       };
//       const stream = await navigator.mediaDevices.getUserMedia(constraints);
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         videoRef.current.onloadedmetadata = () => {
//           console.log("Video metadata loaded");
//           console.log("Video width:", videoRef.current.videoWidth);
//           console.log("Video height:", videoRef.current.videoHeight);
//           detectFace();
//         };
//         videoRef.current.play();
//       }
//     } catch (error) {
//       console.error("Error accessing camera:", error);
//     }
//   };

//   const capturePhoto = () => {
//     if (errorMessage) {
//       alert("Ensure your mouth and teeth are visible before capturing!");
//       return;
//     }

//     const canvas = canvasRef.current;
//     const video = videoRef.current;
//     if (canvas && video) {
//       const context = canvas.getContext("2d");
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       context.drawImage(video, 0, 0, canvas.width, canvas.height);
//       setImage(canvas.toDataURL("image/png"));

//       // Stop the camera stream
//       const stream = video.srcObject;
//       const tracks = stream.getTracks();
//       tracks.forEach((track) => track.stop());
//       setIsCapturing(false);
//     }
//   };
//   const detectFace = async () => {
//     if (!videoRef.current) {
//       console.warn("Video element not found");
//       return;
//     }

//     const model = await faceLandmarksDetection.createDetector(
//       faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
//       {
//         runtime: "tfjs", // ✅ Specify runtime
//       }
//     );
//     const video = videoRef.current;
//     console.log("video", video);
//     if (!video) return;
//     const detect = async () => {
//       const predictions = await model.estimateFaces(video);
//       console.log("predictions", predictions);
//       if (predictions.length > 0) {
//         setErrorMessage(""); // Face detected
//         drawGuidelines(predictions, video);
//       } else {
//         setErrorMessage("No face detected. Please upload a clear image.");
//       }
//        requestAnimationFrame(detect);
//     };
//     detect();
//   };
//   useEffect(() => {
//     if (isCapturing) {
//       detectFace();
//     }
//   }, [isCapturing]);
//   const drawGuidelines = (predictions, imgElement) => {
//     if (!canvasRef.current) {
//       console.error("Canvas is not initialized.");
//       return;
//     }
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     canvas.width = imgElement.width;
//     canvas.height = imgElement.height;
//     ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
//     ctx.strokeStyle = "red";
//     ctx.lineWidth = 2;

//     predictions.forEach((prediction, index) => {
//       const { box, keypoints } = prediction;
//       if (!keypoints || keypoints.length === 0) {
//         console.error(`Prediction ${index} has no keypoints`);
//         return;
//       }

//       console.log(`Prediction ${index} box:`, box);

//       if (box) {
//         const { xMin, yMin, width, height } = box;
//         ctx.strokeStyle = "blue";
//         ctx.lineWidth = 2;
//         ctx.strokeRect(xMin, yMin, width, height);
//       }

//       // Extract mouth region (61 - 81)
//       const mouthLandmarks = [
//         61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 78, 191, 95, 88, 178, 87,
//         14, 317, 402, 318, 324, 308,
//       ].map((index) => keypoints[index]);

//       // Draw lines around mouth
//       ctx.strokeStyle = "red";
//       ctx.lineWidth = 2;
//       ctx.beginPath();
//       mouthLandmarks.forEach(({ x, y }, index) => {
//         if (index === 0) ctx.moveTo(x, y);
//         else ctx.lineTo(x, y);
//       });
//       ctx.closePath();
//       ctx.stroke();

//       if (mouthLandmarks.length >= 10) {
//         setErrorMessage("");
//       } else {
//         setErrorMessage("Make sure your teeth are visible!");
//       }
//     });
//   };
//   return (
//     <div className="container">
//       {!isCapturing && !image && (
//         <>
//           <button onClick={startCamera} className="open-camera-btn">
//             Open Camera
//           </button>
//           <button
//             onClick={() => setUseFrontCamera((prev) => !prev)}
//             className="toggle-camera-btn"
//           >
//             Switch to {useFrontCamera ? "Back" : "Front"} Camera
//           </button>
//         </>
//       )}

//       {isCapturing && (
//         <div className="camera-container">
//           <video
//             ref={videoRef}
//             autoPlay
//             playsInline
//             className="video-preview"
//           />
//           <div className="face-guide">
//             <div className="face-outline"></div>
//             <div className="mouth-guide"></div>
//           </div>
//           {errorMessage && <p className="error-message">{errorMessage}</p>}
//           <button onClick={capturePhoto} className="capture-btn">
//             Capture Photo
//           </button>
//         </div>
//       )}
//       {image && (
//         <div className="image-container">
//           <img src={image} alt="Captured" className="captured-image" />
//           <button onClick={() => setImage(null)} className="retake-btn">
//             Retake Photo
//           </button>
//         </div>
//       )}
//       <canvas ref={canvasRef} className="hidden-canvas" />
//     </div>
//   );
// };

// export default CaptureImage;

import React, { useRef, useState, useEffect } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs";
const DetectFace = () => {
  const [image, setImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const canvasRef = useRef(null);

  // Handle Image Upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      //   const reader = new FileReader();
      //   reader.readAsDataURL(file);
      //   reader.onloadend = () => {
      //     const base64Image = reader.result;
      //     console.log("Base64 Image:", base64Image);
      //     setImage(base64Image);
      //     setErrorMessage("");
      //     const img = new Image();
      //     img.src = base64Image;
      //     img.onload = () => detectFace(img);
      //   };
      //----------------------------------------------
      const image = document.createElement("img");
      image.src = "/images/face.png";
      image.onload = async () => {
        console.log("Image loaded, ready for face detection!");
        detectFace(image);
      };
    }
  };

  // Detect Face using TensorFlow.js
  const detectFace = async (imgElement) => {
    console.log("detectFace", imgElement);
    try {
      const model = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: "tfjs" }
      );

      const predictions = await model.estimateFaces(imgElement);

      if (predictions.length > 0) {
        setErrorMessage(""); // Face detected
        drawGuidelines(predictions, imgElement);
      } else {
        setErrorMessage("No face detected. Please upload a clear image.");
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      setErrorMessage("Face detection failed.");
    }
  };

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

  //       // 🔹 Draw keypoints
  //       keypoints.forEach(({ x, y }) => {
  //         ctx.beginPath();
  //         ctx.arc(x, y, 2, 0, 2 * Math.PI);
  //         ctx.fillStyle = "red";
  //         ctx.fill();
  //       });
  //     });
  //   };

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
        const mouthLandmarks = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 78, 191, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]
        .map((index) => keypoints[index]);

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

  // const drawGuidelines = (predictions, imgElement) => {
  //   const canvas = canvasRef.current;
  //   const ctx = canvas.getContext("2d");

  //   canvas.width = imgElement.width;
  //   canvas.height = imgElement.height;
  //   ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
  //   ctx.strokeStyle = "red";
  //   ctx.lineWidth = 2;

  //   predictions.forEach((prediction, index) => {
  //     const { box, keypoints } = prediction;
  //     if (!keypoints || keypoints.length === 0) {
  //       console.error(`Prediction ${index} has no keypoints`);
  //       return;
  //     }
  //     const { xMin, yMin, width, height } = prediction.box;
  //     const outerMouthIndexes = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 78, 191];
  //     const innerMouthIndexes = [95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
    
  //     const outerMouth = outerMouthIndexes.map((index) => keypoints[index]);
  //     const innerMouth = innerMouthIndexes.map((index) => keypoints[index]);
    
  //     // 🔸 Draw outer mouth outline
  //     ctx.strokeStyle = "red";
  //     ctx.lineWidth = 2;
  //     ctx.beginPath();
  //     outerMouth.forEach(({ x, y }, index) => {
  //       if (index === 0) ctx.moveTo(x, y);
  //       else ctx.lineTo(x, y);
  //     });
  //     ctx.closePath();
  //     ctx.stroke();
    
  //     // 🔸 Draw inner mouth outline
  //     ctx.strokeStyle = "green";
  //     ctx.lineWidth = 2;
  //     ctx.beginPath();
  //     innerMouth.forEach(({ x, y }, index) => {
  //       if (index === 0) ctx.moveTo(x, y);
  //       else ctx.lineTo(x, y);
  //     });
  //     ctx.closePath();
  //     ctx.stroke();
    
  //     // ✅ **Enhanced Validation**
  //     const isMouthDetected = outerMouth.length >= 10 && innerMouth.length >= 5;
  //     const mouthCenter = outerMouth.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    
  //     mouthCenter.x /= outerMouth.length;
  //     mouthCenter.y /= outerMouth.length;
    
  //     // 🔹 Ensure mouth is inside the bounding box
  //     if (
  //       mouthCenter.x > xMin &&
  //       mouthCenter.x < xMin + width &&
  //       mouthCenter.y > yMin &&
  //       mouthCenter.y < yMin + height
  //     ) {
  //       if (isMouthDetected) {
  //         setErrorMessage(""); // ✅ Mouth detected correctly
  //       } else {
  //         setErrorMessage("Make sure your teeth are visible!");
  //       }
  //     } else {
  //       setErrorMessage("Face detected but mouth not properly positioned.");
  //     }

  //   });
  // };
  return (
    <div className="flex flex-col items-center p-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="mb-4"
      />

      {/* {image && ( */}
      <canvas
        ref={canvasRef}
        className="w-64 h-64 object-cover rounded-lg shadow-lg"
      />
      {/* )} */}

      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
    </div>
  );
};

export default DetectFace;

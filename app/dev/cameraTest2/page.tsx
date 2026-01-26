"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    videoRef.current!.srcObject = mediaStream;
    setStream(mediaStream);
  };

  const takePhoto = () => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      console.log(file);
    }, "image/jpeg");
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
  };

  return (
    <div>
      <button onClick={startCamera}>Open Camera</button>
      <button onClick={takePhoto}>Take Photo</button>
      <button onClick={stopCamera}>Close Camera</button>

      <video ref={videoRef} autoPlay playsInline muted />
      <canvas ref={canvasRef} hidden />
    </div>
  );
}

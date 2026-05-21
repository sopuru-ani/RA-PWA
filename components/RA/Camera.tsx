"use client";

import { useEffect, useRef } from "react";
import { useNotification } from "@/context/notification-context";

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { show } = useNotification();

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        show({
          msg: "Camera access denied or unavailable",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    }

    startCamera();
  }, [show]);

  return (
    <div>
      <h2>Camera Preview</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", maxWidth: 400 }}
      />
    </div>
  );
}

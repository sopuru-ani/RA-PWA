"use client";

import { useRef } from "react";

export default function CameraButton() {
  const inputRef = useRef<HTMLInputElement>(null);

  const openCamera = () => {
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Captured file:", file);
    // send to backend, upload to S3, etc.
  };

  return (
    <div>
      <button onClick={openCamera}>Take Photo</button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment" // back camera on mobile
        onChange={onFileChange}
        hidden
      />
    </div>
  );
}

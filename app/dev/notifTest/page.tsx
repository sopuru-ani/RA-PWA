"use client";

import { useNotification } from "@/context/notification-context";

function NotificationsTest() {
  const { show } = useNotification();

  return (
    <div className="relative flex flex-col gap-4 w-dvw min-h-dvh p-4">
      <button
        className="py-2 px-3 bg-primary text-white rounded-md w-fit"
        onClick={() => {
          show({
            msg: "first click",
            type: "error",
            closable: true,
            duration: null,
          });
        }}
      >
        Show Notification 1
      </button>

      <button
        className="py-2 px-3 bg-primary text-white rounded-md w-fit"
        onClick={() => {
          show({
            msg: "second click",
            type: "neutral",
          });
        }}
      >
        Show Notification 2
      </button>

      <button
        className="py-2 px-3 bg-primary text-white rounded-md w-fit"
        onClick={() => {
          show({
            msg: "third click",
            type: "success",
          });
        }}
      >
        Show Notification 3
      </button>
    </div>
  );
}

export default NotificationsTest;

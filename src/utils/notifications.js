//src\utils\notifications.js
export const triggerNotification = () => {
  const mode = localStorage.getItem("appSoundMode") || "sound";

  if (mode === "sound") {
    const audio = new Audio("/assets/notification.mp3"); // replace with actual sound file
    audio.play();
  } else if (mode === "vibration" && navigator.vibrate) {
    navigator.vibrate(200);
  }
  // silent → do nothing
};

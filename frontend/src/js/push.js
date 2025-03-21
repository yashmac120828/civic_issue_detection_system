function subscribeToNotifications() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").then((reg) => {
            return reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: "YOUR_PUBLIC_VAPID_KEY",
            });
        }).then((sub) => {
            console.log("Subscribed to push notifications:", sub);
        });
    }
}

document.addEventListener("DOMContentLoaded", subscribeToNotifications);

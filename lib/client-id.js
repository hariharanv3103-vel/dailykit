export function getClientId() {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem("dailykit-client-id");
  if (!id) {
    id = window.crypto?.randomUUID?.() || `dk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem("dailykit-client-id", id);
  }
  return id;
}

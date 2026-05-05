import { io, type Socket } from "socket.io-client";

const API_URL = (import.meta.env.VITE_API_URL || "/api").trim();

const INVALID_SOCKET_URL_PATTERN = /<|>/;

export interface OrderWorkflowSocketEvent {
  type: "order_workflow";
  audience: "buyer" | "seller" | "delivery_agent";
  orderId: string;
  status: string;
  statusLabel: string;
  title: string;
  message: string;
  actorRole: "buyer" | "seller" | "mechanic" | "delivery_agent" | "system";
  timestamp: string;
}

export interface ReturnWorkflowSocketEvent {
  type: "return_workflow";
  audience: "buyer" | "seller" | "mechanic" | "delivery_agent";
  returnRequestId: string;
  orderId: string;
  status: string;
  title: string;
  message: string;
  actorRole: "buyer" | "seller" | "mechanic" | "delivery_agent" | "system";
  timestamp: string;
}

export function getSocketUrl() {
  if (!API_URL || INVALID_SOCKET_URL_PATTERN.test(API_URL)) {
    return "";
  }

  if (API_URL.startsWith("http://") || API_URL.startsWith("https://")) {
    return API_URL.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function createAuthedSocket(): Socket | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const socketUrl = getSocketUrl();
  if (!socketUrl) return null;

  return io(socketUrl, {
    auth: { token },
    transports: ["polling", "websocket"],
  });
}

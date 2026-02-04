import { WebSocket, WebSocketServer } from "ws";
import { Server as HttpServer } from "http";
import { Match } from "../db/schema";

function sendJson(socket: WebSocket, payload: any) {
  // If client is not connected, end
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

// Send payload to all connected clients
function broadcast(wss: WebSocketServer, payload: any) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebSockerServer(server: HttpServer) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    // 1mb max payload
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    sendJson(socket, {
      type: "welcome",
    });

    socket.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: "match_created", data: match });
  }
  return { broadcastMatchCreated };
}

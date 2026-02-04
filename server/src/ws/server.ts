import { WebSocket, WebSocketServer } from "ws";
import { Server as HttpServer } from "http";
import { Match } from "../db/schema";
import { wsArcjet } from "../arcjet";

function sendJson(socket: WebSocket, payload: any) {
  // If client is not connected, end
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

// Send payload to all connected clients
function broadcast(wss: WebSocketServer, payload: any) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
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

  wss.on("connection", async (socket, req) => {
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit()
            ? "Rate limit exceeded"
            : "Forbidden";

          socket.close(code, reason);
        }
      } catch (error) {
        console.log(`WS connection error: `, error);
        socket.close(1011, "WS Arcjet protection error");
        return;
      }
    }
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    sendJson(socket, {
      type: "welcome",
    });

    socket.on("error", console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  function broadcastMatchCreated(match: Match) {
    broadcast(wss, { type: "match_created", data: match });
  }
  return { broadcastMatchCreated };
}

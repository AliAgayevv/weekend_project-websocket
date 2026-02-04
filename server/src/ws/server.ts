import { WebSocket, WebSocketServer } from "ws";
import { Server as HttpServer } from "http";
import { Match } from "../db/schema";
import { wsArcjet } from "../arcjet";

const matchSubscribers = new Map<number, Set<WebSocket>>();

function subscribe(matchId: number, socket: WebSocket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId)!.add(socket);
}

function unsubscribe(matchId: number, socket: WebSocket) {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers) return;

  subscribers.delete(socket);

  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
    return;
  }
}

function cleanupSubscriptions(socket: WebSocket) {
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket);
  }
}

function handleMessage(socket: WebSocket, data: string) {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch (error) {
    sendJson(socket, {
      type: "error",
      error: "Invalid JSON format",
    });
  }
  if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
    subscribe(message.matchId, socket);
    socket.subscriptions.add(message.matchId);
    sendJson(socket, {
      type: "subscribed",
      matchId: message.matchId,
    });
    return;
  }
  if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, socket);
    socket.subscriptions.delete(message.matchId);
    sendJson(socket, {
      type: "unsubscribed",
      matchId: message.matchId,
    });
    return;
  }
  sendJson(socket, {
    type: "error",
    error: "Unknown message type",
  });
}

function sendJson(socket: WebSocket, payload: any) {
  // If client is not connected, end
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

// Send payload to all connected clients
function broadcastToAll(wss: WebSocketServer, payload: any) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}
function broadcastToMatch(matchId: number, payload: any) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);

  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
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

    socket.subscriptions = new Set<number>();

    sendJson(socket, {
      type: "welcome",
    });

    socket.on("message", (data) => handleMessage(socket, data.toString()));

    socket.on("error", () => {
      socket.terminate();
    });

    socket.on("close", () => {
      cleanupSubscriptions(socket);
    });
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
    broadcastToAll(wss, { type: "match_created", data: match });
  }

  function broadcastCommentary(matchId: number, comment: any) {
    broadcastToMatch(matchId, { type: "commentary", data: comment });
  }

  return { broadcastMatchCreated, broadcastCommentary };
}

import { envConfig, validateEnv } from "./config/env";
import { WebSocketServer, WebSocket } from "ws";

validateEnv();

const wss = new WebSocketServer({ port: envConfig.PORT });
wss.on("connection", (socket, request) => {
  const ip: string | undefined = request.socket.remoteAddress;

  socket.on("message", (rawData) => {
    const message = rawData.toString();
    console.log({ rawData });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Server Broadcast: ${message}`);
      }
    });
  });

  socket.on("error", (error) => {
    console.error(`Error: ${error.message}: ${ip}`);
  });

  socket.on("close", () => {
    console.log(`Client disconnected`);
  });
});

console.log(`Websocket server is live on ws://localhost:${envConfig.PORT}`);

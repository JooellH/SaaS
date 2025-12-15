import net from "node:net";

const targetPort = Number.parseInt(process.env.PORT || "8080", 10);
const proxyPort = Number.parseInt(process.env.RAILWAY_PROXY_PORT || "4080", 10);

if (!Number.isFinite(targetPort) || !Number.isFinite(proxyPort)) {
  process.exit(0);
}

if (proxyPort === targetPort) {
  console.log(`Port proxy disabled (proxyPort=${proxyPort} == targetPort=${targetPort})`);
  process.exit(0);
}

const server = net.createServer((socket) => {
  const upstream = net.connect(targetPort, "127.0.0.1");

  socket.pipe(upstream);
  upstream.pipe(socket);

  const destroyBoth = () => {
    try {
      socket.destroy();
    } catch {}
    try {
      upstream.destroy();
    } catch {}
  };

  socket.on("error", destroyBoth);
  upstream.on("error", destroyBoth);
});

server.listen(proxyPort, "0.0.0.0", () => {
  console.log(`Port proxy listening on 0.0.0.0:${proxyPort} -> 127.0.0.1:${targetPort}`);
});

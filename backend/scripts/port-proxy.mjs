import net from "node:net";

const targetPort = Number.parseInt(process.env.PORT || "3000", 10);
const proxyPortsRaw =
  process.env.RAILWAY_PROXY_PORTS || "3000,8000,8080,4080";

const proxyPorts = proxyPortsRaw
  .split(",")
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value));

if (!Number.isFinite(targetPort) || proxyPorts.length === 0) {
  process.exit(0);
}

function startProxy(listenPort) {
  if (listenPort === targetPort) return;

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

  server.on("error", (error) => {
    console.log(
      `Port proxy could not bind 0.0.0.0:${listenPort} -> 127.0.0.1:${targetPort}: ${error.message}`,
    );
  });

  server.listen(listenPort, "0.0.0.0", () => {
    console.log(
      `Port proxy listening on 0.0.0.0:${listenPort} -> 127.0.0.1:${targetPort}`,
    );
  });
}

for (const port of proxyPorts) startProxy(port);

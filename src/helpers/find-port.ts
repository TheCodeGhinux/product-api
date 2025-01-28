import * as net from 'net';

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  const checkPort = (port: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false); // Port is in use
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(true); // Port is available
      });

      server.listen(port);
    });
  };

  while (!(await checkPort(port))) {
    port++;
  }
  return port;
}

export default findAvailablePort;

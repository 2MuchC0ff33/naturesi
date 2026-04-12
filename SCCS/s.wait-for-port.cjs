h26217
s 00031/00000/00000
d D 1.1 26/04/12 13:56:45 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:45 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
#!/usr/bin/env node
// Node-based wait-for-port helper (CommonJS / .cjs version)
const net = require('net');
const [,, portArg, timeoutArg] = process.argv;
const port = parseInt(portArg || '8000', 10);
const timeout = parseInt(timeoutArg || '30', 10) * 1000;
const interval = 250;
const deadline = Date.now() + timeout;
function tryConnect(){
  const sock = new net.Socket();
  let done = false;
  sock.setTimeout(1000);
  sock.once('error', () => {
    sock.destroy();
    if (Date.now() < deadline) setTimeout(tryConnect, interval);
    else { console.error(`timeout waiting for port ${port}`); process.exit(1); }
  });
  sock.once('timeout', () => {
    sock.destroy();
    if (Date.now() < deadline) setTimeout(tryConnect, interval);
    else { console.error(`timeout waiting for port ${port}`); process.exit(1); }
  });
  sock.connect(port, '127.0.0.1', () => {
    if (done) return;
    done = true;
    console.log(`port ${port} open`);
    sock.end();
    process.exit(0);
  });
}
tryConnect();
E 1

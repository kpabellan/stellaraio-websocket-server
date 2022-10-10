'use strict';
const fs = require('fs');
const uWS = require('uWebSockets.js');
const abconv = require('arraybuffer-to-string');

const port = 5432;

let openConnections = [];

const MESSAGE_ENUM = Object.freeze({
  PRODUCT_UPDATES: "PRODUCT_UPDATES"
});

const keyIsVerified = key => {
  const verifiedKeyData = fs.readFileSync('verifiedKeys.txt', 'UTF-8');
  const verifiedKeys = verifiedKeyData.split(/\r?\n/);

  if (verifiedKeys.includes(key)) {
    return true;
  } else {
    return false;
  }
};

const app = uWS.App().ws('/ws', {
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 60,
  upgrade: (res, req, context) => {
    res.upgrade({
      url: req.getUrl(),
      key: req.getQuery("key"),
      ip: res.getRemoteAddressAsText()
    }, req.getHeader('sec-websocket-key'), req.getHeader('sec-websocket-protocol'), req.getHeader('sec-websocket-extensions'), context);
  },
  open: ws => {
    if (!openConnections.find((socket, index) => {
      return socket && socket.key === ws.key;
    })) {
      let keyData = fs.readFileSync('keys.txt', 'UTF-8');
      let keys = keyData.split(/\r?\n/);

      if (keys.includes(`${ws.key}`) || keyIsVerified(`${ws.key}`)) {
        openConnections.push(ws);

        if (!keyIsVerified(`${ws.key}`)) {
          console.log(`${ws.key} connected!`);
        }

        ws.subscribe(MESSAGE_ENUM.PRODUCT_UPDATES);
      } else {
        ws.end(401);
      }
    } else {
      ws.end(403);
    }
  },
  message: (ws, data) => {
    let productInfo = JSON.parse(abconv(data));

    try {
      if (keyIsVerified(`${ws.key}`)) {
        console.log("Recieved product info, broadcasting...");
        broadcastUpdate(productInfo);
      } else {
        console.log("Error, message from unauthorized key");
      }
    } catch {
      console.log("Error, message from unauthorized key");
    }
  },
  close: (ws, code, message) => {
    if (code != 401 && code != 403) {
      openConnections.find((socket, index) => {
        if (socket && socket.key === ws.key) {
          openConnections.splice(index, 1);

          if (!keyIsVerified(`${ws.key}`)) {
            console.log(`${ws.key} disconnected!`);
          }
        }
      });
    } else if (`${ws.key}`.length < 1) {
      console.log('Denied access (no key found)');
    } else if (code == 401) {
      console.log(`${ws.key} Denied access (invalid key)`);
    } else if (!keyIsVerified(`${ws.key}`)) {
      console.log(`${ws.key} Denied access (already connected)`);
    }
  }
}).any('/*', (res, req) => {
  res.end('Nothing to see here!');
}).listen(port, token => {
  token ? console.log(`Listening to port: ${port}`) : console.log(`Failed to listen to port: ${port}`);
});

const broadcastUpdate = message => {
  app.publish(MESSAGE_ENUM.PRODUCT_UPDATES, JSON.stringify(message));
};
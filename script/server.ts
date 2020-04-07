#!/usr/bin/env node

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const contentTypes = {
  js: 'text/javascript; charset=UTF-8',
  svg: 'image/svg+xml',
  css: 'text/css; charset=UTF-8',
}

const PORT = 8080;
http.createServer(function (req, res) {
  const reqUrl = req.url || '';
  const found = reqUrl.match(/\.(.*?)$/);
  const ext = found && found[1] || '';
  const reqFile = /js|css|svg|html/.test(ext) ? path.join(__dirname, '../demo', reqUrl) :
                  req.url === '/' ? path.join(__dirname, '../demo/index.html') :
                  null;
  console.log('ext:', ext);
  let resCode;
  // TODO isDevelopment
  if (reqFile) {
    fs.readFile(reqFile, function (err, data) {
      if (err) {
        resCode = 404;
        res.writeHead(resCode);
        res.end(JSON.stringify(err));
      } else {
        resCode = 200;
        res.writeHead(resCode, { 'Content-Type': contentTypes[ext] || '' });
        res.end(data);
      }
      console.log(reqUrl, resCode);
    });
  } else {
    resCode = 404;
    res.writeHead(resCode);
    res.end('Page not found');
    console.log(reqUrl, resCode);
    return;
  }
}).listen(PORT);
console.log('Server started on ' + PORT);


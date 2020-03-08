import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const PORT = 8080;
http.createServer(function (req, res) {
  const reqUrl = req.url || '';
  const reqFile = /js$|css$|svg$|html$/.test(reqUrl) ? path.join(__dirname, '../demo', reqUrl) :
                  req.url === '/' ? path.join(__dirname, '../demo/index.html') :
                  null;
  let resCode;
  if (reqFile) {
    fs.readFile(reqFile, function (err, data) {
      if (err) {
        resCode = 404;
        res.writeHead(resCode);
        res.end(JSON.stringify(err));
      } else {
        resCode = 200;
        if (/svg$/.test(reqUrl)) {
          res.writeHead(resCode, { 'Content-Type': 'image/svg+xml' });
        } else {
          res.writeHead(resCode);
        }
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


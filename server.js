const jsonServer = require('json-server');
const cors = require('cors');
const server = jsonServer.create();
// Chỉ đường dẫn chính xác tới file db.json của bạn
const router = jsonServer.router('backend/db.json'); 
const middlewares = jsonServer.defaults();

server.use(cors());
server.use(middlewares);
server.use(router);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server đang chạy trên cổng ${port}`);
});
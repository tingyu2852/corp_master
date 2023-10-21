var mysql2 = require('mysql2')

const config = {
   //该配置是本地的数据库
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'li',
    dateStrings: true,
    multipleStatements:true,
    connectionLimit: 10 // 创建一个连接池
  };
  //该配置是服务器的数据库
  const severConfig = {
    host: '42.192.193.249',
    user: 'yu',
    password: 'Tingyu2852',
    database: 'li',
    dateStrings: true,
    multipleStatements:true,
    connectionLimit: 10 // 创建一个连接池
}
const config2={
    //该配置是本地的数据库
    host: '122.112.230.57',
    user: 'root',
    password: 'huima@rootAdmin2022',
    database: 'li',
    dateStrings: true,
    multipleStatements:true,
    connectionLimit: 10 // 创建一个连接池
}
  
  
  function createConnectionPool() {
    let connectionPool = null;
    if (!connectionPool) {
      connectionPool = mysql2.createPool(config2).promise();
    }
    return connectionPool;
  }
  
  // console.log(sql);
  module.exports = createConnectionPool;
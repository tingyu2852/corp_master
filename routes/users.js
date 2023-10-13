var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  let ipcList = [
    {
      ipcNameid:'',//ipc型号id
      ipcCategoryid:'',//ipc厂商id 
      operate:'',//操作  0关闭 1开启
      status:'',//ipc状态  0 和 1 代表开启和关闭
      ip:'172.18.11.10',//ipcIP地址
      user:'admin',//用户名
      pas:'sfxy123456'//密码
    },
    {
      ip:'172.18.11.15',
      user:'admin',
      pas:'sfxy123456'
    },
    {
      ip:'172.18.11.16',
      user:'admin',
      pas:'sfxy123456'
    },
  ]
  res.send('respond with a resource');
});

module.exports = router;

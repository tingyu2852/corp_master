var express = require('express');
const { linkSql } = require('../untils/sql');
var router = express.Router();
var sqlstr = require('../untils/sqlstr')
var multer = require('multer')
const storage = multer.diskStorage({
    // 存储位置
    destination(req, file, callback) {
      // 参数一 错误信息   参数二  上传路径（此处指定upload文件夹）
      callback(null, "E:/srt/upload")
    },
    // 确定文件名
    filename(req, file, cb) {
      cb(null, Date.now() + '.jpg')
    }
  })
  const upload = multer({ storage })

router.post('/',upload.single("file"),(req,res,next)=>{
    // if(!req.file){
    //     return res.status(400).send({code:20000,msg:'没有上传图片'})
    // }
     const imageUrl = `http://localhost/li/${req.file.filename}`;
     console.log(req.file.path);
    console.log(imageUrl)
    console.log('1')
    res.send({code:20000,url:imageUrl})
})
module.exports = router;
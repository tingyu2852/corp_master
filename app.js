var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var userRouter = require('./routes/user')
var shebeiRouter = require('./routes/shebei')
var unitRouter = require('./routes/unit')
var uploadRouter = require('./routes/upload')
var weihuRouter = require('./routes/weihu')
var kkRouter = require('./routes/kk')
var caiwuRouter = require('./routes/caiwu')
var eplRouter = require('./routes/epl')
var finaRouter = require('./routes/fina');
var aclRouter = require('./routes/acl');
const { json } = require('express/lib/response');
const jwt = require('./untils/jwt');
const { log } = require('debug/src/browser');
const { linkSql } = require('./untils/sql');

var app = express();

// const delayMiddleware = (req, res, next) => {
//   setTimeout(next, 2000);
// };
// app.use(delayMiddleware);
app.use(cors())
// view engine setup
app.all('*',(req,res,next)=>{
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,x-token');
  res.header('Access-Control-Allow-Credentials','true');
  res.header('Content-Type','multipart/form-data')
  res.header('')
  next()

  
})
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'upload')))


app.use(async(req,res,next)=>{

  //console.log(req.ip);
  if(req.url==='/master/user/login'){
    next()
  }else{
      const token = req.headers['x-token']
      const istoken = jwt.verify(token)
      if(istoken){
       // console.log(istoken);
       try {
        // console.log(istoken);
        // let data = (await linkSql(`SELECT
        // user_info.user_token_time
        // FROM
        // user_info
        // WHERE
        // user_name = '${istoken.username}'
        // `))
        // console.log(data);
        // if(data.length===0){
        //   return res.send({code:20001,message:'该账号不存在'})
        // }
        // if(data[0].user_token_time!== istoken.timeStamp){
        //   console.log(data.user_token_time);
        //   console.log(istoken.timeStamp);
        //   return res.send({code:50012,message:'该账号已在其他设备登录'})
        // }else{
          next()
          
       // }

       // next()
       } catch (error) {
        console.log(error);
          return res.send({code:20001,message:'系统出现错误，请联系管理员'})
       }
        
        //next()
      }else{
       return  res.send({code:50008,message:'登录过期，请重新登录'})
      }
  }
  
  
})
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/master/user',userRouter)
app.use('/master/shebei',shebeiRouter)
app.use('/master/unit',unitRouter)
app.use('/master/upload',uploadRouter)
app.use('/master/weihu',weihuRouter)
app.use('/master/kk',kkRouter)
app.use('/master/caiwu',caiwuRouter)
app.use('/master/epl',eplRouter)
app.use('/master/fina',finaRouter)
app.use('/master/acl',aclRouter)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

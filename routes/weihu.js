var express = require('express');
const { linkSql } = require('../untils/sql');
var router = express.Router();
var sqlstr = require('../untils/sqlstr')


router.get('/baoxiu',async(req,res)=>{
    let { current, size } = req.query
    let data = await linkSql(sqlstr.baoxiu, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(baoxiu_copy1.id) AS total FROM baoxiu_copy1`)
    res.send({ code: 20000, data: { baoxiuList: data, total: total[0].total } })
})
router.post('/baoxiu',async(req,res)=>{
    let {bx_name, shebei_id, time, bx_ren, bx_phone, bx_unitid, room_id, wx_data, wx_ren, wx_method, eq_id, eq_num, remark,bx_status,id}= req.body
    
    await linkSql(sqlstr.bx_chuli,[id])
    await linkSql(sqlstr.addWx,[bx_name, shebei_id, time, bx_ren, bx_phone, bx_unitid, room_id, wx_data, wx_ren, wx_method, eq_id, eq_num, remark])
    res.send({code:20000})
})
router.delete('/baoxiu',async(req,res)=>{
    let list = req.body
    console.log(req.body);
    try {
        let data = await linkSql(sqlstr.deleteBx,[list])
        res.send({code:20000,type:'success',msg:'删除成功'})
    } catch (error) {
        res.send({code:20000,type:'danger',msg:'删除失败'})
    }
    
})
router.post('/addbx',async(req,res)=>{
    let{bx_name, shebei_id, time, bx_ren, bx_phone, school_id, room_id}=req.body
    let bx_status = 0
    let res1 = linkSql(sqlstr.addBx,[bx_name, shebei_id, time, bx_ren, bx_phone, school_id,bx_status, room_id])
    res.send({code:20000,msg:'添加成功'})
})

router.get('/eqdetail',async(req,res)=>{
    let {room_id}= req.query
    let eqList = await linkSql(sqlstr.room_eq,[room_id])
    res.send({code:20000,eqList})
})
//查询维修记录接口
router.get('/wx',async(req,res)=>{
    let { current, size } = req.query
    let {time,school_id,building_id,room_id}=req.body
    if(time){

    }
    let data = await linkSql(sqlstr.wx_list, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(wx_log.id) AS total FROM wx_log`)
    res.send({ code: 20000, data: { WxList: data, total: total[0].total } })
})
router.post('/wx',async(req,res)=>{
    let {eq_guzhang, shebei_id, bx_time, bx_ren, bx_phone, bx_unitid, room_id, wx_time, wx_ren, wx_method, wx_eqid, wx_eqnum, remark,id} = req.body
   if(!id){
    if(!Number.isInteger(wx_eqid)){
        wx_eqid = null
        wx_eqnum = null
    }
    await linkSql(sqlstr.addWx,[eq_guzhang, shebei_id, bx_time, bx_ren, bx_phone, bx_unitid, room_id, wx_time, wx_ren, wx_method, wx_eqid, wx_eqnum, remark])
    res.send({code:20000})
   }else{
    console.log('1');
    if(!Number.isInteger(wx_eqid)){
        wx_eqid = null
        wx_eqnum = null
    }
    console.log(wx_eqid,wx_eqnum);
    await linkSql(sqlstr.updateWx,[eq_guzhang, shebei_id, bx_time, bx_ren, bx_phone, bx_unitid, room_id, wx_time, wx_ren, wx_method, wx_eqid, wx_eqnum, remark,id])
    res.send({code:20000})
   }
})
router.delete('/wx',async(req,res)=>{
    let list = req.body
    await linkSql(sqlstr.deleteWx,[list])
    res.send({code:20000})
})

router.post('/wxsx',async(req,res)=>{
    let { current, size } = req.query
    let {name,time1}=req.body
    
   try {
     
    if(name && !time1 ){
        let str = sqlstr.sx_wx + `\nWHERE room.room_name LIKE ?\nLIMIT ?,?`
        let total =await linkSql(sqlstr.total1_sx,[`%${name}%`])
        let date =await linkSql(str,[`%${name}%`,(current - 1) * size, size - 0])
       console.log(date);
        res.send({code:20000,date:{WxList:date,total: total[0].total}})
    }else if(!name && time1){
        let str = sqlstr.sx_wx + `\nWHERE wx_log.wx_time BETWEEN ? AND ?\nLIMIT ?,?`
        let total =await linkSql(sqlstr.total2_sx,[time1[0],time1[1]])
        let date =await linkSql(str,[time1[0],time1[1],(current - 1) * size, size - 0])
       
        res.send({code:20000,date:{WxList:date,total: total[0].total}})
    }else if(name && time1){
        let str = sqlstr.sx_wx + `\nWHERE wx_log.wx_time BETWEEN ? AND ?\nAND\nroom.room_name LIKE ?\nLIMIT ?,?`
        let total =await linkSql(sqlstr.total3_sx,[time1[0],time1[1],`%${name}%`])
        let date =await linkSql(str,[time1[0],time1[1],`%${name}%`,(current - 1) * size, size - 0])
       
        res.send({code:20000,date:{WxList:date,total: total[0].total}})
    }else {
        res.send({code:20000})
    }
   } catch (error) {
    return res.send({code:20000})
   }
    
})

module.exports = router;
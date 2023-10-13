var express = require('express');
const { linkSql } = require('../untils/sql');
var router = express.Router();
var sqlObj = require('../untils/sql')
var sqlstr = require('../untils/sqlstr')
var mysql = require('mysql2')
const http = require('http');
const { link } = require('fs');
//查询维修记录
router.get('/wxlist', async (req, res, next) => {
  // console.log(req.query)
  let { page, size } = req.query
  let arr = [(page - 1) * size, size - 0]
  // arr.push(limit-1)
  // console.log()
  //console.log(arr)
  //let sql = 
  let result = await sqlObj.linkSql(`SELECT id,classroom,wxdesc,accessories,wxname,remark,date FROM weixiu ORDER BY date DESC LIMIT ?,?`, arr)
  let res2 = await sqlObj.linkSql(`SELECT COUNT(id) FROM weixiu`)
  //console.log(res2[0]["COUNT(id)"])
  res.send({ code: 20000, total: res2[0]["COUNT(id)"], weixiuList: result });

  //res.send('123')
})
//修改维修记录
router.post('/wxlist', async (req, res, next) => {

  let { wxname, remark, wxdesc, accessories, classroom, date, id } = req.body
  
  try {
    await sqlObj.linkSql(`UPDATE weixiu SET classroom = ?, wxdesc = ?,accessories = ?, remark = ?,wxname = ?,date = ? WHERE id = ?`, [classroom, wxdesc, accessories, remark, wxname, date, id])
    //console.log('修改成功')
    return res.send({ code: 20000, msg: '修改成功' })
  } catch (error) {

    return res.send({ code: 20000, msg: '修改失败' })

  }

})
//删除维修记录
router.delete('/wxlist', async (req, res, next) => {
  let { id } = req.query

  try {
    await sqlObj.linkSql(`DELETE FROM weixiu WHERE id = ?`, [id])
    return res.send({ code: 20000, msg: '删除成功' })
  } catch (error) {
    return res.send({ code: 20000, msg: '删除失败' })
  }

})
//添加维修记录
router.post('/addwx', async (req, res, next) => {
  let { wxname, remark, wxdesc, accessories, classroom, date, } = req.body
  if(!remark){
    remark=null
  }
  await sqlObj.linkSql('INSERT INTO  weixiu (classroom,wxdesc,accessories,wxname,remark,date) VALUES (?,?,?,?,?,?)', [classroom, wxdesc, accessories, wxname, remark, date])
  //console.log(req.body)

  res.send({ code: 20000, msg: '添加成功' })
})
//查询设备详细信息
router.get('/eqdetail', async (req, res, next) => {
  let { current, size,pxname,pxfs } = req.query
  if(!pxname || !pxfs){
    pxname = 'equipment_detail.eq_detailId'
    pxfs = 'DESC'
  }
  let sqlstrs = sqlstr.sx_eqdetail+`ORDER BY ${pxname} ${pxfs} LIMIT ?, ?`
  let total = await sqlObj.linkSql(`SELECT Count(equipment_detail.eq_detailId) AS total FROM equipment_detail`)
  let res1 = await sqlObj.linkSql(sqlstrs, [(current - 1) * size, size - 0])
  res.send({ code: 20000, data: { eqDetailList: res1, total: total[0].total } })
})
//添加设备详细信息
router.post('/eqdetail', async (req, res, next) => {
  for (let key in req.body) {
    if (req.body[key] === '') {
      req.body[key] = null
    }
  }
  let { equipment_sn, room_id, equipment_infoId, department_id, eq_status, baofei_date, eq_detailId } = req.body

  //console.log()
  try {
    if (!eq_detailId) {

      let res1 = await linkSql(`SELECT Count(equipment_detail.eq_detailId) AS sn FROM equipment_detail WHERE equipment_detail.equipment_sn = ?`, [equipment_sn])
      if (!res1[0].sn === 0) {
        return res.send({ code: 20001, message: '该序列号已存在' })
      }

      await sqlObj.linkSql(sqlstr.addEqdetaild, [equipment_infoId, equipment_sn, room_id, department_id, eq_status, baofei_date])
    } else {
      await sqlObj.linkSql(sqlstr.updateEqdetail, [equipment_infoId, equipment_sn, room_id, department_id, eq_status, baofei_date, eq_detailId])
    }
    res.send({ code: 20000, msg: '保存成功' })
  } catch (error) {
    return res.send({ code: 20001, message: '添加失败' })
  }
})
router.delete('/eqdetail', async (req, res, next) => {
  if (req.body) {
    await sqlObj.linkSql(sqlstr.deleteEqdetail, [req.body])
    return res.send({ code: 20000, msg: '删除成功' })
  }
  res.send({ code: 20000, msg: '没有数据' })

})
//查询设备分类
router.get('/cate', async (req, res, next) => {
  let { page, size } = req.query
  let arr = [(page - 1) * size, size - 0]
  let data = await sqlObj.linkSql('SELECT * FROM equipment_cate LIMIT ?,?', arr)
  let res2 = await sqlObj.linkSql(`SELECT COUNT(equipment_cateid) FROM equipment_cate`)
  //console.log({data,total:res2[0]['COUNT(equipment_cateid)']})
  res.send({ code: 20000, data, total: res2[0]['COUNT(equipment_cateid)'] })
})

router.post('/cate', async (req, res, next) => {
  let { equipment_cateid, equipment_catename } = req.body
  if(equipment_cateid == '' || equipment_catename == ''){
    return res.send({code:20001,message:'不能出现空值'})
  }
  //如果前端传的值没有id就是增加，有id就是修改
  if (!equipment_cateid) {
    let res1 = await sqlObj.linkSql('INSERT INTO equipment_cate (equipment_catename) VALUES (?)', [equipment_catename])
    if (res1) {
      return res.send({ code: 20000, msg: '添加成功' })
    } else {
      return res.send({ code: 20000, msg: '添加失败' })
    }
  } else {
    let res2 = await sqlObj.linkSql('UPDATE equipment_cate SET equipment_catename =? WHERE equipment_cateid = ?', [equipment_catename, equipment_cateid])
    if (res2) {
      return res.send({ code: 20000, msg: '修改成功' })
    } else {
      return res.send({ code: 20000, msg: '修改失败' })
    }
  }

})

router.delete('/cate', async (req, res, next) => {
  let { id } = req.query
  let res1 = await sqlObj.linkSql('DELETE FROM equipment_cate WHERE equipment_cateid = ?', [id])
  if (res1.affectedRows) {
    return res.send({ code: 20000, msg: '删除成功' })
  } else {
    return res.send({ code: 20000, msg: '删除失败' })
  }

})

router.get('/select', async (req, res, next) => {
  let query = req.query
  if (query.schoolId) {
    try {
      let res1 = await sqlObj.linkSql('SELECT * FROM building WHERE building.school_id = ?', [query.schoolId])
      return res.send({ code: 20000, data: res1 })
    } catch (error) {
      console.log(error)
      return res.send({ code: 20000, msg: '获取失败' })
    }

  } else if (query.buildingId) {
    //console.log(query.buildingId)
    try {
      let res1 = await sqlObj.linkSql('SELECT * FROM room WHERE room.building_id = ?', [query.buildingId])
      return res.send({ code: 20000, data: res1 })
    } catch (error) {
      console.log(error)
      return res.send({ code: 20000, msg: '获取失败' })
    }

  } else {
    try {
      let res1 = await sqlObj.linkSql('SELECT * FROM `li`.`school` LIMIT 0,1000')
      return res.send({ code: 20000, data: res1 })
    } catch (error) {
      console.log(error)
      return res.send({ code: 20000, msg: '获取失败' })
    }
  }

  //res.send('123')
})
router.get('/eqcate', async (req, res, next) => {
  try {
    let res1 = await sqlObj.linkSql('SELECT * FROM `equipment_cate`')
    return res.send({ code: 20000, data: res1 })
  } catch (error) {
    return res.send({ code: 20000, msg: '获取失败' })
  }

})
//查询设备分类列表
router.get('/selecteq', async (req, res, next) => {
  let cateid = req.query.cateId
  let res1 = await sqlObj.linkSql(sqlstr.selecteq, [cateid])
  res.send({ code: 20000, data: res1 })

})
//查询部门列表
router.get('/department', async (req, res, next) => {
  let res1 = await sqlObj.linkSql(sqlstr.deparment)
  res.send({ code: 20000, data: res1 })
})
//查询设备信息列表
router.get('/eqinfo', async (req, res) => {
  let { current, size } = req.query

  try {
    let data = await linkSql(sqlstr.eqInfo, [(current - 1) * size, size - 0])
    let total = await linkSql('SELECT Count(equipment_info.equipment_id) AS total FROM equipment_info')
    res.send({ code: 20000, data: { total: total[0].total, infoList: data } })
  } catch (error) {
    res.send({ code: 20000, msg: '查询失败' })
  }
})
//查询供货商与厂家列表
router.get('/cj', async (req, res) => {
  let data1 = await linkSql(sqlstr.changjia)
  let data2 = await linkSql(sqlstr.gonghuoshang)
  res.send({ code: 20000, data: { changjia: data1, gonghuoshang: data2 } })
})
//修改或新增设备信息
router.post('/eqinfo', async (req, res) => {
  for(let key in req.body){
    if(key!='img_url'){
      if(req.body[key]==''){
        return res.send({code:20001,message:'有内容未填写'})
      }
    }
  }
  let { equipment_cateid, equipment_name, equipment_price, supplier_id, vendor_id, jinhuo_data, school_id, img_url, remark, jinhuo_num, equipment_id } = req.body
  if (!Array.isArray(img_url)) { img_url = null } else { img_url = JSON.stringify(img_url) }
  
  if (!equipment_id) {
    await linkSql(sqlstr.addInfo, [equipment_cateid, equipment_name, equipment_price, supplier_id, vendor_id, jinhuo_data, school_id, img_url, remark, jinhuo_num])
    res.send({ code: 20000, msg: '添加成功' })
  } else {
    await linkSql(sqlstr.updateInfo, [equipment_cateid, equipment_name, equipment_price, supplier_id, vendor_id, jinhuo_data, school_id, img_url, remark, jinhuo_num, equipment_id])
    res.send({ code: 20000, msg: '修改成功' })
  }
})
//删除设备信息接口
router.delete('/eqinfo',async(req,res)=>{
  let list = req.body
  //console.log(list);
  try {
    let data = await linkSql(`DELETE FROM equipment_info WHERE equipment_id in (?)`,[list])
    return res.send({code:20000,type:'success',msg:'删除成功'})
  } catch (error) {
    return res.send({code:20001,message:'删除失败'})
  }
   
})
//供货商查询接口
router.get('/supplier', async (req, res) => {
  let data = await linkSql(sqlstr.supplier)
  res.send({ code: 20000, data })
})
//供应商添加及修改接口
router.post('/supplier', async (req, res) => {
  let { supplier_name, supplier_id } = req.body
  if(!supplier_name){
    return res.send({code:20001,message:'不允许添加空值'})
  }
  try {
    if (supplier_id) {
      let data = await linkSql(sqlstr.updateSupplier, [supplier_name, supplier_id])
      res.send({ code: 20000, msg: '修改成功' })
    } else {
      let data = await linkSql(sqlstr.addsupplier, [supplier_name])
      res.send({ code: 20000, msg: '添加成功' })
    }
  } catch (error) {
    res.send({ code: 20000, msg: '失败' })
  }
})
//供应商删除接口
router.delete('/supplier', async (req, res) => {
  let { supplier_id } = req.body
  console.log(sqlstr.deleteSupplier)
  console.log(supplier_id);
  //res.send({code:20000})
  try {
    let data = await linkSql(sqlstr.deleteSupplier, [supplier_id])
    res.send({ code: 20000, msg: '删除成功' })
  } catch (error) {
    res.send({ code: 20000, msg: '删除失败' })
  }
})
//出厂商查询接口
router.get('/vendor', async (req, res) => {
  let data = await linkSql(sqlstr.vendor)
  res.send({ code: 20000, data })
})
//出厂商添加及修改接口
router.post('/vendor', async (req, res) => {
  let { vendor_name, vendor_id } = req.body
  if(!vendor_name){
    return res.send({code:20001,message:'不允许添加空值'})
  }
  try {
    if (vendor_id) {
      let data = await linkSql(sqlstr.updateVendor, [vendor_name, vendor_id])
      res.send({ code: 20000, msg: '修改成功' })
    } else {
      let data = await linkSql(sqlstr.addVendor, [vendor_name])
      res.send({ code: 20000, msg: '添加成功' })
    }
  } catch (error) {
    res.send({ code: 20000, msg: '失败' })
  }
})
//出厂商删除接口
router.delete('/vendor', async (req, res) => {
  let { vendor_id } = req.body

  //res.send({code:20000})
  try {
    let data = await linkSql(sqlstr.deleteVendor, [vendor_id])
    res.send({ code: 20000, msg: '删除成功' })
  } catch (error) {
    res.send({ code: 20000, msg: '删除失败' })
  }
})
//设备消息信息筛选接口
router.get('/sxeq',async(req,res)=>{
  let{sxname,sxtj,current, size,pxname,pxfs}=req.query
  if(!pxname || !pxfs){
    pxname = 'equipment_detail.eq_detailId'
    pxfs = 'ASC'
  }
  try {
    let data = await linkSql(sqlstr.sx_eqdetail+`\nWHERE\n${sxname} LIKE '%${sxtj}%'\nORDER BY ${pxname} ${pxfs}\nLIMIT ${(current-1)*size}, ${size-0}`)
    let total =await linkSql(sqlstr.sx_eqdetails+`\nWHERE\n${sxname} LIKE '%${sxtj}%'`,)
    
   return res.send({code:20000,date:{eqDetailList:data,total: total[0].total}})
    
  } catch (error) {
    return res.send({code:20001,message:'获取失败'})
  }

})

module.exports = router;
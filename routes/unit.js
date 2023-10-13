var express = require('express');
const { linkSql } = require('../untils/sql');
var router = express.Router();
var sqlstr = require('../untils/sqlstr')

//添加单位信息接口
router.post('/add', async (req, res, next) => {
    console.log(req.body)
    let { school_name, unit_address, unit_phone, contact_name, contact_phone, unit_url, unit_remark, school_id } = req.body
    if (school_id) {
        let data = await linkSql(sqlstr.updadeUnit, [school_name, unit_address, unit_phone, contact_name, contact_phone, unit_url, unit_remark, school_id])
        return res.send({ code: 20000, msg: '修改成功' })
    } else {

        let data = await linkSql(sqlstr.addUnit, [school_name, unit_address, unit_phone, contact_name, contact_phone, unit_url, unit_remark])
        return res.send({ code: 20000, msg: '添加成功' })
    }
    res.send({ code: 20000 })
})
//删除单位信息接口
router.delete('/add', async (req, res, next) => {
    console.log(req.body)
    let data = await linkSql(sqlstr.deleteUnit, [req.body])
    res.send({ code: 20000 })
})
//查询建筑信息接口
router.get('/build', async (req, res, next) => {
    let data = await linkSql(sqlstr.build)
    res.send({ code: 20000, data })
})
//新增以及修改建筑信息接口
router.post('/build', async (req, res, next) => {
    let { building_name, school_id, building_floor, building_id } = req.body
    if (!building_id) {

        try {
            let res1 = await linkSql(sqlstr.addBuild, [building_name, school_id, building_floor])
            return res.send({ code: 20000, msg: '添加成功' })
        } catch (error) {
            return res.send({ code: 20000, msg: '添加失败' })
        }
    } else {
        try {
            let res1 = await linkSql(sqlstr.updateBuild, [building_name, school_id, building_floor, building_id])
            return res.send({ code: 20000, msg: '修改成功' })
        } catch (error) {
            return res.send({ code: 20000, msg: '修改失败' })
        }
    }


})
//删除build信息接口
router.delete('/build', async (req, res, next) => {
    let arr = req.body
    console.log(arr)
    try {
        await linkSql(sqlstr.deleteBuild, [arr])
        return res.send({ code: 20000, type: 'success', msg: '删除成功' })
    } catch (error) {
        return res.send({ code: 20000, type: 'danger', msg: '删除失败' })
    }
})
//查询房间信息接口
router.get('/room', async (req, res, next) => {
    let { current, size } = req.query
    let data = await linkSql(sqlstr.room, [(current - 1) * size, size - 0])
    let total = await linkSql(sqlstr.roomTotal)
    res.send({ code: 20000, data: { roomList: data, total: total[0].total } })
})
//添加或修改房间信息接口
router.post('/room', async (req, res, next) => {
    let { building_id, room_name, room_cate,room_img, remark, room_id } = req.body
    if(!Array.isArray(room_img)){room_img = null}else{room_img = JSON.stringify(room_img)}
    console.log(room_img)
    if (!room_id) {
        try {
            await linkSql(sqlstr.addRoom, [building_id, room_name, room_cate,room_img, remark])
            return res.send({ code: 20000, msg: '添加成功' })
        } catch (error) {
            return res.send({ code: 20000, msg: '添加失败' })
        }
    } else {
        try {
            await linkSql(sqlstr.updateRoom, [building_id, room_name, room_cate,room_img, remark, room_id])
            return res.send({ code: 20000, msg: '修改成功' })
        } catch (error) {
            return res.send({ code: 20000, msg: '修改失败' })
        }
    }

})
//删除房间信息接口
router.delete('/room', async (req, res, next) => {
    let arr = req.body
    console.log(arr)
    try {
        await linkSql(sqlstr.deleteRoom, [arr])
        return res.send({ code: 20000, type: 'success', msg: '删除成功' })
    } catch (error) {
        return res.send({ code: 20000, type: 'danger', msg: '删除失败' })
    }
})
router.post('/asd',(req,res,next)=>{
    console.log(req.body)
    res.send({code:20000})
})

module.exports = router;
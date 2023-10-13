var express = require('express');
const { linkSql } = require('../untils/sql');
var router = express.Router();
var eplStr = require('../untils/eplStr')
//学校信息查看，增加，修改，删除
router.get('/sch', async (req, res) => {
    let { current, size } = req.query

    let data = await linkSql(`SELECT sch_info.sch_id, sch_info.sch_name FROM sch_info LIMIT ?, ? `, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(sch_info.sch_id) AS total FROM sch_info`)
    res.send({ code: 20000, data: { schList: data, total: total[0].total } })
})
router.post('/sch', async (req, res) => {
    let { sch_name, sch_id } = req.body
    if (sch_name == '' || !sch_name) {
        return res.send({ code: 20001, message: '添加失败' })
    }
    if (sch_id) {
        let data = await linkSql(`UPDATE sch_info SET sch_name = ? WHERE sch_id = ?`, [sch_name, sch_id])
        return res.send({ code: 20000, message: '更新成功' })
    } else {
        let data = await linkSql(`INSERT INTO sch_info(sch_name) VALUES (?)`, [sch_name])
        return res.send({ code: 20000, message: '添加成功' })
    }
})
router.delete('/sch', async (req, res) => {
    let list = req.body
    let data = await linkSql(`DELETE FROM sch_info WHERE sch_id in (?)`, [list])
    return res.send({ code: 20000, message: '删除成功' })
})


//学历信息查看，增加，修改，删除
router.get('/edu', async (req, res) => {
    let { current, size } = req.query

    let data = await linkSql(`SELECT edu_info.edu_id, edu_info.edu_name FROM edu_info LIMIT ?, ?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(edu_info.edu_id) AS total FROM edu_info`)
    res.send({ code: 20000, data: { eduList: data, total: total[0].total } })
})
router.post('/edu', async (req, res) => {
    let { edu_name, edu_id } = req.body
    if (edu_name == '' || !edu_name) {
        return res.send({ code: 20001, message: '添加失败' })
    }
    if (edu_id) {
        let data = await linkSql(`UPDATE edu_info SET edu_name = ? WHERE edu_id = ?`, [edu_name, edu_id])
        return res.send({ code: 20000, message: '更新成功' })
    } else {
        let data = await linkSql(`INSERT INTO edu_info(edu_name) VALUES (?)`, [edu_name])
        return res.send({ code: 20000, message: '添加成功' })
    }
})
router.delete('/edu', async (req, res) => {
    let list = req.body
    let data = await linkSql(`DELETE FROM edu_info WHERE edu_id in (?)`, [list])
    return res.send({ code: 20000, message: '删除成功' })
})

//课程信息查看，增加，修改，删除
router.get('/sub', async (req, res) => {
    let { current, size } = req.query

    let data = await linkSql(`SELECT sub_info.sub_id, sub_info.sub_name FROM sub_info LIMIT ?, ?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(sub_info.sub_id) AS total FROM sub_info`)
    res.send({ code: 20000, data: { subList: data, total: total[0].total } })
})
router.post('/sub', async (req, res) => {
    let { sub_name, sub_id } = req.body
    if (sub_name == '' || !sub_name) {
        return res.send({ code: 20001, message: '添加失败' })
    }
    if (sub_id) {
        let data = await linkSql(`UPDATE sub_info SET sub_name = ? WHERE sub_id = ?`, [sub_name, sub_id])
        return res.send({ code: 20000, message: '更新成功' })
    } else {
        let data = await linkSql(`INSERT INTO sub_info(sub_name) VALUES (?)`, [sub_name])
        return res.send({ code: 20000, message: '添加成功' })
    }
})
router.delete('/sub', async (req, res) => {
    let list = req.body
    let data = await linkSql(`DELETE FROM sub_info WHERE sub_id in (?)`, [list])
    return res.send({ code: 20000, message: '删除成功' })
})

//职称信息查看，增加，修改，删除
router.get('/rank', async (req, res) => {
    let { current, size } = req.query

    let data = await linkSql(`SELECT rank_info.rank_id, rank_info.rank_name FROM rank_info LIMIT ?, ?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(rank_info.rank_id) AS total FROM rank_info`)
    res.send({ code: 20000, data: { rankList: data, total: total[0].total } })
})
router.post('/rank', async (req, res) => {
    let { rank_name, rank_id } = req.body
    if (rank_name == '' || !rank_name) {
        return res.send({ code: 20001, message: '添加失败' })
    }
    if (rank_id) {
        let data = await linkSql(`UPDATE rank_info SET rank_name = ? WHERE rank_id = ?`, [rank_name, rank_id])
        return res.send({ code: 20000, message: '更新成功' })
    } else {
        let data = await linkSql(`INSERT INTO rank_info(rank_name) VALUES (?)`, [rank_name])
        return res.send({ code: 20000, message: '添加成功' })
    }
})
router.delete('/rank', async (req, res) => {
    let list = req.body
    let data = await linkSql(`DELETE FROM rank_info WHERE rank_id in (?)`, [list])
    return res.send({ code: 20000, message: '删除成功' })
})

//部门信息查看，增加，修改，删除
router.get('/dep', async (req, res) => {
    let { current, size } = req.query

    let data = await linkSql(`SELECT dep_info.dep_id, dep_info.sch_id, dep_info.dep_name, sch_info.sch_name FROM dep_info LEFT JOIN sch_info ON dep_info.sch_id = sch_info.sch_id LIMIT ?, ?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(dep_info.dep_id) AS total FROM dep_info`)
    res.send({ code: 20000, data: { depList: data, total: total[0].total } })
})
router.post('/dep', async (req, res) => {
    let { dep_name, sch_id, dep_id } = req.body
    if (dep_name == '' || !dep_name) {
        return res.send({ code: 20001, message: '添加失败' })
    }
    if (dep_id) {
        let data = await linkSql(`UPDATE dep_info SET dep_name = ? , sch_id = ?  WHERE dep_id = ?`, [dep_name, sch_id, dep_id])
        return res.send({ code: 20000, message: '更新成功' })
    } else {
        let data = await linkSql(`INSERT INTO dep_info(dep_name,sch_id) VALUES (?,?)`, [dep_name, sch_id])
        return res.send({ code: 20000, message: '添加成功' })
    }
})
router.delete('/dep', async (req, res) => {
    let list = req.body
    let data = await linkSql(`DELETE FROM dep_info WHERE dep_id in (?)`, [list])
    return res.send({ code: 20000, message: '删除成功' })
})


//专业信息查看，增加，修改，删除
router.get('/pro', async (req, res) => {
    let { current, size } = req.query

    let data = await linkSql(`SELECT pro_info.pro_id, pro_info.pro_name FROM pro_info LIMIT ?, ?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(pro_info.pro_id) AS total FROM pro_info`)
    res.send({ code: 20000, data: { proList: data, total: total[0].total } })
})
router.post('/pro', async (req, res) => {
    let { pro_name, pro_id } = req.body
    if (pro_name == '' || !pro_name) {
        return res.send({ code: 20001, message: '添加失败' })
    }
    if (pro_id) {
        let data = await linkSql(`UPDATE pro_info SET pro_name = ? WHERE pro_id = ?`, [pro_name, pro_id])
        return res.send({ code: 20000, message: '更新成功' })
    } else {
        let data = await linkSql(`INSERT INTO pro_info(pro_name) VALUES (?)`, [pro_name])
        return res.send({ code: 20000, message: '添加成功' })
    }
})
router.delete('/pro', async (req, res) => {
    let list = req.body
    let data = await linkSql(`DELETE FROM pro_info WHERE pro_id in (?)`, [list])
    return res.send({ code: 20000, message: '删除成功' })
})


router.get('/select', async (req, res) => {
    if (!req.query.selectName) {
        let schList = await linkSql(`SELECT sch_info.sch_id, sch_info.sch_name FROM sch_info`)
        let eduList = await linkSql(`SELECT edu_info.edu_id, edu_info.edu_name FROM edu_info`)
        let subList = await linkSql(`SELECT sub_info.sub_id, sub_info.sub_name FROM sub_info`)
        let rankList = await linkSql(`SELECT rank_info.rank_id, rank_info.rank_name FROM rank_info`)
        let depList = await linkSql(`SELECT dep_info.dep_id, dep_info.sch_id, dep_info.dep_name FROM dep_info`)
        let proList = await linkSql(`SELECT pro_info.pro_id, pro_info.pro_name FROM pro_info`)
        return res.send({ code: 20000, data: { sectList: { schList, eduList, subList, rankList, depList, proList } } })
    } else {
        let schList = await linkSql(`SELECT sch_info.sch_id, sch_info.sch_name FROM sch_info`)
        return res.send({ code: 20000, data: { schList } })
    }
})


//部门信息查看，增加，修改，删除
router.get('/info', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(`SELECT
epl_info.epl_id,
epl_info.epl_name,
epl_info.sch_id,
epl_info.dep_id,
epl_info.edu_id,
epl_info.sub_id,
epl_info.rank_id,
epl_info.pro_id,
epl_info.mob_num,
edu_info.edu_name,
sch_info.sch_name,
dep_info.dep_name,
sub_info.sub_name,
rank_info.rank_name,
pro_info.pro_name
FROM
epl_info
INNER JOIN sch_info ON epl_info.sch_id = sch_info.sch_id
LEFT JOIN edu_info ON epl_info.edu_id = edu_info.edu_id
LEFT JOIN dep_info ON epl_info.dep_id = dep_info.dep_id
LEFT JOIN sub_info ON epl_info.sub_id = sub_info.sub_id
LEFT JOIN rank_info ON epl_info.rank_id = rank_info.rank_id
LEFT JOIN pro_info ON epl_info.pro_id = pro_info.pro_id
LIMIT ? ,?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(epl_info.epl_id) AS total FROM epl_info`)
    res.send({ code: 20000, data: { eplList: data, total: total[0].total } })
})
router.post('/info', async (req, res) => {
    let { epl_name, sch_id, dep_id, edu_id, sub_id, rank_id, mob_num, pro_id, epl_id } = req.body
    if (epl_name == '' || !epl_name) {
        return res.send({ code: 20001, message: '添加失败' })
    }
    if (epl_id) {
        let data = await linkSql(`UPDATE epl_info SET epl_name = ? , sch_id = ?,dep_id = ?,edu_id = ?,sub_id = ?,rank_id = ?,mob_num = ?,pro_id = ?  WHERE epl_id = ?`, [epl_name, sch_id, dep_id, edu_id, sub_id, rank_id, mob_num, pro_id, epl_id])
        return res.send({ code: 20000, message: '更新成功' })
    } else {
        let data = await linkSql(`INSERT INTO epl_info(epl_name,sch_id,dep_id, edu_id,sub_id,rank_id,mob_num,pro_id ) VALUES (?,?,?,?,?,?,?,?)`, [epl_name, sch_id, dep_id, edu_id, sub_id, rank_id, mob_num, pro_id])
        return res.send({ code: 20000, message: '添加成功' })
    }
})
router.delete('/info', async (req, res) => {
    let list = req.body
    let data = await linkSql(`DELETE FROM epl_info WHERE epl_id in (?)`, [list])
    return res.send({ code: 20000, message: '删除成功' })
})


router.get('/proj', async (req, res) => {
    let { current, size } = req.query

    let data = await linkSql(`SELECT proj_info.proj_id, proj_info.proj_name, proj_info.proj_explain, proj_info.start_time, proj_info.end_time, proj_info.proj_sn FROM proj_info LIMIT ?, ?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(proj_info.proj_id) AS total FROM proj_info`)
    res.send({ code: 20000, data: { projList: data, total: total[0].total } })
})

router.post('/proj', async (req, res) => {
    let { proj_name, proj_explain, start_time, end_time, proj_sn, proj_id } = req.body
    if (proj_name == '' || !proj_name) {
        return res.send({ code: 20001, message: '添加失败' })
    }
    if (proj_id) {
        let data = await linkSql(`UPDATE proj_info SET proj_name = ? , proj_explain = ?,start_time = ?,end_time = ?,proj_sn = ?  WHERE proj_id = ?`, [proj_name, proj_explain, start_time, end_time, proj_sn, proj_id])
        return res.send({ code: 20000, message: '更新成功' })
    } else {
        let data = await linkSql(`INSERT INTO proj_info(proj_name,proj_explain,start_time, end_time,proj_sn ) VALUES (?,?,?,?,?)`, [proj_name, proj_explain, start_time, end_time, proj_sn])
        return res.send({ code: 20000, message: '添加成功' })
    }
})
router.delete('/proj', async (req, res) => {
    let list = req.body
    let data = await linkSql(`DELETE FROM proj_info WHERE proj_id in (?)`, [list])
    return res.send({ code: 20000, message: '删除成功' })
})

//人员授权
router.get('/acc', async (req, res) => {
    let { proj_id } = req.query
    let { eplList, accList } = await linkSql('', [], true, async (promisePool) => {
        try {
            let data1 = await promisePool.query(eplStr.eplList)
            let data2 = await promisePool.query(`${eplStr.acl} \n WHERE proj_id = ?`, [proj_id])
            promisePool.end(err => {
                console.log(err);
            })
            let obj =
            {
                eplList: data1[0],
                accList: data2[0]
            }

            return obj
        } catch (error) {
            console.log(error);
        }
    })
    eplList.forEach(item => {
        item.acc = false
        item.acl_id = null
        for (let items of accList) {
            if (item.epl_id == items.epl_id) {
                item.acl_id = items.acl_id
                item.acc = true
                break
            }
        }
    })
    res.send({ code: 20000, data: { eplList, accList }, message: '成功' })
})

router.post('/acc', async (req, res) => {
    let { operate } = req.query
    let  list  =req.body
    if (operate == 'acc') {
        try {
            let data = await linkSql('', [], true, async (sql) => {
                for (let item of list) {
                    let data1 = await sql.query(`INSERT INTO acl_info(proj_id, epl_id) VALUES (?, ?)`, [item.proj_id, item.epl_id])
                }
                await sql.end(err => {
                    console.log(err);
                })
                return true
            })
            return res.send({ code: 20000, message: '授权成功' })
        } catch (error) {
            console.log(error);
            return res.send({ code: 20001, message: '失败' })
        }
    }
    if (operate == 'cancel') {
        try {
            
            let data = await linkSql(`DELETE FROM acl_info WHERE acl_id in (?)`, [list])
            return res.send({ code: 20000, message: '操作成功' })
        } catch (error) {
            console.log(error);
            return res.send({ code: 20001, message: '失败' })
        }
    }
    res.send({ code: 20001, message: '失败' })
})




module.exports = router;
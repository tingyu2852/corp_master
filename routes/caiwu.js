var express = require('express');
const { linkSql, linkSeverSql } = require('../untils/sql');
const { updateRate } = require('../untils/updateInter')
const caiwuStr = require('../untils/caiwuStr')
var router = express.Router();
var dayjs = require('dayjs')
router.get('/credit', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(caiwuStr.creditList, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(tbl_credit_rec.crd_rec_id) AS total FROM tbl_credit_rec`)
    res.send({ code: 20000, data: { creditList: data, total: total[0].total } })
})
router.get('/select', async (req, res) => {

    if ((req.query.select - 0) == 1) {

        let bankList = await linkSql(`SELECT tbl_bank_info.bank_id, tbl_bank_info.bank_name FROM tbl_bank_info`)
        let corpList = await linkSql(`SELECT tbl_corp_info.corp_id, tbl_corp_info.corp_name FROM tbl_corp_info`)
        let projList = await linkSql(`SELECT tbl_proj_info.proj_id, tbl_proj_info.proj_name, tbl_proj_info.proj_intro FROM tbl_proj_info`)
        res.send({ code: 20000, data: { bankList, corpList, projList } })
    } else {
        let finaList = await linkSql(`SELECT tbl_fina_typ.fina_id, tbl_fina_typ.fina_name FROM tbl_fina_typ`)
        let guarList = await linkSql(`SELECT
    tbl_guar_typ.guar_id,
    tbl_guar_typ.guar_name
    FROM
    tbl_guar_typ
    `)
        let bankList = await linkSql(`SELECT tbl_bank_info.bank_id, tbl_bank_info.bank_name FROM tbl_bank_info`)

        res.send({ code: 20000, data: { finaList, guarList, bankList } })
    }


})
router.post('/credit', async (req, res) => {
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    let { corp_id, proj_id, bank_id, rec_loan, bgn_date, end_date, crd_rec_id } = req.body
    if (!crd_rec_id) {
        let res1 = await linkSql(caiwuStr.addCredit, [corp_id, proj_id, bank_id, rec_loan, bgn_date, end_date])
        return res.send({ code: 20000, msg: '添加成功' })
    } else {
        let res1 = await linkSql(caiwuStr.updateCredit, [corp_id, proj_id, bank_id, rec_loan, bgn_date, end_date, crd_rec_id])
        return res.send({ code: 20000, msg: '修改成功' })
    }

})
router.delete('/credit', async (req, res) => {
    let { delList } = req.body
    console.log(delList);
    try {
        let res1 = await linkSql(caiwuStr.delCredit, [delList])
        return res.send({ code: 20000, messahe: '删除成功' })
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }

})
router.get('/rpy', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(caiwuStr.rpyList, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(tbl_rpy_rec.rpy_rec_id) AS total FROM tbl_rpy_rec`)
    res.send({ code: 20000, data: { rpyList: data, total: total[0].total } })
})
router.post('/rpy', async (req, res) => {
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    let { corp_id, bank_id, proj_id, prin_rec, accr_rec, rpy_date, rpy_rec_id } = req.body
    if (!rpy_rec_id) {
        let res1 = await linkSql(caiwuStr.addRpy, [corp_id, bank_id, proj_id, prin_rec, accr_rec, rpy_date])
        return res.send({ code: 20000, msg: '添加成功' })
    } else {
        let res1 = await linkSql(caiwuStr.updateRpy, [corp_id, bank_id, proj_id, prin_rec, accr_rec, rpy_date, rpy_rec_id])
        return res.send({ code: 20000, msg: '修改成功' })
    }

})
router.delete('/rpy', async (req, res) => {
    let { delList } = req.body
    console.log(delList);
    try {
        let res1 = await linkSql(caiwuStr.delRpy, [delList])
        return res.send({ code: 20000, messahe: '删除成功' })
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }

})

router.get('/bank', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(`SELECT tbl_bank_info.bank_id, tbl_bank_info.bank_name FROM tbl_bank_info LIMIT ?,?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(tbl_bank_info.bank_id) AS total FROM tbl_bank_info`)
    res.send({ code: 20000, data: { bankList: data, total: total[0].total } })
})

router.post('/bank', async (req, res) => {
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    let { bank_name, bank_id } = req.body
    if (!bank_id) {
        let res1 = await linkSql(`INSERT INTO tbl_bank_info(bank_name) VALUES (?)`, [bank_name])
        return res.send({ code: 20000, msg: '添加成功' })
    } else {
        let res1 = await linkSql(`UPDATE tbl_bank_info SET bank_name = ? WHERE bank_id = ?`, [bank_name, bank_id])
        return res.send({ code: 20000, msg: '修改成功' })
    }

})
router.delete('/bank', async (req, res) => {
    let { delList } = req.body
    console.log(delList);
    try {
        // let res1 = await linkSql(`DELETE FROM tbl_bank_info WHERE bank_id in (?)`, [delList])
        // return res.send({ code: 20000, messahe: '删除成功' })
        let data1 = await linkSql('', '', true, async (sql) => {
            try {
                let asd = await sql.query(`DELETE FROM tbl_bank_info WHERE bank_id in (?) AND bank_name NOT in (SELECT agmt_part FROM tbl_agmt_info)`, [delList])
                console.log(asd,'-----');

                return asd

            } catch (error) {
                console.log(error);
                error.li = 'error'
                return error
            }

        })
        if (data1.errno == 1451) {
            return res.send({ code: 20001, message: '该信息绑定有子信息，请先删除子信息' })
        }
        

        res.send({ code: 20000, message: '成功' })
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }

})

router.get('/corp', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(`SELECT tbl_corp_info.corp_id, tbl_corp_info.corp_name,tbl_corp_info.corp_cate FROM tbl_corp_info LIMIT ?, ?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(tbl_corp_info.corp_id) AS total FROM tbl_corp_info`)
    res.send({ code: 20000, data: { corpList: data, total: total[0].total } })
})

router.post('/corp', async (req, res) => {
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    let { corp_name, corp_id, corp_cate } = req.body
    if (!corp_id) {
        let res1 = await linkSql(`INSERT INTO tbl_corp_info(corp_name,corp_cate) VALUES (?,?)`, [corp_name, corp_cate])
        return res.send({ code: 20000, msg: '添加成功' })
    } else {
        let res1 = await linkSql(`UPDATE tbl_corp_info SET corp_name = ?,corp_cate= ? WHERE corp_id = ?`, [corp_name, corp_cate, corp_id])
        return res.send({ code: 20000, msg: '修改成功' })
    }

})
router.delete('/corp', async (req, res) => {
    let { delList } = req.body
    try {
        // let res1 = await linkSql(`DELETE FROM tbl_corp_info WHERE corp_id in (?)`, [delList])
        // return res.send({ code: 20000, messahe: '删除成功' })
        let data1 = await linkSql('', '', true, async (sql) => {
            try {
                let asd = await sql.query(`DELETE FROM tbl_corp_info WHERE corp_id in (?) AND corp_name NOT in (SELECT agmt_part FROM tbl_agmt_info)`, [delList])

                return asd

            } catch (error) {

                error.li = 'error'
                return error
            }

        })
        if (data1.errno == 1451) {
            return res.send({ code: 20001, message: '该信息绑定有子信息，请先删除子信息' })
        }
        // if (!data1.affectedRows) {
        //     if (delList.length == 1) {
        //         return res.send({ code: 20001, message: '该信息绑定有子信息或不存在，请先删除子信息' })
        //     }
        //     return res.send({ code: 20001, message: '无数据受到影响或存在子信息绑定情况' })
        // }

        res.send({ code: 20000, message: '成功' })
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }

})


router.get('/proj', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(caiwuStr.getProj, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(tbl_proj_info.proj_id) AS total FROM tbl_proj_info`)
    res.send({ code: 20000, data: { projList: data, total: total[0].total } })
})

router.post('/proj', async (req, res) => {
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    let { proj_name, proj_intro, cred_lim, bgn_date, end_date, map_rpy, map_accr, fina_id, guar_id, proj_id } = req.body
    if (!proj_id) {
        let res1 = await linkSql(caiwuStr.addProj, [proj_name, proj_intro, cred_lim, bgn_date, end_date, map_rpy, map_accr, fina_id, guar_id])
        return res.send({ code: 20000, msg: '添加成功' })
    } else {
        let res1 = await linkSql(caiwuStr.updateProj, [proj_name, proj_intro, cred_lim, bgn_date, end_date, map_rpy, map_accr, fina_id, guar_id, proj_id])
        return res.send({ code: 20000, msg: '修改成功' })
    }

})
router.delete('/proj', async (req, res) => {
    let { delList } = req.body
    try {
        let res1 = await linkSql(`DELETE FROM tbl_proj_info WHERE proj_id in (?)`, [delList])
        return res.send({ code: 20000, messahe: '删除成功' })
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }

})

//品种信息
router.get('/fina', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(`SELECT tbl_fina_typ.fina_id, tbl_fina_typ.fina_name FROM tbl_fina_typ LIMIT ?, ?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(tbl_fina_typ.fina_id) AS total FROM tbl_fina_typ`)
    res.send({ code: 20000, data: { finaList: data, total: total[0].total } })
})

router.post('/fina', async (req, res) => {
    console.log(req.body);
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    let { fina_name, fina_id } = req.body
    if (!fina_id) {
        let res1 = await linkSql(`INSERT INTO tbl_fina_typ(fina_name) VALUES (?)`, [fina_name])
        return res.send({ code: 20000, msg: '添加成功' })
    } else {
        let res1 = await linkSql(`UPDATE tbl_fina_typ SET fina_name = ? WHERE fina_id = ?`, [fina_name, fina_id])
        return res.send({ code: 20000, msg: '修改成功' })
    }

})
router.delete('/fina', async (req, res) => {
    let { delList } = req.body
    try {
        let res1 = await linkSql(`DELETE FROM tbl_fina_typ WHERE fina_id in (?)`, [delList])
        return res.send({ code: 20000, messahe: '删除成功' })
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }

})

//项目担保信息
router.get('/guar', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(`SELECT
    tbl_guar_typ.guar_id,
    tbl_guar_typ.guar_name
    FROM
    tbl_guar_typ
    LIMIT ?, ?
    `, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(tbl_guar_typ.guar_id) AS total FROM tbl_guar_typ`)
    res.send({ code: 20000, data: { guarList: data, total: total[0].total } })
})

router.post('/guar', async (req, res) => {
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    let { guar_name, guar_id } = req.body
    if (!guar_id) {
        let res1 = await linkSql(`INSERT INTO tbl_guar_typ(guar_name) VALUES (?)`, [guar_name])
        return res.send({ code: 20000, msg: '添加成功' })
    } else {
        let res1 = await linkSql(`UPDATE tbl_guar_typ SET guar_name = ? WHERE guar_id = ?`, [guar_name, guar_id])
        return res.send({ code: 20000, msg: '修改成功' })
    }

})
router.delete('/guar', async (req, res) => {
    let { delList } = req.body
    try {
        let res1 = await linkSql(`DELETE FROM tbl_guar_typ WHERE guar_id in (?)`, [delList])
        return res.send({ code: 20000, messahe: '删除成功' })
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }

})


//资金流转
router.get('/pl', async (req, res) => {
    let { current, size, selectName, rec_con_id } = req.query
    try {
        if (selectName == 'pl') {
            let data = await linkSql(caiwuStr.ptList, [(current - 1) * size, size - 0])
            let total = await linkSql(`SELECT Count(tbl_con_rec.con_id) AS total FROM tbl_con_rec`)
            return res.send({ code: 20000, data: { plList: data, total: total[0].total } })
        }
        if (selectName == 'mt') {
            let data = await linkSql(caiwuStr.mtList, [rec_con_id])
            return res.send({ code: 20000, data: { mtList: data } })
        }
        if (selectName == 'sp') {
            let data = await linkSql(caiwuStr.spList, [rec_con_id])
            return res.send({ code: 20000, data: { spList: data } })

        }
    } catch (error) {
        console.log(error);
        return res.send({ code: 20001, message: '请求失败' })
    }
    res.send({ code: 20001, message: '查询错误' })
})


router.post('/pl', async (req, res) => {

    try {
        let { name } = req.query
        const today = dayjs().format('YYYYMMDD');
        let idStr = `${name}${today}%`
        let str = `SELECT
    tbl_con_rec.con_rec_id
    FROM
    tbl_con_rec
    WHERE
    tbl_con_rec.con_rec_id LIKE '${idStr}'
    ORDER BY
    tbl_con_rec.con_rec_id DESC
    LIMIT 0,1`
        let cls_id = ''
        switch (name) {
            case 'PL':
                cls_id = 'CLS_001'
                break;
            case 'MT':
                cls_id = 'CLS_002'
                break;
            case 'SP':
                cls_id = 'CLS_003'
                break;
            default:
                return res.send({ code: 20001, message: '错误' })

        }


        const { con_rec_amu, con_rec_name, con_rec_date, con_rec_sou, con_id, agmt_id } = req.body
        if (!con_id) {
            let data = await linkSql('', '', true, async (sql) => {
                let data1 = await sql.query(str)
                if (!data1[0].length) {
                    if (cls_id == 'CLS_001') {
                        let con_rec_id = `${name}${today}0001`
                        await sql.query(`INSERT INTO tbl_con_rec(cls_id, con_rec_id, con_rec_amu, con_rec_name, con_rec_date,agmt_id) VALUES (?,?,?,?,?,?)`, [cls_id, con_rec_id, con_rec_amu, con_rec_name, con_rec_date, agmt_id])
                        return res.send({ code: 20000, message: '保存成功' })
                    } else {
                        let con_rec_id = `${name}${today}0001`
                        await sql.query(`INSERT INTO tbl_con_rec(cls_id, con_rec_id, con_rec_amu, con_rec_name, con_rec_date,con_rec_sou,agmt_id) VALUES (?,?,?,?,?,?,?)`, [cls_id, con_rec_id, con_rec_amu, con_rec_name, con_rec_date, con_rec_sou, agmt_id])
                        return res.send({ code: 20000, message: '保存成功' })
                    }
                } else {
                    let con_rec_id = data1[0][0].con_rec_id
                    let lastFourDigits = con_rec_id.slice(-4); // 获取后四位数字
                    let newFourDigits = (parseInt(lastFourDigits) + 1).toString(); // 将后四位数字加 11
                    newFourDigits = newFourDigits.toString().padStart(4, '0');
                    con_rec_id = con_rec_id.replace(lastFourDigits, newFourDigits);
                    if (cls_id == 'CLS_001') {
                        await sql.query(`INSERT INTO tbl_con_rec(cls_id, con_rec_id, con_rec_amu, con_rec_name, con_rec_date,agmt_id) VALUES (?,?,?,?,?,?)`, [cls_id, con_rec_id, con_rec_amu, con_rec_name, con_rec_date, agmt_id])
                        //console.log(newStr);

                        return res.send({ code: 20000, message: '保存成功' })
                    } else {
                        await sql.query(`INSERT INTO tbl_con_rec(cls_id, con_rec_id, con_rec_amu, con_rec_name, con_rec_date,con_rec_sou,agmt_id) VALUES (?,?,?,?,?,?,?)`, [cls_id, con_rec_id, con_rec_amu, con_rec_name, con_rec_date, con_rec_sou, agmt_id])
                        //console.log(newStr);

                        return res.send({ code: 20000, message: '保存成功' })
                    }
                }
                //let id = data1[0][0].con_rec_id


            })
        } else {
            let data1 = await linkSql(`UPDATE tbl_con_rec SET con_rec_amu = ?, con_rec_name = ?, con_rec_date = ?,agmt_id=? WHERE con_id = ? `, [con_rec_amu, con_rec_name, con_rec_date, agmt_id, con_id])
            return res.send({ code: 20000, message: '保存成功' })
        }
    } catch (error) {
        return res.send({ code: 20001, message: '出现错误' })
    }

})


router.delete('/pl', async (req, res) => {
    let list = req.body

    try {
        // let res1 = await linkSql(`DELETE FROM tbl_con_rec WHERE con_id in (?)`, [list])
        // return res.send({ code: 20000, messahe: '删除成功' })
        let data1 = await linkSql('', '', true, async (sql) => {
            try {
                let asd = await sql.query(`DELETE FROM tbl_con_rec WHERE con_id in (?)`, [list])

                console.log(123);
            } catch (error) {

                if (error.errno == 1451) {

                    return error.errno
                }
            }

        })

        console.log(data1);
        if (data1 == 1451) {
            return res.send({ code: 20001, message: '该信息绑定有子信息，请先删除子信息' })
        }
        return res.send({ code: 20000, messahe: '删除成功' })
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }
})
//合同类信息接口
router.get('/agmt', async (req, res) => {
    let { current, size, selectName, agmt_id } = req.query
    try {
        if (current) {
            let data = await linkSql(caiwuStr.agmtList, [(current - 1) * size, size - 0])
            let total = await linkSql(`SELECT Count(tbl_agmt_info.agmt_index_id) AS total FROM tbl_agmt_info`)
            return res.send({ code: 20000, data: { agmtList: data, total: total[0].total } })
        }
        if (selectName == 'agmt') {
            let sqlStr = `SELECT
        tbl_agmt_info.agmt_id,
        tbl_agmt_info.agmt_name
        FROM
        tbl_agmt_info`
            let data = await linkSql(sqlStr)

            return res.send({ code: 20000, data: { agmtList: data } })
        }
        if (selectName == 'agmt_id') {
            let sqlStr = `SELECT
            tbl_agmt_info.agmt_id,
            tbl_agmt_info.agmt_name,
            tbl_agmt_info.agmt_value,
            tbl_agmt_info.beg_date,
            tbl_agmt_info.end_date,
            tbl_agmt_info.agmt_note,
            tbl_agmt_info.agmt_part
        FROM
        tbl_agmt_info
        WHERE
        tbl_agmt_info.agmt_id = '${agmt_id}'`
            let data = await linkSql(sqlStr)

            return res.send({ code: 20000, data: { agmtList: data } })
        }
    } catch (error) {
        console.log(error);
        return res.send({ code: 20001, message: '错误' })
    }


})

router.post('/agmt', async (req, res) => {
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    try {
        let { agmt_cate, agmt_name, agmt_value, beg_date, end_date, agmt_note, agmt_part, agmt_index_id } = req.body
        let agmt_id = ''
        let sql_str = `SELECT
    tbl_agmt_info.agmt_id
    FROM
    tbl_agmt_info
    WHERE
    tbl_agmt_info.agmt_id LIKE '${agmt_cate}%'
    ORDER BY
    tbl_agmt_info.agmt_id DESC
    LIMIT 0, 1`

        if (!agmt_index_id) {
            let data = await linkSql('', '', true, async (sql) => {
                let data1 = await sql.query(sql_str)
                console.log(data1[0]);
                if (data1[0].length) {
                    agmt_id = data1[0][0].agmt_id
                    let lastFourDigits = agmt_id.slice(-4); // 获取后四位数字
                    let newFourDigits = (parseInt(lastFourDigits) + 1).toString(); // 将后四位数字加 11
                    newFourDigits = newFourDigits.toString().padStart(4, '0');
                    agmt_id = agmt_id.replace(lastFourDigits, newFourDigits);
                    await sql.query(caiwuStr.addAgmt, [agmt_id, agmt_name, agmt_value, beg_date, end_date, agmt_note, agmt_part])
                } else {
                    console.log(1);
                    agmt_id = `${agmt_cate}0001`
                    await sql.query(caiwuStr.addAgmt, [agmt_id, agmt_name, agmt_value, beg_date, end_date, agmt_note, agmt_part])
                }

            })

            return res.send({ code: 20000, msg: '添加成功' })
        } else {
            let res1 = await linkSql(caiwuStr.updateAgmt, [agmt_name, agmt_value, beg_date, end_date, agmt_note, agmt_part, agmt_index_id])
            return res.send({ code: 20000, msg: '修改成功' })
        }

    } catch (error) {
        console.log(error);
        return res.send({ code: 20001, message: '出现错误' })
    }

})

router.delete('/agmt', async (req, res) => {
    let list = req.body
    try {
        // let data = await linkSql(`DELETE FROM tbl_agmt_info WHERE agmt_index_id in (?)`, [list])
        //console.log(data);

        let data1 = await linkSql('', '', true, async (sql) => {
            try {
                let asd = await sql.query(`DELETE FROM tbl_agmt_info WHERE agmt_index_id in (?)`, [list])
                console.log(123);
            } catch (error) {

                if (error.errno == 1451) {

                    return error.errno
                }
            }

        })

        console.log(data1);
        if (data1 == 1451) {
            return res.send({ code: 20001, message: '该信息绑定有子信息，请先删除子信息' })
        }


        res.send({ code: 20000, message: '成功' })
    } catch (error) {
        console.log(error);
        return res.send({ code: 20001, message: '失败' })
    }

})


router.get('/abx', async (req, res) => {
    let i = 0;
    let start = new Date().getTime();

    while (new Date().getTime() - start < 1000) {
        i++;
    }

    console.log(i);
    res.send({ code: 20000, data: { i: i } })

})


router.get('/rate', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSql(`SELECT rate_info.rate_id,rate_info.date, rate_info.rate,rate_info.remark FROM rate_info LIMIT ?,?`, [(current - 1) * size, size - 0])
    let total = await linkSql(`SELECT Count(rate_info.rate_id) AS total FROM rate_info`)
    res.send({ code: 20000, data: { rateList: data, total: total[0].total } })
})

router.post('/rate', async (req, res) => {
    for (let key in req.body) {
        if (req.body[key] == '') {
            req.body[key] = null
        }
    }
    let { date, rate, remark, rate_id } = req.body
    console.log(rate);
    rate = parseFloat(rate)
    console.log(rate);
    if (!rate_id) {
        let res1 = await linkSql(`INSERT INTO rate_info(date,rate,remark) VALUES (?,?,?)`, [date, rate, remark])

    } else {
        let res1 = await linkSql(`UPDATE rate_info SET date = ? ,rate = ?,remark = ? WHERE rate_id = ?`, [date, rate, remark, rate_id])

    }


    res.send({ code: 20000, msg: '添加成功' })
    //updateRate()

})

router.delete('/rate', async (req, res) => {
    let { delList } = req.body
    try {
        // let res1 = await linkSql(`DELETE FROM tbl_bank_info WHERE bank_id in (?)`, [delList])
        // return res.send({ code: 20000, messahe: '删除成功' })
        let data1 = await linkSql('', '', true, async (sql) => {
            try {
                let asd = await sql.query(`DELETE FROM rate_info WHERE rate_id in (?) `, [delList])
                console.log(asd);

                return asd

            } catch (error) {

                error.li = 'error'
                return error
            }

        })
        if (data1.errno == 1451) {
            return res.send({ code: 20001, message: '该信息绑定有子信息，请先删除子信息' })
        }
        if (!data1.affectedRows) {
            if (delList.length == 1) {
                return res.send({ code: 20001, message: '该信息绑定有子信息或不存在，请先删除子信息' })
            }
            return res.send({ code: 20001, message: '无数据受到影响' })
        }

        res.send({ code: 20000, message: '成功' })
        updateRate()
    } catch (error) {
        return res.send({ code: 20001, messahe: '删除失败' })
    }

})
module.exports = router;
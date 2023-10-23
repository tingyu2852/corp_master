var express = require('express');
const { linkSql, linkMySql } = require('../untils/sql');
const finaStr = require('../untils/finaStr')
var router = express.Router();
var dayjs = require('dayjs');
const { computrRepay, updateRate, updatePlan, updatePlanInter,updateInfo,repayTotal } = require('../untils/updateInter')
var isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
// import isSameOrBefore from 'dayjs/plugin/isSameOrBefore' // ES 2015
const isBetween = require('dayjs/plugin/isBetween')
const QuarterOfYear = require('dayjs/plugin/QuarterOfYear')
const isLeapYear = require('dayjs/plugin/isLeapYear')
//const isBefore = require('dayjs/plugin/isBefore')

dayjs.extend(isSameOrBefore) // use plugin
dayjs.extend(isBetween)
dayjs.extend(QuarterOfYear)
dayjs.extend(isLeapYear)


//dayjs.extend(isBefore)
//获取项目信息
router.get('/proj', async (req, res) => {
   try {
    let { current, size } = req.query

    let total = await linkSql(`SELECT Count(proj_basice.proj_id) AS total FROM proj_basice`)

    let data = await linkSql(finaStr.projList, [(current - 1) * size, size - 0])
    res.send({ code: 20000, data: { projList: data, total: total[0].total } })
   } catch (error) {
        res.send({code:20001,message:'错误'})
   }

})
//获取借款信息id
router.get('/loanlist', async (req, res) => {
    let { proj_id } = req.query
    const str = `SELECT
    loan_info.loan_id
    FROM
    loan_info
    INNER JOIN rep_info ON loan_info.rep_id = rep_info.rep_id
    WHERE
    rep_info.proj_id = '${proj_id}'
    `
    try {
        let data = await linkSql(str)
        res.send({ code: 20000, data: { loanList: data } })
    } catch (error) {
        res.send({ code: 20001, message: '系统出现错误' })
    }

})
//删除项目信息接口
router.delete('/proj', async (req, res) => {
    try {
     console.log(req.body);
     const data = await linkSql(`DELETE FROM proj_basice WHERE proj_id in (?)`,[req.body])
    
     res.send({ code: 20000})
    } catch (error) {
        console.log(error);
         res.send({code:20001,message:'错误'})
    }
 
 })

//新增或修改项目基础信息接口
router.post('/proj', async (req, res) => {

    try {
        let { name } = req.query
       //新增项目基础信息
        if (name == 'add') {
            
            let { proj_name, fina_name, proj_status, corp_name, proj_remark, hidden_debt } = req.body.projForm
            //let {, fina_name, proj_status, corp_name, ysProjId } = req.body.repForm
            let { bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark, bank_consortium, sub_project,sub_project_list } = req.body.repForm
            proj_status = 1
            sub_project_list = Array.isArray(sub_project_list)?sub_project_list:[]
            let data = await linkMySql(async sql => {
                try {
                    let nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
                    const year = dayjs().format('YYYY')
                    await sql.beginTransaction()
                    let cur_proj_id = null
                    //获取proj_id是否存在当前年份开头
                    let proj_id = (await sql.execute(`SELECT
                     proj_basice.proj_id
                     FROM
                     proj_basice
                     WHERE
                     proj_basice.proj_id LIKE '${year}%'
                     ORDER BY
                     proj_basice.proj_id DESC
                     LIMIT 0, 1
                     `))[0]
                    // console.log(proj_id);
                    //如果不存在就已001开头反之加1
                    if (proj_id.length === 0) {
                        cur_proj_id = `${dayjs().format('YYYY')}001`
                    } else {
                        cur_proj_id = parseInt(proj_id[0].proj_id) + 1
                       // console.log(JSON.stringify({cur_proj_id, proj_name, fina_name, proj_status, corp_name, nowTime, hidden_debt, proj_remark}));
                    }
                    const sql2=`INSERT INTO proj_basice(proj_id, proj_name, fina_name, proj_status, corp_name,creat_time,hidden_debt,proj_remark) VALUES (?,?,?,?,?,?,?,?)`

                    const list =[cur_proj_id, proj_name, fina_name, proj_status, corp_name, nowTime, hidden_debt, proj_remark]
                     let res2 =await  sql.execute(sql2,list)
                    //console.log(res1);

                    let repStr = `INSERT INTO rep_info(bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark,rep_remaining,bank_consortium,sub_project,sub_project_list) VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?,?)`
                    await sql.execute(repStr, [bank_name, rep_sum, rep_date, rep_limit, rep_sou, cur_proj_id, rep_remark, rep_sum, bank_consortium, sub_project,JSON.stringify(sub_project_list)])
                    await sql.commit()
                    return true
                } catch (error) {
                    await sql.rollback()
                    console.log(error);
                    throw new Error(error)
                }
            })

            return res.send({ code: 20000, message: '成功' })


        }
        //更新项目基础信息
        if (name == 'update') {
            let { proj_name, fina_name, proj_status, corp_name, proj_remark, hidden_debt } = req.body.projForm
            //let {, fina_name, proj_status, corp_name, ysProjId } = req.body.repForm
            let { bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark, bank_consortium, sub_project, rep_id,sub_project_list } = req.body.repForm
            proj_status = 1
            sub_project_list= Array.isArray(sub_project_list)? sub_project_list:[]
            sub_project_list = JSON.stringify(sub_project_list)
            //throw new Error('123') 
            const data = await linkMySql(async sql => {
                try {
                    await sql.beginTransaction()
                    console.log(hidden_debt);
                    await sql.execute(finaStr.updateProj, [proj_name, fina_name, proj_status, corp_name, proj_remark, hidden_debt, proj_id])
                    console.log(sub_project_list);
                   // throw new Error(sub_project_list) 
                    await sql.execute(finaStr.updateRep, [bank_name, rep_sum, rep_date, rep_limit, rep_sou, rep_remark, bank_consortium, sub_project,sub_project_list, rep_id])
                    await sql.commit()
                } catch (error) {
                    console.log(error);
                    await sql.rollback()
                    throw new Error(error)
                }
            })


            return res.send({ code: 20000 })
        }

    } catch (error) {

        console.log(error);
        return res.send({ code: 20001, message: '出现错误' })
    }
})
//获取项目详情信息
router.get('/info', async (req, res) => {
    let { name, id } = req.query
    switch (name) {
        case 'proj':
            try {
                let data = await linkMySql(async sql => {
                    try {
                        
                        await sql.beginTransaction()
                        let repInfo = (await sql.execute(finaStr.repInfo, [id]))[0]
                        let projInfo = (await sql.execute(finaStr.projInfo, [id]))[0]
                        
                        await sql.commit()
                        await sql.destroy()
                        return {
                            repInfo: repInfo[0],
                            projInfo: projInfo[0]
                        }


                    } catch (error) {
                        console.log(error);
                        await sql.rollback()
                        throw new Error(error)
                    }
                })
                return res.send({ code: 20000, data: { projInfo: data.projInfo, repInfo: data.repInfo } })
            } catch (error) {
                res.send({ code: 20001, message: '错误' })
            }

            break;
            //该选项可能已废弃
        case 'rep':
            let data1 = await linkSql(`SELECT rep_info.rep_id, rep_info.bank_name, rep_info.rep_sum, rep_info.rep_date, rep_info.rep_limit, rep_info.rep_sou, rep_info.proj_id, rep_info.rep_remark FROM rep_info WHERE rep_info.proj_id = ?`, [id])

            let data2 = await linkSql('', '', true, async (sql) => {


                try {

                    let repId = data1[0].rep_id

                    let finaList = await sql.query(`SELECT fina_cost.cost_id, fina_cost.cost_name, fina_cost.cost_sum, fina_cost.cost_date, fina_cost.corp_name, fina_cost.cost_remark, fina_cost.rep_id FROM fina_cost WHERE fina_cost.rep_id = ${repId} ORDER BY fina_cost.cost_id DESC`)
                    let bondList = await sql.query(`SELECT bond_info.bond_id, bond_info.bond_sum, bond_info.bond_name, bond_info.bond_remark, bond_info.rep_id FROM bond_info WHERE bond_info.rep_id = ${repId} ORDER BY  bond_info.bond_id DESC`)
                    let pawnList = await sql.query(`SELECT pawn_info.pawn_id, pawn_info.pawn_sum, pawn_info.pawn_name, pawn_info.pawn_bond, pawn_info.pawn_remark, pawn_info.rep_id FROM pawn_info WHERE pawn_info.rep_id = ${repId} ORDER BY pawn_info.pawn_id DESC`)


                    return {
                        finaList: finaList[0],
                        bondList: bondList[0],
                        pawnList: pawnList[0]
                    }
                } catch (error) {
                    console.log(error);

                    return false
                }

            })
            if (!data2) {
                return res.send({ code: 20001, message: '错误' })
            }
            res.send({ code: 20000, data: { repInfo: { ...data1[0], finaList: data2.finaList, bondList: data2.bondList, pawnList: data2.pawnList } } })
            break
        default:
            res.send({ code: 20001, message: '错误' })
            break;
    }

})
//获取一些基础信息的列表用于给前端使用select选择器
router.get('/select', async (req, res) => {
    let { name } = req.query
    try {
        if (name != 'proj') {
            return res.send({ code: 20001, message: '查询错误' })
        }
        let data = await linkSql('', '', true, async (sql) => {

            try {
                let bankList = await sql.query(`SELECT tbl_bank_info.bank_id, tbl_bank_info.bank_name FROM tbl_bank_info`)
                let corpList = await sql.query(`SELECT tbl_corp_info.corp_id, tbl_corp_info.corp_name,tbl_corp_info.corp_cate FROM tbl_corp_info`)
                let finaCate = await sql.query(`SELECT tbl_fina_typ.fina_id, tbl_fina_typ.fina_name FROM tbl_fina_typ`)
                let agmtList = await sql.query(`SELECT tbl_agmt_info.agmt_index_id, tbl_agmt_info.agmt_id, tbl_agmt_info.agmt_name, tbl_agmt_info.agmt_value, tbl_agmt_info.beg_date, tbl_agmt_info.end_date, tbl_agmt_info.agmt_note, tbl_agmt_info.agmt_part FROM tbl_agmt_info`)
                let obj = {
                    bankList: bankList[0],
                    corpList: corpList[0],
                    finaCate: finaCate[0],
                    agmtList: agmtList[0]
                }
                return obj

            } catch (err) {
                console.log(err);
                return false
            }
        })
        if (!data) {
            return res.send({ code: 200001, message: '查询错误2' })
        }
        res.send({ code: 20000, data: { ...data } })
    } catch (error) {
        return res.send({ code: 200001, message: '查询错误3' })
    }
})
//该接口可能不在使用中
router.post('/rep', async (req, res) => {
    try {
        let { bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark, rep_id } = req.body
        let sqlstr = `UPDATE rep_info SET bank_name = ?, rep_sum = ?, rep_date = ?, rep_limit = ?, rep_sou = ?, proj_id = ?, rep_remark = ?,loan_total=COALESCE(
        (
        SELECT SUM(loan_sum) FROM loan_info WHERE loan_info.rep_id = rep_info.rep_id
        
        ),0)  , rep_remaining = rep_sum - COALESCE(
        (
        SELECT SUM(loan_sum) FROM loan_info WHERE loan_info.rep_id = rep_info.rep_id
        
        ),0) WHERE rep_id = ?`
        let result = await linkMySql(async sql => {
            try {
                if (rep_id) {
                    let rep_info = (await sql.execute(`SELECT
                rep_info.rep_id,
                rep_info.loan_total
                FROM
                rep_info
                WHERE
                rep_id = ${rep_id}
                `))[0][0]

                    if (rep_sum < rep_info.loan_total) {
                        await sql.rollback()
                        return {
                            isStatus: false,
                            message: `批复额度不能小于借款金额总数！当前借款金额总数为:${rep_info.loan_total}`
                        }
                    }

                    let data = await sql.execute(sqlstr, [bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark, rep_id])
                } else {
                    let sqlstr = `INSERT INTO rep_info(bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark,rep_remaining) VALUES (?, ?, ?, ?, ?, ?, ?)`
                    let data = await sql.execute(sqlstr, [bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark, rep_sum])
                }
                await sql.commit()
                return { isStatus: true }
            } catch (error) {
                console.log(error);
                await sql.rollback()
                throw new Error(error)
            }


        })

        if (result.isStatus === false) {
            return res.send({ code: 20001, message: result.message })
        }

        return res.send({ code: 20000, message: '保存成功' })
    } catch (error) {
        console.log(error);
        res.send({ code: 20001, message: '错误' })

    }
})

//融资费用新增或添加接口
router.post('/cost', async (req, res) => {
    let { corp_name, cost_date, cost_id, cost_name, cost_remark, cost_sum, rep_id } = req.body
    let sqlstr = `INSERT INTO fina_cost(cost_name, cost_sum, cost_date, corp_name, cost_remark, rep_id) VALUES (?, ?, ?, ?, ?, ?)`
    try {
        if (!cost_id) {
            const data = await linkSql(sqlstr, [cost_name, cost_sum, cost_date, corp_name, cost_remark, rep_id])
            res.send({ code: 20000, message: '添加成功' })
        } else {
            let sqlStr = `UPDATE fina_cost SET cost_name = ?, cost_sum = ?, cost_date = ?, corp_name = ?, cost_remark = ? WHERE cost_id = ?`
            const data = await linkSql(sqlStr, [cost_name, cost_sum, cost_date, corp_name, cost_remark, cost_id])
            res.send({ code: 20000, message: '修改成功' })
        }
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }

})

//融资费用删除接口
router.delete('/cost', async (req, res) => {
    let { cost_id } = req.body
    let sqlStr = `DELETE FROM fina_cost WHERE cost_id = ${cost_id}`
    try {
        const data = await linkSql(sqlStr)
        res.send({ code: 20000, message: '成功' })
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }

})
//保证担保信息添加和新增接口
router.post('/bond', async (req, res) => {
    let { bond_sum, bond_name, bond_remark, rep_id, bond_id } = req.body
    let sqlstr = `INSERT INTO bond_info(bond_sum, bond_name, bond_remark, rep_id) VALUES (?, ?, ?, ?)`
    try {
        if (!bond_id) {
            const data = await linkSql(sqlstr, [bond_sum, bond_name, bond_remark, rep_id])
            res.send({ code: 20000, message: '添加成功' })
        } else {
            let sqlStr = `UPDATE bond_info SET bond_sum = ?, bond_name = ?, bond_remark = ? WHERE bond_id = ?`
            const data = await linkSql(sqlStr, [bond_sum, bond_name, bond_remark, bond_id])
            res.send({ code: 20000, message: '修改成功' })
        }
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }

})

//保证担保信息删除接口
router.delete('/bond', async (req, res) => {
    let { bond_id } = req.body
    let sqlStr = `DELETE FROM bond_info WHERE bond_id = ${bond_id}`
    try {
        const data = await linkSql(sqlStr)
        res.send({ code: 20000, message: '成功' })
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }

})
//抵押担保信息添加和新增接口
router.post('/pawn', async (req, res) => {
    let { pawn_sum, pawn_name, pawn_bond, pawn_remark, rep_id, pawn_id } = req.body
    let sqlstr = `INSERT INTO pawn_info(pawn_sum, pawn_name, pawn_bond, pawn_remark, rep_id) VALUES (?, ?, ?, ?, ?)`
    try {
        if (!pawn_id) {
            const data = await linkSql(sqlstr, [pawn_sum, pawn_name, pawn_bond, pawn_remark, rep_id])
            res.send({ code: 20000, message: '添加成功' })
        } else {
            let sqlStr = `UPDATE pawn_info SET pawn_sum = ?, pawn_name = ?, pawn_bond = ?, pawn_remark= ? WHERE pawn_id = ?`
            const data = await linkSql(sqlStr, [pawn_sum, pawn_name, pawn_bond, pawn_remark, pawn_id])
            res.send({ code: 20000, message: '修改成功' })
        }
    } catch (error) {
        console.log(error);
        res.send({ code: 20001, message: '错误' })
    }

})

//抵押担保信息删除接口
router.delete('/pawn', async (req, res) => {
    let { pawn_id } = req.body
    let sqlStr = `DELETE FROM pawn_info WHERE pawn_id = ${pawn_id}`
    try {
        const data = await linkSql(sqlStr)
        res.send({ code: 20000, message: '成功' })
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }

})





//借款信息添加或删除接口
router.post('/loan', async (req, res) => {
    try {
        let { loan_sum, loan_date, loan_remark, rep_id, inter_plan, rep_limit, loan_id, rate, is_actual, is_float_rate,mt_total,sub_project_list } = req.body
        sub_project_list= Array.isArray(sub_project_list)? sub_project_list:[]
        sub_project_list = JSON.stringify(sub_project_list)
        let data = await linkMySql(async sql => {
            try {

                await sql.beginTransaction()

                if (loan_id) {
                    if(is_actual===1){
                        loan_sum = parseInt(mt_total)
                    }
                    let data1 =(await sql.execute(`SELECT loan_info.rate,loan_info.is_float_rate,loan_info.everyday_inter FROM loan_info WHERE loan_id = ${loan_id}`))[0]
                    let sql_str = `UPDATE loan_info SET loan_sum = ?,inter_plan = ?, loan_date = ?, loan_remark = ?, rep_id = ?,is_float_rate=?,rate=?,sub_project_list = ? WHERE loan_id = ?`
                    if(parseFloat(data1[0].is_float_rate )!== is_float_rate){
                        await updateInfo(data1[0].everyday_inter,rate,is_float_rate)
                        let data2 = await sql.execute(`UPDATE loan_info SET loan_sum = ?,inter_plan = ?, loan_date = ?, loan_remark = ?, rep_id = ?,is_float_rate=?,rate=?,sub_project_list = ? , everyday_inter = ? WHERE loan_id = ?`, [loan_sum, inter_plan, loan_date, loan_remark, rep_id,is_float_rate,rate,sub_project_list,JSON.stringify(data1[0].everyday_inter), loan_id])
                       // console.log(data1[0].everyday_inter.slice(0,10));
                    }else if(parseFloat(data1[0].rate )!== rate){
                        await updateInfo(data1[0].everyday_inter,rate,is_float_rate)
                        
                        let data2 = await sql.execute(`UPDATE loan_info SET loan_sum = ?,inter_plan = ?, loan_date = ?, loan_remark = ?, rep_id = ?,is_float_rate=?,rate=?,sub_project_list = ? , everyday_inter = ? WHERE loan_id = ?`, [loan_sum, inter_plan, loan_date, loan_remark, rep_id,is_float_rate,rate,sub_project_list,JSON.stringify(data1[0].everyday_inter), loan_id])
                       // console.log(data1[0].everyday_inter.slice(0,10));
                    }else{
                        let data = await sql.execute(sql_str, [loan_sum, inter_plan, loan_date, loan_remark, rep_id,is_float_rate,rate,sub_project_list, loan_id])
                    }
                    
                    //console.log();
                    
                } else {
                    let add = `INSERT INTO loan_info( loan_sum, loan_date, loan_remark, rep_id, inter_plan,rep_limit,is_repay,rate,is_actual,is_float_rate,sub_project_list,everyday_inter) VALUES (?,?, ?, ?, ?, ?, ?,?,?,?,?,?)`
                    let data = await sql.execute(add, [loan_sum, loan_date, loan_remark, rep_id, inter_plan, rep_limit, 0, rate, is_actual, is_float_rate,sub_project_list,[]])



                }
                await sql.commit()
                return {
                    isStatus: true
                }
            } catch (error) {
                console.log(error);
                await sql.rollback()
                throw new Error('错误')
            }
        })
        if (data.isStatus === false) {
            return res.send({ code: 20001, message: data.message })
        }
        res.send({ code: 20000, message: '保存成功' })
    } catch (error) {

        res.send({ code: 20001, message: '错误' })
    }
})
//删除借款信息接口
router.delete('/loan', async (req, res) => {
    try {
        let { loan_id } = req.body
        let data = await linkMySql(async sql => {
            try {
                await sql.beginTransaction()
                let { rep_id } = (await sql.execute(`SELECT
            loan_info.rep_id,
            loan_info.loan_id
            FROM
            loan_info
            WHERE
            loan_info.loan_id = ${loan_id}`))[0][0]

                if (!rep_id) {
                    throw new Error('rep_id为空')
                } else {
                    await sql.execute(`DELETE FROM loan_info WHERE loan_id = ${loan_id}`)
                    await sql.execute(`UPDATE rep_info SET loan_total=COALESCE(
                        (
                        SELECT SUM(loan_sum) FROM loan_info WHERE loan_info.rep_id = rep_info.rep_id
                        
                        ),0)  , rep_remaining = rep_sum - COALESCE(
                        (
                        SELECT SUM(loan_sum) FROM loan_info WHERE loan_info.rep_id = rep_info.rep_id
                        
                        ),0) WHERE rep_id = ${rep_id}`)
                    await sql.commit()
                }
            } catch (error) {
                await sql.rollback()
                throw new Error(error)
            }
        })

       
        res.send({ code: 20000 })
    } catch (error) {
        res.send({ code: 20001, message: '操作失败' })
    }
})

//获取借款信息详情接口
router.get('/loan', async (req, res) => {
    let { loan_id } = req.query

    let data = await linkSql('', '', true, async (sql) => {
        try {
            let loanInfo = await sql.query(finaStr.loanInfo, [loan_id])
            let mtList = await sql.query(`SELECT
            mt_info.mt_id,
            mt_info.mt_sum,
            mt_info.mt_date,
            mt_info.matching_capital,
            mt_info.remark,
            mt_info.loan_id,
            mt_info.start_end_date,
            mt_info.sub_project_list
            FROM
            mt_info
            WHERE
            mt_info.loan_id = ${loan_id}
            `)
            //console.log(loanInfo[0][0]);
            loanInfo[0][0].repay_total = await repayTotal(loanInfo[0][0].everyday_inter)
            //console.log(loanInfo[0][0].repay_total);
            return {
                loanInfo: loanInfo[0],
                mtList: mtList[0]
            }
        } catch (error) {
            console.log(error);

            return false
        }
    })
    if (data === false) {
        return res.send({ code: 20001, message: '错误' })
    }
   // const repay_total = await repayTotal(loan_id)
   // console.log(data);
    return res.send({ code: 20000, data: { loanInfo: { ...data.loanInfo[0], }, mtList: data.mtList } })

})
//获取下款信息接口
router.get('/mt', async (req, res) => {
    let { proj_id } = req.query
    const sqlstr = `SELECT
    mt_info.mt_id,
    mt_info.mt_sum,
    mt_info.mt_con_id,
    mt_info.mt_date,
    mt_info.matching_capital,
    mt_info.remark,
    mt_info.rep_id,
    mt_info.start_end_date,
    mt_info.sub_project_list
    FROM
    mt_info
    INNER JOIN proj_basice ON proj_basice.proj_id = ${proj_id}
    INNER JOIN rep_info ON proj_basice.proj_id = rep_info.proj_id`
    let data = await linkSql(sqlstr)
    res.send({ code: 20000, data: { mtList: data } })
})
//下款信息新增或修改接口
router.post('/mt', async (req, res) => {

    let { mt_sum, mt_date, matching_capital, remark, loan_id, start_end_date, mt_id,sub_project_list } = req.body
    sub_project_list= Array.isArray(sub_project_list)? sub_project_list:[]
    sub_project_list = JSON.stringify(sub_project_list)
    matching_capital=JSON.stringify(matching_capital)
    try {
        console.log(dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'), '-------');
        let strtime = start_end_date
        const sqlstr1 = `UPDATE mt_info SET mt_sum = ?,  mt_date = ?, matching_capital = ?, remark = ?, loan_id = ?, start_end_date = ? ,sub_project_list=? WHERE mt_id = ?`
        const sqlstr2 = `INSERT INTO mt_info(mt_sum, mt_date, matching_capital, remark, loan_id,start_end_date,sub_project_list) VALUES ( ?, ?, ?, ?, ?,?,?)`
        let res1 = await linkMySql(async sql => {
            try {
                await sql.beginTransaction()

                if (mt_id) {
                    await sql.execute(sqlstr1, [mt_sum, mt_date, matching_capital, remark, loan_id, start_end_date,sub_project_list, mt_id])
                } else {
                    await sql.execute(sqlstr2, [mt_sum, mt_date, matching_capital, remark, loan_id, start_end_date,sub_project_list])
                }
                //更新每日结息详情
                await updateMt(sql, loan_id)
                
                await sql.commit()
            } catch (error) {
                await sql.rollback()
                console.log(error);
                throw new Error(error)
            }
        })

        res.send({ code: 20000, message: '保存成功' })
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'), '-------');
})
//当下款信息发生改变时触发该函数重新修改每日结息详情的数据
async function updateMt(sql, loan_id) {
    try {
        let loanInfo = (await sql.execute(`SELECT
    loan_info.loan_sum,
    loan_info.loan_date,
    loan_info.loan_remark,
    loan_info.is_float_rate,
    loan_info.rate,
    loan_info.everyday_inter,
    rep_info.rep_limit
    FROM
    loan_info
    LEFT JOIN rep_info ON loan_info.rep_id = rep_info.rep_id
    WHERE
    loan_id = ${loan_id}`))[0]
        let mtList = (await sql.execute(`SELECT
    mt_info.mt_id,
    mt_info.mt_sum,
    mt_info.mt_date,
    mt_info.matching_capital
    FROM
    mt_info
    WHERE
    loan_id = ${loan_id}`))[0]
        let { everyday_inter } = loanInfo[0]
        //console.log(mtList);
        //console.log(loanInfo[0].rate);
        for (let j = 0; j < everyday_inter.length; j++) {
            //everyday_inter[j].rate = parseFloat(loanInfo[0].rate)
            everyday_inter[j].mt_num = 0
            for (let i = 0; i < mtList.length; i++) {
                if (dayjs(everyday_inter[j].date).isSame(mtList[i].mt_date)) {
                    everyday_inter[j].mt_num += mtList[i].mt_sum
                }
            }
            if (j !== 0) {
                //everyday_inter[j].princaipal = everyday_inter[j - 1].princaipal + everyday_inter[j - 1].mt_num - everyday_inter[j - 1].repay_plan
                everyday_inter[j].princaipal = everyday_inter[j - 1].princaipal- everyday_inter[j - 1].repay_plan+everyday_inter[j].mt_num
    
            }else{
                everyday_inter[j].princaipal = everyday_inter[j].mt_num
            }
            everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))


        }
        await updatePlanInter(everyday_inter)
        await sql.execute(`UPDATE loan_info SET everyday_inter = ? WHERE loan_id = ?`, [JSON.stringify(everyday_inter), loan_id])
    } catch (error) {
        throw new Error(error)
    }
}

//删除下款信息接口
router.delete('/mt', async (req, res) => {
    try {
        let { loan_id, date, mt_id } = req.body
        await linkMySql(async sql => {
            try {
                await sql.beginTransaction()
                await sql.execute(`DELETE FROM mt_info WHERE mt_id = ${mt_id}`)
                await updateMt(sql, loan_id)
                await sql.commit()
                //computrRepay('plan', loan_id)
            } catch (error) {
                await sql.rollback()
                throw new Error(error)
            }
        })
        res.send({ code: 20000 })
    } catch (error) {
        res.send({ code: 20001, message: '出现错误' })
    }
})
//获取走款信息接口
router.get('/sp', async (req, res) => {
    let { mt_id } = req.query
    if (!mt_id) {
        return res.send({ code: 20001, message: '错误' })
    }
    let data = await linkSql(finaStr.spList, [mt_id])
    res.send({ code: 20000, data: { spList: data } })
})
//修改和添加走款信息接口
router.post('/sp', async (req, res) => {
    let { sp_date, corp_name, sp_num, refund, actul_num, sp_use, remark, con_id, mt_id, sp_id } = req.body
    let sqlStr1 = `INSERT INTO sp_info(sp_date, corp_name, sp_num, refund, actul_num,  sp_use, remark, mt_id) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)`
    try {
        if (sp_id) {
            let sqlStr = `UPDATE sp_info SET sp_date = ?, corp_name = ?, sp_num = ?, refund = ?, actul_num = ?, sp_use = ?, remark = ?,  WHERE sp_id = ${sp_id}`
            let data = await linkSql(sqlStr, [sp_date, corp_name, sp_num, refund, actul_num, sp_use, remark, sp_id])
        } else {
            let data = await linkSql(sqlStr1, [sp_date, corp_name, sp_num, refund, actul_num, sp_use, remark, mt_id])
        }
        res.send({ code: 20000, message: '保存成功' })
    } catch (error) {
        console.log(error);
        res.send({ code: 20001, message: '错误' })
    }


})
//删除走款信息接口
router.delete('/sp', async (req, res) => {
    try {
        let { sp_id } = req.body
        await linkSql(`DELETE FROM sp_info WHERE sp_id = ${sp_id}`)

        res.send({ code: 20000 })
    } catch (error) {
        res.send({ code: 20001, message: '出现错误' })
    }
})

//添加结息计划
router.post('/interest', async (req, res) => {
    let { loan_id } = req.query

    if (!loan_id) {
        return res.send({ code: 20001, message: '错误' })
    }
    if (loan_id == 'one') {
        let { plan_date, interest_num, interest_rate, remark, loan_id, interest_id } = req.body
        if (interest_id) {
            let sqlStr = `UPDATE interest_plan SET plan_date = ?, interest_num = ?, interest_rate = ?, remark = ? WHERE interest_id = ?`
            let data = await linkSql(sqlStr, [plan_date, interest_num, interest_rate, remark, interest_id])
        } else {
            let sqlStr = `INSERT INTO interest_plan(plan_date, interest_num,interest_rate,remark,loan_id) VALUES (?, ?,?,?,?)`
            let data = await linkSql(sqlStr, [plan_date, interest_num, interest_rate, remark, loan_id])

        }
    } else {

        let list = req.body
        //循环插入
        let sqlStr = `INSERT INTO interest_plan(plan_date, loan_id) VALUES (?, ?)`
        let data = await linkSql('', '', true, async (sql) => {
            try {
                //console.log(1);
                //console.log(list);
                for (let i = 0; i < list.length; i++) {
                    await sql.query(sqlStr, [list[i], loan_id])
                }

            } catch (error) {
                console.log(error);


            }
        })

    }



    res.send({ code: 20000 })
})
//获取每日结息详情接口
router.get('/interest', async (req, res) => {
    let { loan_id, current, size } = req.query
    // let data = await linkSql(finaStr.getInter, [loan_id, (current - 1) * size, size - 0])
    let strs = `SELECT
    Count(repay_info.repay_id) AS total
    FROM
    repay_info
    WHERE
    repay_info.loan_id = ?
    `
    let total = await linkSql(strs, [loan_id])
    // res.send({ code: 20000, data: { interestList: data, total: total[0].total } })
    let str = `SELECT loan_info.everyday_inter FROM loan_info WHERE loan_id = ?`

    let data = await linkSql(str, [loan_id])
    //console.log(data);
    res.send({ code: 20000, data: { interestList: data[0].everyday_inter, total: total[0].total } })

})

//添加还本计划
router.post('/repay', async (req, res) => {

    let { repay_plan, date, loan_id } = req.body
    //await linkSql(`UPDATE repay_info SET repay_plan = ${repay_plan} WHERE loan_id = ${loan_id} AND date = '${date}'`)
    //await computrRepay('plan', loan_id)

    // await updatePlanInter(loan_id)
    let data = await linkMySql(async sql => {
        try {
            await sql.beginTransaction()
            let { everyday_inter } = (await sql.execute(finaStr.everyday, [loan_id]))[0][0]
            //console.log(everyday_inter.slice(0,10));

            for (let i = 0; i < everyday_inter.length; i++) {
                if (everyday_inter[i].date === date) {
                    everyday_inter[i].repay_plan = parseInt(repay_plan)
                    break
                }
            }
           // await updateRate(loan_id, everyday_inter)
            computrRepay(everyday_inter)

            updatePlanInter(everyday_inter)
            await sql.execute(`UPDATE loan_info SET everyday_inter = ? WHERE loan_id =?`, [JSON.stringify(everyday_inter), loan_id])
            await sql.commit()
        } catch (error) {
            console.log(error);
            await sql.rollback()
        }
    })

    res.send({ code: 20000 })
})

//删除还本计划
router.delete('/repay', async (req, res) => {
    let { date, loan_id } = req.body
    let data = await linkMySql(async sql => {
        try {
            await sql.beginTransaction()
            let { everyday_inter } = (await sql.execute(finaStr.everyday, [loan_id]))[0][0]
            //console.log(everyday_inter.slice(0,10));

            for (let i = 0; i < everyday_inter.length; i++) {
                if (everyday_inter[i].date === date) {
                    everyday_inter[i].repay_plan = 0
                    break
                }
            }
            computrRepay(everyday_inter)
            updatePlanInter(everyday_inter)
            await sql.execute(`UPDATE loan_info SET everyday_inter = ? WHERE loan_id =?`, [everyday_inter, loan_id])
            await sql.commit()
        } catch (error) {
            console.log(error);
            await sql.rollback()
        }
    })





    res.send({ code: 20000 })
})
//获取还本计划接口
router.get('/repay', async (req, res) => {
    let { loan_id, current, size } = req.query

    let rpyStr = `SELECT
    repay_info.repay_id,
    repay_info.princaipal,
    repay_info.rate,
    repay_info.date,
    repay_info.inter_plan,
    repay_info.repay_plan,
    repay_info.inter_actual,
    repay_info.repay_actual,
    repay_info.remark,
    repay_info.loan_id,
    repay_info.mt_num
    FROM
    repay_info
    WHERE
    repay_info.loan_id = ? AND
    repay_info.repay_plan > 0
    ORDER BY
    repay_info.date ASC
    LIMIT ?,? `
    //let data = await linkSql(rpyStr, [loan_id, (current - 1) * size, size - 0])
    let data = await linkSql(`SELECT
    loan_info.loan_sum,
    loan_info.loan_date,
    loan_info.loan_remark,
    loan_info.is_float_rate,
    loan_info.rate,
    loan_info.everyday_inter,
    rep_info.rep_limit
    FROM
    loan_info
    LEFT JOIN rep_info ON loan_info.rep_id = rep_info.rep_id
    WHERE
    loan_id = ${loan_id}`)
    let { everyday_inter } = data[0]
    //console.log(everyday_inter);
    let list1 = everyday_inter.filter(item => {
        return item.repay_plan > 0
    })

    let list = list1.slice((current - 1) * size, current * size)
    let str = `SELECT
    Count(repay_info.repay_id) AS total
    FROM
    repay_info
    WHERE
    repay_info.loan_id = ? AND
    repay_info.repay_plan > 0
    ORDER BY
    repay_info.date ASC
    
    `
    //let total = await linkSql(str, [loan_id])
    res.send({ code: 20000, data: { repayList: list, total: list1.length } })

})
//收到一个起始日期和结束日期，将时间范围内的每天放在一个数组返回出来
function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = dayjs(startDate)

    while (currentDate.isSameOrBefore(endDate)) {
        dates.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(1, 'day');
    }

    return dates;
}

//生成每日结息详情接口
router.post('/repayment', async (req, res) => {
    try {
        let { loan_date, loan_id, rep_limit,rate,is_float_rate } = req.body
        
        //return
        //console.log(loan_date, loan_id, rep_limit);
        let interList = []
        const startDate = dayjs(loan_date)
        const endDate = startDate.add(rep_limit, 'month').subtract(1, 'day')
        let currDate = startDate
        //console.log(startDate.format('YYYY-MM-DD'),endDate.format('YYYY-MM-DD'));
        let i = 0
        while (!currDate.isAfter(endDate)) {
            let obj = {
                princaipal: 0,
                rate: parseFloat(rate),
                date: currDate.format('YYYY-MM-DD'),
                inter_plan: 0,
                repay_plan: 0,
                inter_actual: 0,
                repay_actual: 0,
                mt_num: 0,
                is_inter_set: 0
            }
            interList.push(obj)
            i++
            currDate = currDate.add(1, 'day')
        }
        if(is_float_rate ==1){
           await updateRate(interList)
        }
        //console.log(i);
        //console.log(JSON.stringify(interList));
        await linkSql(`UPDATE loan_info SET everyday_inter = ?,is_repay = 1 WHERE loan_id = ${loan_id}`, [JSON.stringify(interList)])

        return res.send({ code: 20000, message: '成功' })
    } catch (error) {

        return res.send({ code: 20001, message: '出现错误' })
    }
   

})



//该接口可能因为项目修改没有被使用
router.post('/rate', async (req, res) => {

    await updateRate()
    res.send({ code: 20000 })

})
//测试用，没投入到项目中使用
router.get('/date', async (req, res) => {
    let lists = ['2020-02-28', '2028-10-01']
    let list = getDatesInRange('2020-01-01', '2020-03-10', lists)
    res.send({ code: 20000, data: { list: list } })
})
//已废弃
router.get('/update', async (req, res) => {
    let { loan_id } = req.query
    linkSql('', '', true, async (sql) => {
        try {
            await sql.beginTransaction();
            await sql.execute(`UPDATE repay_info 
        SET inter_plan = CASE 
                            WHEN YEAR(date) % 4 = 0 AND (YEAR(date) % 100 != 0 OR YEAR(date) % 400 = 0) 
                                THEN princaipal * rate / 366 
                            ELSE princaipal * rate / 365 
                        END 
        WHERE loan_id = ${loan_id}`)
            await sql.execute(`UPDATE loan_info SET  is_inter = 1  WHERE loan_id = ${loan_id}`)
            await sql.commit()
        } catch (error) {
            await sql.rollback()
        }
    })
    res.send({ code: 20000 })

})

//测试用，没投入到开发中
router.get('/shuaxin', async (req, res) => {
    const is = false
    let currentDate = '2023-09-06'
    let sdate = null
    let xdate = null
    let dateList = [null, currentDate, null]
    let list = ['2023-09-06']

    for (let i = 0; i < list.length; i++) {
        if (i === 0) {
            if (dayjs(currentDate).isBefore(dayjs(list[i]))) {
                dateList[0] = null
                dateList[2] = list[i]
                break
            }
            if (dayjs(list[i]).isSame(dayjs(currentDate))) {
                dateList[2] = list[i + 1]
                break
            }
        }
        if (i === list.length - 1) {
            if (dayjs(list[list.length - 1]).isBefore(dayjs(list[currentDate]))) {
                dateList[0] = list[list.length - 1]
                dateList[2] = null
                break
            }
        }
        if (dayjs(list[i]).isBefore(dayjs(currentDate))) {
            dateList[0] = list[i]
        } else {
            dateList[2] = list[i]
        }
    }
    //console.log(dateList);
    dateList[1] = currentDate
    let lists = []
    for (let i = 0; i < dateList.length; i++) {
        if (dateList[i]) {
            lists.push(dateList[i])
        }

    }
    const uniqueDates = [...new Set(lists)];
    //console.log(sdate,currentDate,xdate);
    res.send({ code: 20000 })

})
//获取结息计划时间节点
router.get('/plan', async (req, res) => {
    try {
        let { loan_id, current, size } = req.query
    current = parseInt(current)
    size = parseInt(size)

    let rpyStr = `SELECT
    repay_info.repay_id,
    repay_info.date,
    repay_info.inter_actual,
    repay_info.loan_id
    FROM
    repay_info
    WHERE
    repay_info.loan_id = ? AND
    repay_info.is_inter_set = 1
    ORDER BY
    repay_info.date ASC
    LIMIT ?,? `

   
    // let data = await linkSql(`SELECT
    // loan_info.loan_sum,
    // loan_info.loan_date,
    // loan_info.loan_remark,
    // loan_info.is_float_rate,
    // loan_info.rate,
    // loan_info.everyday_inter,
    // rep_info.rep_limit
    // FROM
    // loan_info
    // LEFT JOIN rep_info ON loan_info.rep_id = rep_info.rep_id
    // WHERE
    // loan_id = ${loan_id}`)
    let data = await linkSql(` SELECT
    rep_info.everyday_inter,
    rep_info.rep_date,
    rep_info.rep_limit
    FROM
    rep_info
    WHERE rep_info.proj_id = '2023012'`)
    let { everyday_inter } = data[0]
    let list1 = everyday_inter.filter(item => {
        return item.is_inter_set === 1
    })
        ;
    let list = list1.slice((current - 1) * size, current * size)
    //console.log(list)
    //console.log(list);
    let str = `SELECT
    Count(repay_info.repay_id) AS total
    FROM
    repay_info
    WHERE
    repay_info.loan_id = ? AND
    repay_info.is_inter_set = 1
    ORDER BY
    repay_info.date ASC
    
    `
    //let total = await linkSql(str, [loan_id])
    res.send({ code: 20000, data: { planList: list, total: list1.length } })
    } catch (error) {
        res.send({code:20001,message:'错误'})
    }
})

//添加结息计划
router.post('/plan', async (req, res) => {
    try {
        let { planName } = req.query
        //为one时表示只添加一条
        if (planName === 'one') {
            let { loan_id, date } = req.body

            //await linkSql(`UPDATE repay_info SET is_inter_set = 1 WHERE loan_id = ${loan_id} AND date = '${date}'`)
            let data1 = await linkMySql(async sql => {
                console.log(dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'));
                try {
                    await sql.beginTransaction()
                    let loanInfo = (await sql.execute(`SELECT
                        loan_info.loan_sum,
                        loan_info.loan_date,
                        loan_info.loan_remark,
                        loan_info.is_float_rate,
                        loan_info.rate,
                        loan_info.everyday_inter,
                        rep_info.rep_limit
                        FROM
                        loan_info
                        LEFT JOIN rep_info ON loan_info.rep_id = rep_info.rep_id
                        WHERE
                        loan_id = ${loan_id}`))[0]
                    let { everyday_inter } = loanInfo[0]
                    let inter_sum = 0
                    let is = 0
                    for (let i = 0; i < everyday_inter.length; i++) {
                        inter_sum = parseFloat((inter_sum + everyday_inter[i].inter_plan).toFixed(2))
                        if (everyday_inter[i].date === date) {
                            everyday_inter[i].is_inter_set = 1
                            // console.log(everyday_inter[i].date);
                        }

                        if (everyday_inter[i].is_inter_set === 1) {

                            everyday_inter[i].inter_actual = inter_sum
                            inter_sum = 0

                        }


                    }
                    await sql.execute(`UPDATE loan_info SET everyday_inter=?  WHERE loan_id = ?`, [everyday_inter, loan_id])
                    await sql.commit()
                    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'));
                } catch (error) {
                    await sql.rollback()
                }
            })

            // await updatePlanInter(loan_id)
            //await updatePlan(loan_id)
            res.send({ code: 20000 })
        } else {
            //根据前端传来的时间节点数组给结息详情表中对应日期的结息状态
            let { loan_id, dateList } = req.body
            // console.log(dateList);
            let data = await linkMySql(async sql => {
                try {
                    await sql.beginTransaction()
                    let loanInfo = (await sql.execute(`SELECT
                        loan_info.loan_sum,
                        loan_info.loan_date,
                        loan_info.loan_remark,
                        loan_info.is_float_rate,
                        loan_info.rate,
                        loan_info.everyday_inter,
                        rep_info.rep_limit
                        FROM
                        loan_info
                        LEFT JOIN rep_info ON loan_info.rep_id = rep_info.rep_id
                        WHERE
                        loan_id = ${loan_id}`))[0]
                    let { everyday_inter } = loanInfo[0]
                    let currDate = 0
                    let interActual = 0
                    let a = 0
                    for (let i = 0; i < everyday_inter.length; i++) {
                        everyday_inter[i].is_inter_set = 0
                        interActual += everyday_inter[i].inter_plan
                        for (let j = currDate; j < dateList.length; j++) {
                            if (dayjs(everyday_inter[i].date).isSame(dayjs(dateList[j]))) {
                                currDate += 1
                                everyday_inter[i].inter_actual = parseFloat(interActual.toFixed(2))
                                everyday_inter[i].is_inter_set = 1
                                interActual = 0
                            } else {
                                break
                            }
                        }
                    }
                    //console.log(everyday_inter);
                    await sql.execute(`UPDATE loan_info SET everyday_inter=?  WHERE loan_id = ?`, [everyday_inter, loan_id])
                    await sql.commit()
                } catch (error) {
                    await sql.rollback()
                }
            })
            return res.send({ code: 20000 })
            //let { loan_id, dateList } = req.body
            console.log(123);
            await updatePlan(loan_id, dateList)


        }
    } catch (error) {
        console.log(error);
        res.send({ code: 20001, message: '错误' })
    }
})
//取消结息详情表中指定日期的是否结息状态
router.delete('/plan', async (req, res) => {
    try {

        let { date, loan_id } = req.body
        //let data = await linkSql(`UPDATE repay_info SET is_inter_set = 0, inter_actual = 0 WHERE repay_id = ${repay_id}`)
        // await updatePlanInter(loan_id)
        let data = await linkMySql(async sql => {
            try {
                await sql.beginTransaction()
                let loanInfo = (await sql.execute(`SELECT
            loan_info.loan_sum,
            loan_info.loan_date,
            loan_info.loan_remark,
            loan_info.is_float_rate,
            loan_info.rate,
            loan_info.everyday_inter,
            rep_info.rep_limit
            FROM
            loan_info
            LEFT JOIN rep_info ON loan_info.rep_id = rep_info.rep_id
            WHERE
            loan_id = ${loan_id}`))[0]
                let { everyday_inter } = loanInfo[0]
                for (let i = 0; i < everyday_inter.length; i++) {
                    if (everyday_inter[i].date === date) {
                        everyday_inter[i].is_inter_set = 0
                        break
                    }
                }
                //重新计算每个结息时间点的需要付息多少
                updatePlanInter(everyday_inter)
                await sql.execute(`UPDATE loan_info SET everyday_inter=?  WHERE loan_id = ?`, [everyday_inter, loan_id])
                await sql.commit()
            } catch (error) {
                await sql.rollback()
                throw new Error(error)
            }
        })
        res.send({ code: 20000 })

    } catch (error) {
        console.log(error);
        res.send({ code: 20001, message: '错误' })
    }
})
//添加或修改匹配资本金接口
router.post('/match', async (req, res) => {
    let { mt_id, matching_capital } = req.body
    console.log(mt_id);
    console.log(matching_capital);
    try {
        let res1 = await linkSql(`UPDATE mt_info SET matching_capital = ? WHERE mt_id = ?`, [JSON.stringify(matching_capital), mt_id])
        //console.log(res1);
    } catch (error) {
        console.log(error);
        return res.send({ code: 20001, message: '错误' })
    }
    return res.send({ code: 20000 })
})
//获取匹配资本金接口
router.get('/match', async (req, res) => {
    let { mt_id } = req.query

    try {
        let data = await linkSql(`SELECT mt_info.matching_capital FROM mt_info WHERE mt_info.mt_id = ?`, [parseInt(mt_id)])
        return res.send({ code: 20000, data: { matching: data[0].matching_capital } })
    } catch (error) {
        return res.send({ code: 20001, message: '错误' })
    }

})
//删除匹配资本金接口
router.delete('/match', async (req, res) => {
    let { mt_id, matching_capital } = req.body
    console.log(mt_id);
    console.log(matching_capital);
    if (matching_capital.length === 0) {
        matching_capital = '[]'
    } else {
        matching_capital = JSON.stringify(matching_capital)
    }
    try {
        let res1 = await linkSql(`UPDATE mt_info SET matching_capital = ? WHERE mt_id = ?`, [matching_capital, parseInt(mt_id)])
        //console.log(res1);
    } catch (error) {
        console.log(error);
        return res.send({ code: 20001, message: '错误' })
    }
    return res.send({ code: 20000 })
})

//获取基础信息接口
router.get('/basics', async (req, res) => {
    try {
        let { rep_id } = req.query
        let data = await linkMySql(async (sql) => {
            let finaList = await sql.query(`SELECT fina_cost.cost_id, fina_cost.cost_name, fina_cost.cost_sum, fina_cost.cost_date, fina_cost.corp_name, fina_cost.cost_remark, fina_cost.rep_id FROM fina_cost WHERE fina_cost.rep_id = ${rep_id} ORDER BY fina_cost.cost_id DESC`)
            let bondList = await sql.query(`SELECT bond_info.bond_id, bond_info.bond_sum, bond_info.bond_name, bond_info.bond_remark, bond_info.rep_id FROM bond_info WHERE bond_info.rep_id = ${rep_id} ORDER BY  bond_info.bond_id DESC`)
            let pawnList = await sql.query(`SELECT pawn_info.pawn_id, pawn_info.pawn_sum, pawn_info.pawn_name, pawn_info.pawn_bond, pawn_info.pawn_remark, pawn_info.rep_id FROM pawn_info WHERE pawn_info.rep_id = ${rep_id} ORDER BY pawn_info.pawn_id DESC`)
            return {
                finaList: finaList[0],
                bondList: bondList[0],
                pawnList: pawnList[0]
            }


        })
        res.send({ code: 20000, data: { finaList: data.finaList, bondList: data.bondList, pawnList: data.pawnList } })
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }
})


module.exports = router;
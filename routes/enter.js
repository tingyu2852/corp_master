var express = require('express');
const { linkSql, linkMySql } = require('../untils/sql');
const finaStr = require('../untils/finaStr')
var router = express.Router();
var dayjs = require('dayjs');
const { computrRepay, updateRate, updatePlan, updatePlanInter, updateInfo, repayTotal, createInterInfo,projLoan } = require('../untils/updateInter')
var isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
// import isSameOrBefore from 'dayjs/plugin/isSameOrBefore' // ES 2015
const isBetween = require('dayjs/plugin/isBetween')
const QuarterOfYear = require('dayjs/plugin/QuarterOfYear')
const isLeapYear = require('dayjs/plugin/isLeapYear');
const e = require('cors');
//const isBefore = require('dayjs/plugin/isBefore')

dayjs.extend(isSameOrBefore) // use plugin
dayjs.extend(isBetween)
dayjs.extend(QuarterOfYear)
dayjs.extend(isLeapYear)

//项目录入页面获取项目基础信息
router.get('/proj', async (req, res) => {
    try {
        const { proj_id } = req.query
        let data = await linkSql(`SELECT
    proj_basice.proj_id,
    proj_basice.proj_name,
    proj_basice.fina_name,
    proj_basice.proj_status,
    proj_basice.corp_name,
    proj_basice.update_time,
    proj_basice.creat_time,
    proj_basice.hidden_debt,
    proj_basice.proj_remark,
    proj_basice.proj_node
    FROM
    proj_basice
    WHERE proj_id = '${proj_id}'`)
        res.send({ code: 20000, data: { projInfo: data[0] } })
    } catch (error) {
        res.send({ code: 200001, message: '错误' })
    }

})
router.post('/proj', async (req, res) => {
    try {
        let { proj_name, fina_name, proj_status, corp_name, proj_remark, hidden_debt, proj_id } = req.body
        proj_status = 1

        let data = await linkMySql(async sql => {
            try {
                if (proj_id) {
                    let data = await sql.execute(finaStr.updateProj, [proj_name, fina_name, proj_status, corp_name, proj_remark, hidden_debt, proj_id])
                    return proj_id
                } else {
                    let nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
                    const year = dayjs().format('YYYY')
                    await sql.beginTransaction()
                    let cur_proj_id = null
                    //获取proj_id是否存在当前年份开头
                    let proj_ids = (await sql.execute(`SELECT
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
                    if (proj_ids.length === 0) {
                        cur_proj_id = `${dayjs().format('YYYY')}001`
                    } else {
                        cur_proj_id = parseInt(proj_ids[0].proj_id) + 1
                        // console.log(JSON.stringify({cur_proj_id, proj_name, fina_name, proj_status, corp_name, nowTime, hidden_debt, proj_remark}));
                    }
                    const sqlstr = `INSERT INTO proj_basice(proj_id, proj_name, fina_name, proj_status, corp_name,creat_time,hidden_debt,proj_remark,proj_node) VALUES (?,?,?,?,?,?,?,?,?)`
                    let proj_node = 'proj'
                    cur_proj_id = cur_proj_id.toString()
                    const list = [cur_proj_id, proj_name, fina_name, proj_status, corp_name, nowTime, hidden_debt, proj_remark, proj_node]
                    let res2 = await sql.execute(sqlstr, [cur_proj_id, proj_name, fina_name, 1, corp_name, nowTime, hidden_debt, proj_remark, proj_node])
                    //console.log(res1);


                    await sql.commit()
                    return cur_proj_id
                }
            } catch (error) {
                await sql.rollback()
                console.log(error);
                throw new Error(error)
            }
        })
        res.send({ code: 20000, data: { proj_id: data }, message: '操作成功' })
    } catch (error) {
        console.log(error);
        res.send({ code: 200001, message: '错误' })
    }

})
//项目录入阶段获取批复信息
router.get('/rep', async (req, res) => {
    try {
        const { proj_id } = req.query
        let data = await linkSql(`SELECT
        rep_info.rep_id,
        rep_info.bank_name,
        rep_info.rep_sum,
        rep_info.rep_date,
        rep_info.rep_limit,
        rep_info.rep_sou,
        rep_info.proj_id,
        rep_info.rep_remark,
        rep_info.Interest_settlement,
        rep_info.rep_remaining,
        rep_info.loan_total,
        rep_info.bank_consortium,
        rep_info.sub_project,
        rep_info.sub_project_list
        FROM
        rep_info
        WHERE proj_id = '${proj_id}'`)
        res.send({ code: 20000, data: { repInfo: data[0] } })
    } catch (error) {
        res.send({ code: 200001, message: '错误' })
    }

})

router.post('/rep', async (req, res) => {
    try {
        let { bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark, bank_consortium, sub_project, sub_project_list, rep_id } = req.body
        sub_project_list = Array.isArray(sub_project_list) ? JSON.stringify(sub_project_list) : '[]'
        if (rep_id) {
            await linkSql(finaStr.updateRep, [bank_name, rep_sum, rep_date, rep_limit, rep_sou, rep_remark, bank_consortium, sub_project, sub_project_list, rep_id])
        } else {

            await linkMySql(async sql => {
                await sql.beginTransaction()
                try {
                    let repStr = `INSERT INTO rep_info(bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark,rep_remaining,bank_consortium,sub_project,sub_project_list) VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?,?)`
                    await sql.execute(repStr, [bank_name, rep_sum, rep_date, rep_limit, rep_sou, proj_id, rep_remark, rep_sum, bank_consortium, sub_project, sub_project_list])
                    await sql.execute(`UPDATE proj_basice SET proj_node = 'rep' WHERE proj_id = '${proj_id}'`)
                    await sql.commit()
                } catch (error) {
                    sql.rollback()
                    throw new Error(error)
                }
            })


        }
        res.send({ code: 20000, message: '操作成功' })
    } catch (error) {
        console.log(error);
        res.send({ code: 200001, message: '错误' })
    }

})
//获取其他信息接口
router.get('/other', async (req, res) => {
    try {
        let { proj_id } = req.query
        let data = await linkMySql(async (sql) => {
            let finaList = await sql.execute(`SELECT fina_cost.cost_id, fina_cost.cost_name, fina_cost.cost_sum, fina_cost.cost_date, fina_cost.corp_name, fina_cost.cost_remark, fina_cost.rep_id, fina_cost.proj_id FROM fina_cost WHERE fina_cost.proj_id = ${proj_id} ORDER BY fina_cost.cost_id DESC`)
            let bondList = await sql.execute(`SELECT bond_info.bond_id, bond_info.bond_sum, bond_info.bond_name, bond_info.bond_remark, bond_info.rep_id, bond_info.proj_id FROM bond_info WHERE bond_info.proj_id = ${proj_id} ORDER BY  bond_info.bond_id DESC`)
            let pawnList = await sql.execute(`SELECT pawn_info.pawn_id, pawn_info.pawn_sum, pawn_info.pawn_name, pawn_info.pawn_bond, pawn_info.pawn_remark, pawn_info.rep_id, pawn_info.proj_id FROM pawn_info WHERE pawn_info.proj_id = ${proj_id} ORDER BY pawn_info.pawn_id DESC`)
            let repInfo = (await sql.execute(finaStr.repInfo, [proj_id]))[0]
            return {
                finaList: finaList[0],
                bondList: bondList[0],
                pawnList: pawnList[0],
                repInfo: repInfo[0]
            }
        })
        res.send({ code: 20000, data: { finaList: data.finaList, bondList: data.bondList, pawnList: data.pawnList, repInfo: data.repInfo } })
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }
})

//融资费用新增或添加接口
router.post('/cost', async (req, res) => {
    let { corp_name, cost_date, cost_id, cost_name, cost_remark, cost_sum, rep_id, proj_id } = req.body
    let sqlstr = `INSERT INTO fina_cost(cost_name, cost_sum, cost_date, corp_name, cost_remark, proj_id,rep_id) VALUES (?, ?, ?, ?, ?, ?,?)`
    try {
        if (!cost_id) {
            const data = await linkSql(sqlstr, [cost_name, cost_sum, cost_date, corp_name, cost_remark, proj_id, rep_id])
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
    let { bond_sum, bond_name, bond_remark, proj_id, bond_id, rep_id } = req.body
    let sqlstr = `INSERT INTO bond_info(bond_sum, bond_name, bond_remark, proj_id,rep_id) VALUES (?, ?, ?, ?,?)`
    try {
        if (!bond_id) {
            const data = await linkSql(sqlstr, [bond_sum, bond_name, bond_remark, proj_id, rep_id])
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
    let { pawn_sum, pawn_name, pawn_bond, pawn_remark, proj_id, pawn_id, rep_id } = req.body
    let sqlstr = `INSERT INTO pawn_info(pawn_sum, pawn_name, pawn_bond, pawn_remark, proj_id,rep_id) VALUES (?, ?, ?, ?, ?,?)`
    try {
        if (!pawn_id) {
            const data = await linkSql(sqlstr, [pawn_sum, pawn_name, pawn_bond, pawn_remark, proj_id, rep_id])
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

//项目录入阶段获取借款信息
router.get('/loan', async (req, res) => {
    try {
        const { proj_id } = req.query
        let data1 = await linkMySql(async sql => {
            let res1 = (await sql.execute(`SELECT
            loan_info.loan_id,
            loan_info.loan_con_id,
            loan_info.loan_sum,
            loan_info.loan_date,
            loan_info.loan_remark,
            loan_info.proj_id,
            loan_info.inter_plan,
            loan_info.rep_limit,
            loan_info.is_repay,
            loan_info.is_inter,
            loan_info.is_float_rate,
            loan_info.rate,
            loan_info.is_actual,
            loan_info.sub_project_list,
            loan_info.inter_first_date
            FROM
            loan_info
            WHERE proj_id = '${proj_id}'`))[0]
            let res2 = (await sql.execute(finaStr.repInfo, [proj_id]))[0][0]
            return {
                loanList: res1,
                repInfo: res2
            }

        })
        res.send({ code: 20000, data: { loanList: data1.loanList, repInfo: data1.repInfo } })
    } catch (error) {
        res.send({ code: 200001, message: '错误' })
    }

})
//借款信息添加
router.post('/loan', async (req, res) => {
    try {
        let { loan_sum, loan_date, loan_remark, rep_id, inter_plan, rep_limit, loan_id, rate, is_actual, is_float_rate, mt_total, sub_project_list, inter_first_date, proj_id } = req.body
        sub_project_list = Array.isArray(sub_project_list) ? sub_project_list : []
        sub_project_list = JSON.stringify(sub_project_list)
        let data = await linkMySql(async sql => {
            try {

                await sql.beginTransaction()
                let repInfo = (await sql.execute(finaStr.repInfo, [proj_id]))[0][0]

                if (loan_id) {
                    if (is_actual === 1) {
                        loan_sum = parseInt(mt_total)
                    }
                    let data1 = (await sql.execute(`SELECT loan_info.rate,loan_info.is_float_rate,loan_info.everyday_inter FROM loan_info WHERE loan_id = ${loan_id}`))[0]
                    let sql_str = `UPDATE loan_info SET loan_sum = ?,inter_plan = ?, loan_date = ?, loan_remark = ?, rep_id = ?,is_float_rate=?,rate=?,sub_project_list = ? WHERE loan_id = ?`
                    if (parseFloat(data1[0].is_float_rate) !== is_float_rate) {
                        await updateInfo(data1[0].everyday_inter, rate, is_float_rate)
                        let data2 = await sql.execute(`UPDATE loan_info SET loan_sum = ?,inter_plan = ?, loan_date = ?, loan_remark = ?, rep_id = ?,is_float_rate=?,rate=?,sub_project_list = ? , everyday_inter = ? WHERE loan_id = ?`, [loan_sum, inter_plan, loan_date, loan_remark, rep_id, is_float_rate, rate, sub_project_list, JSON.stringify(data1[0].everyday_inter), loan_id])
                        // console.log(data1[0].everyday_inter.slice(0,10));
                    } else if (parseFloat(data1[0].rate) !== rate) {
                        await updateInfo(data1[0].everyday_inter, rate, is_float_rate)

                        let data2 = await sql.execute(`UPDATE loan_info SET loan_sum = ?,inter_plan = ?, loan_date = ?, loan_remark = ?, rep_id = ?,is_float_rate=?,rate=?,sub_project_list = ? , everyday_inter = ? WHERE loan_id = ?`, [loan_sum, inter_plan, loan_date, loan_remark, rep_id, is_float_rate, rate, sub_project_list, JSON.stringify(data1[0].everyday_inter), loan_id])
                        // console.log(data1[0].everyday_inter.slice(0,10));
                    } else {
                        let data = await sql.execute(sql_str, [loan_sum, inter_plan, loan_date, loan_remark, rep_id, is_float_rate, rate, sub_project_list, loan_id])
                    }

                    //console.log();

                } else {
                    // console.log(repInfo);
                    let everyday_inter = await createInterInfo(loan_date, inter_plan, inter_first_date, repInfo.rep_limit, rate, is_float_rate)
                    everyday_inter = JSON.stringify(everyday_inter)
                    let add = `INSERT INTO loan_info( loan_sum, loan_date, loan_remark, proj_id, inter_plan,rep_limit,is_repay,rate,is_actual,is_float_rate,sub_project_list,everyday_inter,inter_first_date,rep_id) VALUES (?,?,?, ?, ?, ?, ?, ?,?,?,?,?,?,?)`
                    let data = await sql.execute(add, [loan_sum, loan_date, loan_remark, proj_id, inter_plan, repInfo.rep_limit, 1, rate, is_actual, is_float_rate, sub_project_list, everyday_inter, inter_first_date, rep_id])



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
//下款信息获取
router.get('/mt', async (req, res) => {
    try {
        const { loan_id } = req.query
        let mtsql = `SELECT
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
            WHERE loan_id = ${loan_id}`
        let loansql = `SELECT
            loan_info.loan_id,
            loan_info.loan_con_id,
            loan_info.loan_sum,
            loan_info.loan_date,
            loan_info.loan_remark,
            loan_info.proj_id,
            loan_info.inter_plan,
            loan_info.rep_limit,
            loan_info.is_repay,
            loan_info.is_inter,
            loan_info.is_float_rate,
            loan_info.rate,
            loan_info.is_actual,
            loan_info.sub_project_list,
            loan_info.inter_first_date,
            rep_info.rep_sum,
            rep_info.rep_date,
            rep_info.rep_limit,
            rep_info.rep_sou,
            rep_info.rep_remark,
            rep_info.Interest_settlement,
            rep_info.rep_remaining,
            rep_info.loan_total,
            rep_info.bank_consortium,
            rep_info.sub_project,
            rep_info.sub_project_list,
            rep_info.rep_id
            FROM
            loan_info
            INNER JOIN rep_info ON loan_info.proj_id = rep_info.proj_id
            WHERE
            loan_info.loan_id = ${loan_id}`
        let data = await linkMySql(async sql => {
            //await sql.beginTransaction()
            try {
                let loanInfo = (await sql.execute(loansql))[0][0]
                let mtList = (await sql.execute(mtsql))[0]
                return {
                    loanInfo,
                    mtList
                }
            } catch (error) {
                //await sql.rollback()
                console.log(error);
                throw new Error(error)
            }
        })
        res.send({ code: 20000, data: { mtList: data.mtList, loanInfo: data.loanInfo } })
    } catch (error) {
        console.log(error);
        res.send({ code: 200001, message: '错误' })
    }

})
//走款信息获取
router.get('/sp', async (req, res) => {
    try {
        const { mt_id } = req.query
        // let data = await linkSql(`SELECT
        // SELECT
        // sp_info.sp_id,
        // sp_info.sp_date,
        // sp_info.corp_name,
        // sp_info.sp_num,
        // sp_info.refund,
        // sp_info.actul_num,
        // sp_info.invoice,
        // sp_info.sp_use,
        // sp_info.remark,
        // sp_info.con_id,
        // sp_info.mt_id
        // FROM
        // sp_info
        //  WHERE mt_id = ${mt_id}`)
        let data = await linkMySql(async sql => {
            //await sql.beginTransaction()
            try {
                let mtInfo = (await sql.execute(`SELECT
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
                WHERE mt_id = ${mt_id}`))[0][0]
                let spList = (await sql.execute(`
                SELECT
                sp_info.sp_id,
                sp_info.sp_date,
                sp_info.corp_name,
                sp_info.sp_num,
                sp_info.refund,
                sp_info.actul_num,
                sp_info.invoice,
                sp_info.sp_use,
                sp_info.remark,
                sp_info.con_id,
                sp_info.mt_id
                FROM
                sp_info
                WHERE sp_info.mt_id = ${mt_id}`))[0]
                return {
                    mtInfo,
                    spList
                }
            } catch (error) {
                console.log(error);
                throw new Error(error)
            }
        })
        res.send({ code: 20000, data: { spList: data.spList, mtInfo: data.mtInfo } })
    } catch (error) {
        console.log(error);
        res.send({ code: 200001, message: '错误' })
    }

})
router.get('/next', async (req, res) => {
    try {
        let { id, name, proj_id } = req.query

        switch (name) {
            case 'end':
                let data = await linkSql(`UPDATE proj_basice SET proj_node = 'end' WHERE proj_id = '${proj_id}'`)
                break;
            case 'proj':
                await linkSql(`UPDATE proj_basice SET proj_node = 'proj_${id}' WHERE proj_id = '${id}'`)
                break;
            case 'rep':
                await linkSql(`UPDATE proj_basice SET proj_node = 'rep_${id}' WHERE proj_id = '${id}'`)
                break;
            case 'repay':
                await linkSql(`UPDATE proj_basice SET proj_node = 'repay_${id}' WHERE proj_id = '${id}'`)
                break;
            case 'other':
                await linkSql(`UPDATE proj_basice SET proj_node = 'other_${id}' WHERE proj_id = '${id}'`)
                break;
            case 'loan':
                await linkSql(`UPDATE proj_basice SET proj_node = 'loan_${id}' WHERE proj_id = '${id}'`)
                break;
            case 'mt':
                await linkSql(`UPDATE proj_basice SET proj_node = 'mt_${id}' WHERE proj_id = '${proj_id}'`)
                break;
            case 'sp':
                await linkSql(`UPDATE proj_basice SET proj_node = 'sp_${id}' WHERE proj_id = '${proj_id}'`)
                break;

            default:
                break;
        }
        res.send({ code: 20000, message: '操作成功' })
    } catch (error) {
        res.send({ code: 20001, message: '错误' })
    }


})


router.get('/repay', async (req, res) => {
    try {
        let { proj_id } = req.query
        let data = await linkMySql(async sql => {
            try {
                let repInfo = (await sql.execute(`SELECT
                rep_info.rep_id,
                rep_info.bank_name,
                rep_info.rep_sum,
                rep_info.rep_date,
                rep_info.rep_limit,
                rep_info.rep_sou,
                rep_info.proj_id,
                rep_info.rep_remark,
                rep_info.Interest_settlement,
                rep_info.rep_remaining,
                rep_info.loan_total,
                rep_info.bank_consortium,
                rep_info.sub_project,
                rep_info.sub_project_list
                FROM
                rep_info
                WHERE
                proj_id=${proj_id}
                `))[0]
                let list = []
                if (repInfo.length > 0) {
                    let repayList = (await sql.execute(`SELECT
                repay_plan.repay_id,
                repay_plan.plan_date,
                repay_plan.repay_num,
                repay_plan.remark,
                repay_plan.rep_id
                FROM
                repay_plan
                WHERE
                rep_id = ${repInfo[0].rep_id}`))[0]
                    list = repayList
                }
                return {
                    repInfo: repInfo[0],
                    repayList: list
                }
            } catch (error) {
                throw new Error(error)
            }
        })
        res.send({ code: 20000, data: { repInfo: data.repInfo, repayList: data.repayList } })
    } catch (error) {
        console.log(error);
        return resError(res)
    }

})
router.post('/repay', async (req, res) => {
    try {
        let { plan_date, remark, rep_id, repay_id, repay_num } = req.body
        if (repay_id) {
            await linkSql(`UPDATE repay_plan SET plan_date = ?, repay_num = ?, remark = ? WHERE repay_id = ?`, [plan_date, repay_num, remark, repay_id])
        } else {
            let data = await linkSql(`INSERT INTO repay_plan(plan_date, repay_num, remark, rep_id) VALUES (?, ?, ?, ?)`, [plan_date, repay_num, remark, rep_id])
        }
        res.send({ code: 20000, message: '操作成功' })
    } catch (error) {
        console.log(error);
        return resError(res)
    }
})

router.get('/every',async(req,res)=>{
    try {
        let {proj_id}=req.query
       let list = await projLoan(proj_id)
       res.send({ code: 20000,data:{list}, message: '操作成功' })
    } catch (error) {
        return resError(res)
    }
})

const resError = (res) => {
    res.send({ code: 20001, message: '错误' })
}
module.exports = router;
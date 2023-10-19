var express = require('express');
const { linkSql, linkMySql } = require('../untils/sql');
const finaStr = require('../untils/finaStr')
var router = express.Router();
var dayjs = require('dayjs');
const { computrRepay, updateRate, updatePlan, updatePlanInter, updateInfo, repayTotal } = require('../untils/updateInter')
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
        console.log(req.body);
        proj_status = 1

        let data = await linkMySql(async sql => {
            try {
                if (proj_id) {
                    let data = await linkSql(finaStr.updateProj, [proj_name, fina_name, proj_status, corp_name, proj_remark, hidden_debt, proj_id])
                    return proj_id
                } else {
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
                    const sql2 = `INSERT INTO proj_basice(proj_id, proj_name, fina_name, proj_status, corp_name,creat_time,hidden_debt,proj_remark) VALUES (?,?,?,?,?,?,?,?)`
                    let proj_node = 'proj'
                    const list = [cur_proj_id, proj_name, fina_name, proj_status, corp_name, nowTime, hidden_debt, proj_remark, proj_node]
                    let res2 = await sql.execute(sql2, list)
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
        console.log(req.body);
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

//项目录入阶段获取批复信息
router.get('/loan', async (req, res) => {
    try {
        const { rep_id } = req.query
        let data = await linkSql(`SELECT
        loan_info.loan_id,
        loan_info.loan_con_id,
        loan_info.loan_sum,
        loan_info.loan_date,
        loan_info.loan_remark,
        loan_info.rep_id,
        loan_info.inter_plan,
        loan_info.rep_limit,
        loan_info.is_repay,
        loan_info.is_inter,
        loan_info.is_float_rate,
        loan_info.rate,
        loan_info.is_actual,
        loan_info.sub_project_list
        FROM
        loan_info
        WHERE rep_id = ${rep_id}`)
        res.send({ code: 20000, data: { loanInfo: data[0] } })
    } catch (error) {
        res.send({ code: 200001, message: '错误' })
    }

})
//下款信息获取
router.get('/mt', async (req, res) => {
    try {
        const { loan_id } = req.query
        let data = await linkSql(`SELECT
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
            WHERE loan_id = ${loan_id}`)
        res.send({ code: 20000, data: { mtInfo: data[0] } })
    } catch (error) {
        console.log(error);
        res.send({ code: 200001, message: '错误' })
    }

})
//走款信息获取
router.get('/sp', async (req, res) => {
    try {
        const { mt_id } = req.query
        let data = await linkSql(`SELECT
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
         WHERE mt_id = ${mt_id}`)
        res.send({ code: 20000, data: { spInfo: data[0] } })
    } catch (error) {
        console.log(error);
        res.send({ code: 200001, message: '错误' })
    }

})
module.exports = router;
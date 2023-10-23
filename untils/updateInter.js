const { linkSql, linkSeverSql, linkMySql } = require('../untils/sql');
const dayjs = require('dayjs')
const QuarterOfYear = require('dayjs/plugin/QuarterOfYear')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
//const isBefore = require('dayjs/plugin/isBefore')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const isBetween = require('dayjs/plugin/isBetween');
const finaStr = require('./finaStr');
dayjs.extend(QuarterOfYear)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isBetween)
//重新计算每日的结息情况
async function computrRepay(everyday_inter) {
    if (!Array.isArray(everyday_inter)) {
        throw new Error('请传入一个数组')
    }
    for (let j = 0; j < everyday_inter.length; j++) {
        if (j !== 0) {

            everyday_inter[j].princaipal = everyday_inter[j - 1].princaipal - everyday_inter[j - 1].repay_plan + everyday_inter[j].mt_num

        } else {
            everyday_inter[j].princaipal = everyday_inter[j].mt_num
        }
        everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
    }



}
//重新更新利率
async function updateRate(everyday_inter) {
    if (!Array.isArray(everyday_inter)) {
        throw new Error('请传入一个数组')
    }
    let list1 = await linkSql(`SELECT
    rate_info.rate_id,
    rate_info.date,
    rate_info.rate,
    rate_info.remark
    FROM
    rate_info
    ORDER BY
    rate_info.date ASC
    
    `)
    let cur = 0
    //console.log(list1);
    for (let i = 0; i < list1.length; i++) {
        // console.log(list1[i].date);
        for (let j = cur; j < everyday_inter.length; j++) {
            //cur=j+1
            if (list1.length === 1) {
                if (dayjs(everyday_inter[j].date).isSameOrAfter(dayjs(list1[0].date))) {
                    everyday_inter[j].rate = parseFloat((parseFloat(everyday_inter[j].rate) + parseFloat(list1[0].rate)).toFixed(5))
                    cur = j + 1
                }

            } else {
                if (i === list1.length - 1) {
                    if (dayjs(everyday_inter[j].date).isSameOrAfter(dayjs(list1[0].date))) {
                        //console.log(everyday_inter[j].rate);
                        everyday_inter[j].rate = parseFloat((parseFloat(everyday_inter[j].rate) + parseFloat(list1[i].rate)).toFixed(5))
                        cur = j + 1
                        //console.log(parseFloat((parseFloat(everyday_inter[j].rate) + parseFloat(list1[i].rate)).toFixed(4)));
                    }
                } else {
                    //console.log('2');
                    //console.log(everyday_inter[j].date,list1[i].date,list1[i+1].date);
                    //console.log(dayjs(everyday_inter[j].date).isBetween(dayjs(list1[i].date),dayjs(list1[i+1].date),'[)'));
                    if (dayjs(everyday_inter[j].date).isBetween(dayjs(list1[i].date), dayjs(list1[i + 1].date), '[)')) {
                        everyday_inter[j].rate = parseFloat((parseFloat(everyday_inter[j].rate) + parseFloat(list1[i].rate)).toFixed(5))
                        // console.log(everyday_inter[j].rate);
                        cur = j + 1
                    }
                }
            }

        }
    }



}

async function updatePlan(loan_id, datelist) {
    return
    if (!loan_id) {
        return
    }
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'));
    let data = await linkSql('', '', true, async (sql) => {
        try {
            await sql.beginTransaction()
            console.log(321);
            await sql.execute(`UPDATE repay_info SET is_inter_set = 0 WHERE loan_id = ${loan_id} AND is_inter_set = 1`)
            let data = await sql.execute(`SELECT
        repay_info.repay_id,
        repay_info.date,
        repay_info.loan_id,
        repay_info.is_inter_set,
        repay_info.inter_plan,
        repay_info.inter_actual
        FROM
        repay_info
        WHERE
        repay_info.loan_id = ${loan_id}
        ORDER BY
        repay_info.date ASC`)
            let list = data[0]
            let j = 0
            let cur = 0
            for (let i = 0; i < list.length; i++) {
                cur += parseFloat(list[i].inter_plan)
                for (let a = j; a < datelist.length; a++) {
                    if (list[i].date === datelist[a]) {
                        //  console.log(datelist[a]);
                        //console.log(cur);
                        await sql.execute(`UPDATE repay_info SET inter_actual = ${parseFloat(cur.toFixed(2))},is_inter_set = 1 WHERE repay_id = ${list[i].repay_id}`)
                        cur = 0
                        j = a
                        break
                    }
                }
            }
            console.log(dayjs().format('YYYY-MM-DD HH:mm:ss.SSS'));
            await sql.commit()

        } catch (error) {
            await sql.rollback()
            console.log(error);
        }
    })
}

//计算每个结息时间点的需要付息多少
async function updatePlanInter(everyday_inter) {
    if (!Array.isArray(everyday_inter)) {
        throw new Error('请传入一个数组')
    }
    let inter_sum = 0
    for (let i = 0; i < everyday_inter.length; i++) {
        inter_sum = parseFloat((inter_sum + everyday_inter[i].inter_plan).toFixed(2))

        if (everyday_inter[i].is_inter_set === 1) {
            everyday_inter[i].inter_actual = inter_sum
            inter_sum = 0
        }
    }
}
//当利率修改后重新计算每日结息，结息计划，每日结息的利率
async function updateInfo(everyday_inter, rate, is_float_rate) {
    if (!Array.isArray(everyday_inter)) {
        throw new Error('请传入一个数组')
    }
    if (is_float_rate === 1) {
        let list1 = await linkSql(`SELECT
        rate_info.rate_id,
        rate_info.date,
        rate_info.rate,
        rate_info.remark
        FROM
        rate_info
        ORDER BY
        rate_info.date ASC
        
        `)
        let cur = 0
        let ab = 0
        //console.log(list1);
        for (let i = 0; i < list1.length; i++) {
            // console.log(list1[i].date);
            for (let j = cur; j < everyday_inter.length; j++) {
                //everyday_inter[j].rate = rate

                if (list1.length === 1) {
                    if (dayjs(everyday_inter[j].date).isSameOrAfter(dayjs(list1[0].date))) {
                        everyday_inter[j].rate = parseFloat((parseFloat(rate) + parseFloat(list1[0].rate)).toFixed(5))
                        everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
                        cur = j + 1
                        ab++
                    }
                } else {

                    if (i === list1.length - 1) {
                        if (dayjs(everyday_inter[j].date).isSameOrAfter(dayjs(list1[i].date))) {
                            everyday_inter[j].rate = parseFloat((parseFloat(rate) + parseFloat(list1[i].rate)).toFixed(5))
                            everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
                            ab++
                            cur = j + 1

                        }

                    } else {
                        if (dayjs(everyday_inter[j].date).isBetween(dayjs(list1[i].date), dayjs(list1[i + 1].date), '[)')) {
                            everyday_inter[j].rate = parseFloat((parseFloat(rate) + parseFloat(list1[i].rate)).toFixed(5))
                            everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
                            cur = j + 1
                            ab++

                        }

                    }
                }

                // everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))

            }
        }

        updatePlanInter(everyday_inter)
    } else {
        for (let j = 0; j < everyday_inter.length; j++) {
            everyday_inter[j].rate = rate

            everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
        }
        updatePlanInter(everyday_inter)
    }

}

//计算当前时间已还本金额
async function repayTotal(everyday_inter) {
    if (!Array.isArray(everyday_inter)) {
        throw new Error('请传入一个数组')
    }
    let repay_total = 0
    for (let i = 0; i < everyday_inter.length; i++) {
        if (dayjs(everyday_inter[i].date).isBefore(dayjs())) {
            repay_total = parseInt(repay_total) + parseInt(everyday_inter[i].repay_plan)
        } else {
            break
        }
    }
    return repay_total
}
//生成每日结息详情
const createInterInfo = async (date, inter_plan, inter_first_date, limit, rate, is_float_rate) => {
    let start = dayjs(date)
    const endDate = start.add(limit, 'month').subtract(1, 'day')
    let dateList = []

    let curDate = dayjs(inter_first_date)
    switch (inter_plan) {
        case '每月':
            //
            while (curDate.isBefore(endDate)) {
                dateList.push(curDate.format("YYYY-MM-DD"));
                curDate = curDate.add(1, "month");
                //console.log(endDate.format('YYYY-MM-DD'));
            }
            // console.log(dateList);
            break;

        case '每季度':
            while (curDate.isBefore(endDate)) {
                dateList.push(curDate.format("YYYY-MM-DD"));
                curDate = curDate.add(1, "quarter");
            }
            // console.log(dateList);
            break;
        case '每半年':
            while (curDate.isBefore(endDate)) {
                dateList.push(curDate.format("YYYY-MM-DD"));
                curDate = curDate.add(6, "month");
            }
            // console.log(dateList);
            break;
        case '每年':
            while (curDate.isBefore(endDate)) {
                dateList.push(curDate.format("YYYY-MM-DD"));
                curDate = curDate.add(1, "year");
            }
            // console.log(dateList);
            break;

        default:

            break;
    }
    //console.log(dateList);
    let currentDate = start
    let j = 0
    let i = 0
    let interList = []
    while (!currentDate.isAfter(endDate)) {
        let obj = {
            princaipal: 0,
            rate: parseFloat(rate),
            date: currentDate.format('YYYY-MM-DD'),
            inter_plan: 0,
            repay_plan: 0,
            inter_actual: 0,
            repay_actual: 0,
            mt_num: 0,
            is_inter_set: 0
        }

        for (let i = j; i < dateList.length; i++) {
            if (currentDate.isSame(dayjs(dateList[i]))) {
                obj.is_inter_set = 1
                j = i + 1
                break;
            }
        }
        interList.push(obj)

        currentDate = currentDate.add(1, 'day')
    }
    if (is_float_rate === 1) {
        await updateRate(interList)
    }
    return interList
}

//项目分类为项目贷时生成每日结息表
// const projLoan = async (proj_id) => {
//     let data = await linkMySql(async sql => {
//         try {
//             let repInfo = (await sql.execute(finaStr.repInfo, [proj_id]))[0][0]
//             let loanInfo = (await sql.execute(`SELECT
//             loan_info.loan_id,
//             loan_info.loan_con_id,
//             loan_info.loan_sum,
//             loan_info.loan_date,
//             loan_info.loan_remark,
//             loan_info.rep_id,
//             loan_info.inter_plan,
//             loan_info.rep_limit,
//             loan_info.is_repay,
//             loan_info.is_inter,
//             loan_info.is_float_rate,
//             loan_info.rate,
//             loan_info.is_actual,
//             loan_info.everyday_inter,
//             loan_info.sub_project_list,
//             loan_info.proj_id,
//             loan_info.inter_first_date
//             FROM
//             loan_info
//             WHERE 
//             proj_id = '${proj_id}'`))[0][0]
//             let list = await createInterInfo(repInfo.rep_date, loanInfo.inter_plan, loanInfo.inter_first_date, repInfo.rep_limit, loanInfo.rate, loanInfo.is_float_rate)
//             console.log(list.slice(0, 20));
//             await repayPlan(proj_id, list)
//             return list
//         } catch (error) {
//             throw new Error
//         }

//     })
//     return data

// }

const repayPlan = async (proj_id) => {
    let data = await linkMySql(async sql => {
        try {
            await sql.beginTransaction()
            let repayPlan = (await sql.execute(`SELECT
        repay_plan.repay_id,
        repay_plan.plan_date,
        repay_plan.repay_num,
        repay_plan.remark,
        repay_plan.rep_id
        FROM
        repay_plan
        INNER JOIN rep_info ON repay_plan.rep_id = rep_info.rep_id
        WHERE
        rep_info.proj_id = '${proj_id}'`))[0]
            let repInfo = (await sql.execute(`SELECT
        rep_info.everyday_inter
        FROM
        rep_info
        WHERE rep_info.proj_id = ${proj_id}
        `))[0][0]
            let cur = 0
            for (let j = 0; j < repInfo.everyday_inter.length; j++) {
                //repInfo.everyday_inter[j].rate = parseFloat(loanInfo[0].rate)
                repInfo.everyday_inter[j].repay_plan = 0
                for (let i = cur; i < repayPlan.length; i++) {
                    if (dayjs(repInfo.everyday_inter[j].date).isSame(repayPlan[i].plan_date)) {
                        repInfo.everyday_inter[j].repay_plan += repayPlan[i].repay_num
                        cur = i + 1
                    }
                }



            }
            repInfo.everyday_inter = JSON.stringify(repInfo.everyday_inter)
            await sql.execute(`UPDATE rep_info SET everyday_inter = ? WHERE proj_id = ?`, [repInfo.everyday_inter, proj_id])
            await sql.commit()
        } catch (error) {
            await sql.rollback()
            throw new Error(error)
        }
    })

}
//项目分类为项目贷时生成每日结息表
const projEver = (date, limit) => {
    let start = dayjs(date)
    const endDate = start.add(limit, 'month').subtract(1, 'day')
    let currentDate = start
    let interList = []
    while (!currentDate.isAfter(endDate)) {
        let obj = {
            princaipal: 0,
            rate: 0,
            date: currentDate.format('YYYY-MM-DD'),
            inter_plan: 0,
            repay_plan: 0,
            inter_actual: 0,
            repay_actual: 0,
            mt_num: 0,
            is_inter_set: 0
        }


        interList.push(obj)
        currentDate = currentDate.add(1, 'day')
    }
    return interList
}
//下款发生改变时更新结息详情表
const updateMtInter = async (sql, proj_id) => {
    let mtList = (await sql.execute(`SELECT
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
    INNER JOIN loan_info ON mt_info.loan_id = loan_info.loan_id
    WHERE
    loan_info.proj_id = '${proj_id}'
    ORDER BY
    mt_info.mt_date ASC`))[0]
    let repInfo = (await sql.execute(`SELECT
    rep_info.everyday_inter
    FROM
    rep_info
    WHERE rep_info.proj_id = ${proj_id}
    `))[0][0]


    let cur = 0
    const len = mtList.leng - 1
    for (let j = 0; j < repInfo.everyday_inter.length; j++) {
        repInfo.everyday_inter[j].mt_num = 0
        for (let i = cur; i < mtList.length; i++) {
            if (dayjs(repInfo.everyday_inter[j].date).isSame(mtList[i].mt_date)) {
                repInfo.everyday_inter[j].mt_num += mtList[i].mt_sum
                cur = i + 1
                if (i < len) {
                    if (dayjs(repInfo.everyday_inter[j].date).isSame(mtList[i].mt_date)) {
                        break
                    }
                }

            }
        }

    }
    repInfo.everyday_inter = JSON.stringify(repInfo.everyday_inter)
    await sql.execute(`UPDATE rep_info SET everyday_inter = ? WHERE proj_id = ?`, [repInfo.everyday_inter, proj_id])
}

const computedInter = async (proj_id) => {
    let data = await linkMySql(async sql => {
        try {
            await sql.beginTransaction()
            await repayPlan(proj_id)
            let loan_info = (await sql.execute(`SELECT
            loan_info.loan_id,
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
            loan_info.proj_id,
            loan_info.inter_first_date
            FROM
            loan_info
            WHERE
            loan_info.proj_id = '${proj_id}'
            LIMIT 0, 1
            `
            ))[0][0]
            let repInfo = (await sql.execute(`SELECT
            rep_info.everyday_inter,
            rep_info.rep_date,
            rep_info.rep_limit
            FROM
            rep_info
            WHERE rep_info.proj_id = '${proj_id}'
            `))[0][0]

            if (loan_info.is_float_rate === 1) {
                let list1 = (await sql.execute(`SELECT
                rate_info.rate_id,
                rate_info.date,
                rate_info.rate,
                rate_info.remark
                FROM
                rate_info
                ORDER BY
                rate_info.date ASC
                
                `))[0]

                let cur = 0
                //console.log(list1);
                for (let i = 0; i < list1.length; i++) {
                    // console.log(list1[i].date);
                    for (let j = cur; j < repInfo.everyday_inter.length; j++) {
                        //cur=j+1
                        if (list1.length === 1) {
                            if (dayjs(repInfo.everyday_inter[j].date).isSameOrAfter(dayjs(list1[0].date))) {
                                repInfo.everyday_inter[j].rate = parseFloat((parseFloat(loan_info.rate) + parseFloat(list1[0].rate)).toFixed(5))
                                cur = j + 1
                            }

                        } else {
                            if (i === list1.length - 1) {
                                if (dayjs(repInfo.everyday_inter[j].date).isSameOrAfter(dayjs(list1[0].date))) {
                                    //console.log(repInfo.everyday_inter[j].rate);
                                    repInfo.everyday_inter[j].rate = parseFloat((parseFloat(loan_info.rate) + parseFloat(list1[i].rate)).toFixed(5))
                                    cur = j + 1

                                }
                            } else {
                                if (dayjs(repInfo.everyday_inter[j].date).isBetween(dayjs(list1[i].date), dayjs(list1[i + 1].date), '[)')) {
                                    repInfo.everyday_inter[j].rate = parseFloat((parseFloat(loan_info.rate) + parseFloat(list1[i].rate)).toFixed(5))
                                    cur = j + 1
                                }
                            }
                        }
                        if (j !== 0) {

                            repInfo.everyday_inter[j].princaipal = repInfo.everyday_inter[j - 1].princaipal - repInfo.everyday_inter[j - 1].repay_plan + repInfo.everyday_inter[j].mt_num

                        } else {
                            repInfo.everyday_inter[j].princaipal = repInfo.everyday_inter[j].mt_num
                        }
                        repInfo.everyday_inter[j].inter_plan = parseFloat(((repInfo.everyday_inter[j].princaipal * parseFloat(repInfo.everyday_inter[j].rate)) / (dayjs(repInfo.everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))

                    }
                }
            } else {
                for (let j = 0; j < repInfo.everyday_inter.length; j++) {
                    repInfo.everyday_inter[j].rate = loan_info.rate
                    if (j !== 0) {

                        repInfo.everyday_inter[j].princaipal = repInfo.everyday_inter[j - 1].princaipal - repInfo.everyday_inter[j - 1].repay_plan + repInfo.everyday_inter[j].mt_num

                    } else {

                        repInfo.everyday_inter[j].princaipal = repInfo.everyday_inter[j].mt_num
                    }
                    repInfo.everyday_inter[j].inter_plan = parseFloat(((repInfo.everyday_inter[j].princaipal * parseFloat(repInfo.everyday_inter[j].rate)) / (dayjs(repInfo.everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
                }
            }

            let start = dayjs(repInfo.rep_date)
            const endDate = start.add(repInfo.rep_limit, 'month').subtract(1, 'day')
            let dateList = []

            let curDate = dayjs(loan_info.inter_first_date)
            switch (loan_info.inter_plan) {
                case '每月':
                    //
                    while (curDate.isBefore(endDate)) {
                        dateList.push(curDate.format("YYYY-MM-DD"));
                        curDate = curDate.add(1, "month");
                        //console.log(endDate.format('YYYY-MM-DD'));
                    }
                    // console.log(dateList);
                    break;

                case '每季度':
                    while (curDate.isBefore(endDate)) {
                        dateList.push(curDate.format("YYYY-MM-DD"));
                        curDate = curDate.add(1, "quarter");
                    }
                    // console.log(dateList);
                    break;
                case '每半年':
                    while (curDate.isBefore(endDate)) {
                        dateList.push(curDate.format("YYYY-MM-DD"));
                        curDate = curDate.add(6, "month");
                    }
                    // console.log(dateList);
                    break;
                case '每年':
                    while (curDate.isBefore(endDate)) {
                        dateList.push(curDate.format("YYYY-MM-DD"));
                        curDate = curDate.add(1, "year");
                    }
                    // console.log(dateList);
                    break;

                default:

                    break;
            }
            let ja = 0
            let total = 0
            for (let a = 0; a < repInfo.everyday_inter.length; a++) {
                total = parseFloat((total + repInfo.everyday_inter[a].inter_plan).toFixed(2))
                for (let i = ja; i < dateList.length; i++) {
                    if (dayjs(repInfo.everyday_inter[a].date).isSame(dayjs(dateList[i]))) {
                        repInfo.everyday_inter[a].is_inter_set = 1
                        ja = i + 1
                        repInfo.everyday_inter[a].inter_actual = total
                        total = 0
                        break;
                    }
                }
            }
            //repInfo.everyday_inter
            everyday_inter = JSON.stringify(repInfo.everyday_inter)
            await sql.execute(`UPDATE rep_info SET everyday_inter = ? WHERE proj_id = ?`, [repInfo.everyday_inter, proj_id])
            await sql.execute(`UPDATE proj_basice SET proj_node = 'end' WHERE proj_id = '${proj_id}'`)
            await sql.commit()
        } catch (error) {
            console.log(error);
            await sql.rollback()
            throw new Error(error)
        }
    })
}
module.exports = {
    computrRepay,
    updateRate,
    updatePlan,
    updatePlanInter,
    updateInfo,
    repayTotal,
    createInterInfo,
    //projLoan,
    projEver,
    repayPlan,
    updateMtInter,
    computedInter
}
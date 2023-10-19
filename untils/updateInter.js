const { linkSql, linkSeverSql } = require('../untils/sql');
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
            //everyday_inter[j].princaipal = everyday_inter[j - 1].princaipal + everyday_inter[j - 1].mt_num - everyday_inter[j - 1].repay_plan
            everyday_inter[j].princaipal = everyday_inter[j - 1].princaipal- everyday_inter[j - 1].repay_plan+everyday_inter[j].mt_num

        }else{
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
                }
            } else {
                if (i === list1.length - 1) {
                    if (dayjs(everyday_inter[j].date).isSameOrAfter(dayjs(list1[0].date))) {
                        everyday_inter[j].rate = parseFloat((parseFloat(everyday_inter[j].rate) + parseFloat(list1[i].rate)).toFixed(5))
                        //console.log(parseFloat((parseFloat(everyday_inter[j].rate) + parseFloat(list1[i].rate)).toFixed(4)));
                    }
                } else {
                    //console.log('2');
                    //console.log(everyday_inter[j].date,list1[i].date,list1[i+1].date);
                    //console.log(dayjs(everyday_inter[j].date).isBetween(dayjs(list1[i].date),dayjs(list1[i+1].date),'[)'));
                    if (dayjs(everyday_inter[j].date).isBetween(dayjs(list1[i].date), dayjs(list1[i + 1].date), '[)')) {
                        everyday_inter[j].rate = parseFloat((parseFloat(everyday_inter[j].rate) + parseFloat(list1[i].rate)).toFixed(5))
                        // console.log(everyday_inter[j].rate);
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
    console.log(rate,is_float_rate);
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
        let ab=0
        //console.log(list1);
        for (let i = 0; i < list1.length; i++) {
            // console.log(list1[i].date);
            for (let j = cur; j < everyday_inter.length; j++) {
                //everyday_inter[j].rate = rate
                
                if (list1.length === 1) {
                    if (dayjs(everyday_inter[j].date).isSameOrAfter(dayjs(list1[0].date))) {
                        everyday_inter[j].rate = parseFloat((parseFloat(rate) + parseFloat(list1[0].rate)).toFixed(5))
                        everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
                        cur=j+1
                       ab++
                    }
                } else {
                   
                    if (i === list1.length - 1) {
                        if (dayjs(everyday_inter[j].date).isSameOrAfter(dayjs(list1[i].date))) {
                            everyday_inter[j].rate = parseFloat((parseFloat(rate) + parseFloat(list1[i].rate)).toFixed(5))
                            everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
                            ab++
                            cur=j+1
                            
                        }
                        
                    } else {
                        if (dayjs(everyday_inter[j].date).isBetween(dayjs(list1[i].date), dayjs(list1[i + 1].date), '[)')) {
                            everyday_inter[j].rate = parseFloat((parseFloat(rate) + parseFloat(list1[i].rate)).toFixed(5))
                            everyday_inter[j].inter_plan = parseFloat(((everyday_inter[j].princaipal * parseFloat(everyday_inter[j].rate)) / (dayjs(everyday_inter[j].date).isLeapYear() ? 366 : 365)).toFixed(2))
                            cur=j+1
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
async function repayTotal(everyday_inter){
    if (!Array.isArray(everyday_inter)) {
        throw new Error('请传入一个数组')
    }
    let repay_total = 0
    for(let i = 0;i<everyday_inter.length;i++){
        if(dayjs(everyday_inter[i].date).isBefore(dayjs())){
            repay_total = parseInt(repay_total) + parseInt(everyday_inter[i].repay_plan)
        }else{
            break
        }
    }
    return repay_total
}
module.exports = {
    computrRepay,
    updateRate,
    updatePlan,
    updatePlanInter,
    updateInfo,
    repayTotal
}
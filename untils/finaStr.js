
const finaStr = {
  updateRep: `UPDATE rep_info SET bank_name = ?, rep_sum = ?, rep_date = ?, rep_limit = ?, rep_sou = ?, rep_remark = ?,loan_total=COALESCE(
    (
    SELECT SUM(loan_sum) FROM loan_info WHERE loan_info.rep_id = rep_info.rep_id
    
    ),0)  , rep_remaining = rep_sum - COALESCE(
    (
    SELECT SUM(loan_sum) FROM loan_info WHERE loan_info.rep_id = rep_info.rep_id
    
    ),0),bank_consortium = ?,sub_project = ? ,sub_project_list = ? WHERE rep_id = ?`,
  updateProj: `UPDATE proj_basice SET proj_name = ?, fina_name = ?, proj_status = ?, corp_name = ?, proj_remark = ?, hidden_debt = ? WHERE proj_id = ?`,
  repInfo: `SELECT
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
  rep_info.proj_id = ?`,
  loanList: `SELECT
    loan_info.loan_id,
    loan_info.loan_con_id,
    loan_info.loan_sum,
    loan_info.loan_date,
    loan_info.loan_remark,
    loan_info.rep_id,
    loan_info.inter_plan
    FROM
    loan_info
    INNER JOIN proj_basice ON proj_basice.proj_id = ?
    INNER JOIN rep_info ON rep_info.proj_id = proj_basice.proj_id AND loan_info.rep_id = rep_info.rep_id
    `,
  spList: `SELECT
    sp_info.sp_id,
    sp_info.sp_date,
    sp_info.corp_name,
    sp_info.sp_num,
    sp_info.refund,
    sp_info.actul_num,
    sp_info.sp_use,
    sp_info.remark,
    sp_info.con_id,
    sp_info.mt_id,
    tbl_agmt_info.agmt_id
    FROM
    sp_info
    LEFT JOIN tbl_agmt_info ON sp_info.con_id = tbl_agmt_info.agmt_index_id
    WHERE
    sp_info.mt_id = ?`,
  projList: `SELECT
    proj_basice.proj_id,
    proj_basice.proj_name,
    proj_basice.fina_name,
    proj_basice.proj_status,
    proj_basice.corp_name,
    proj_basice.update_time,
    proj_basice.creat_time,
    proj_basice.hidden_debt,
    rep_info.rep_date,
    COALESCE((SELECT  COALESCE(SUM(rep_sum), 0) FROM rep_info AS t1 WHERE t1.proj_id =proj_basice.proj_id)) AS rep_total,
    COALESCE(SUM(mt_info.mt_sum),0) AS mt_total
    FROM
    proj_basice
    LEFT JOIN rep_info ON rep_info.proj_id = proj_basice.proj_id
    LEFT JOIN loan_info ON loan_info.rep_id = rep_info.rep_id
    LEFT JOIN mt_info ON mt_info.loan_id = loan_info.loan_id
    GROUP BY
    proj_basice.proj_id,
    proj_basice.proj_name,
    proj_basice.fina_name,
    proj_basice.proj_status,
    proj_basice.corp_name,
    proj_basice.corp_name,
    proj_basice.update_time,
    proj_basice.creat_time,
    proj_basice.hidden_debt,
    rep_info.rep_date
    ORDER BY
    proj_basice.creat_time ASC
    LIMIT ?,?`
  ,
  projInfo: `SELECT
    proj_basice.proj_id,
    proj_basice.proj_name,
    proj_basice.fina_name,
    proj_basice.proj_status,
    proj_basice.corp_name,
    proj_basice.update_time,
    proj_basice.creat_time,
    proj_basice.hidden_debt,
    proj_basice.proj_remark
    FROM
    proj_basice
    WHERE
    proj_basice.proj_id = ?`,
  loanInfo: `SELECT
  loan_info.loan_id,
  loan_info.loan_sum,
  loan_info.loan_date,
  loan_info.loan_remark,
  loan_info.rep_id,
  loan_info.inter_plan,
  loan_info.is_repay,
  loan_info.is_inter,
  loan_info.is_float_rate,
  loan_info.rate,
  loan_info.is_actual,
  loan_info.sub_project_list,
  loan_info.everyday_inter,
  Count(interest_plan.interest_id) AS inter_total,
  Count(repay_plan.repay_id) AS repay_total,
  rep_info.rep_limit,
  rep_info.sub_project,
  rep_info.sub_project_list AS rep_project_list,
  COALESCE(SUM(mt_info.mt_sum) ,0)AS mt_total
  FROM
  loan_info
  LEFT JOIN interest_plan ON interest_plan.loan_id = loan_info.loan_id
  LEFT JOIN repay_plan ON repay_plan.loan_id = loan_info.loan_id
  LEFT JOIN rep_info ON loan_info.rep_id = rep_info.rep_id
  LEFT JOIN mt_info ON mt_info.loan_id = loan_info.loan_id
  WHERE
  loan_info.loan_id = ?
  GROUP BY
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
  loan_info.is_actual
    
    `,
  getInter: `SELECT
    interest_plan.interest_id,
    interest_plan.plan_date,
    interest_plan.interest_num,
    interest_plan.interest_rate,
    interest_plan.remark,
    interest_plan.loan_id
    FROM
    interest_plan
    WHERE
    interest_plan.loan_id = ?
    ORDER BY
    interest_plan.plan_date ASC
    LIMIT ?, ?
    `,
  getRepay: `SELECT
    repay_plan.repay_id,
    repay_plan.plan_date,
    repay_plan.repay_num,
    repay_plan.repay_rate,
    repay_plan.remark,
    repay_plan.loan_id
    FROM
    repay_plan
    WHERE
    repay_plan.loan_id = ?
    ORDER BY
    repay_plan.plan_date ASC
    LIMIT ?, ?
    `,
    everyday:`SELECT
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
    loan_id = ?`

}




module.exports = finaStr
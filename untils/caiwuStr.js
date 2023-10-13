const caiwuStr = {
    creditList: `
    SELECT
tbl_credit_rec.crd_rec_id,
tbl_credit_rec.corp_id,
tbl_credit_rec.proj_id,
tbl_credit_rec.bank_id,
tbl_credit_rec.rec_loan,
tbl_credit_rec.bgn_date,
tbl_credit_rec.end_date,
tbl_bank_info.bank_name,
tbl_corp_info.corp_name,
tbl_proj_info.proj_name,
tbl_proj_info.proj_intro
FROM
tbl_credit_rec
LEFT JOIN tbl_bank_info ON tbl_credit_rec.bank_id = tbl_bank_info.bank_id
LEFT JOIN tbl_corp_info ON tbl_credit_rec.corp_id = tbl_corp_info.corp_id
LEFT JOIN tbl_proj_info ON tbl_credit_rec.proj_id = tbl_proj_info.proj_id
ORDER BY
tbl_credit_rec.crd_rec_id DESC
LIMIT ?, ?`,
    addCredit: `INSERT INTO tbl_credit_rec( corp_id, proj_id, bank_id, rec_loan, bgn_date, end_date) VALUES (?,?,?,?,?,?)`,
    updateCredit: `UPDATE tbl_credit_rec SET corp_id = ?, proj_id = ?, bank_id = ?, rec_loan = ?, bgn_date = ?, end_date = ? WHERE crd_rec_id = ?`,
    delCredit: `DELETE FROM tbl_credit_rec WHERE crd_rec_id in (?)`,
    rpyList: `
    SELECT
tbl_rpy_rec.rpy_rec_id,
tbl_rpy_rec.corp_id,
tbl_rpy_rec.bank_id,
tbl_rpy_rec.proj_id,
tbl_rpy_rec.prin_rec,
tbl_rpy_rec.accr_rec,
tbl_rpy_rec.rpy_date,
tbl_bank_info.bank_name,
tbl_corp_info.corp_name,
tbl_proj_info.proj_name,
tbl_proj_info.proj_intro
FROM
tbl_rpy_rec
LEFT JOIN tbl_bank_info ON tbl_rpy_rec.bank_id = tbl_bank_info.bank_id
LEFT JOIN tbl_corp_info ON tbl_rpy_rec.corp_id = tbl_corp_info.corp_id
LEFT JOIN tbl_proj_info ON tbl_rpy_rec.proj_id = tbl_proj_info.proj_id
ORDER BY
tbl_rpy_rec.rpy_rec_id DESC
LIMIT ?, ?`,
    addRpy: `INSERT INTO tbl_rpy_rec(corp_id, bank_id, proj_id, prin_rec, accr_rec, rpy_date) VALUES (?,?,?,?,?,?)`,
    updateRpy: `UPDATE tbl_rpy_rec SET corp_id = ?, bank_id = ?, proj_id = ?, prin_rec = ?, accr_rec = ?, rpy_date = ? WHERE rpy_rec_id = ?`,
    delRpy: `DELETE FROM tbl_rpy_rec WHERE rpy_rec_id in (?)`,
    getProj: `SELECT
    tbl_proj_info.proj_id,
    tbl_proj_info.proj_name,
    tbl_proj_info.proj_intro,
    tbl_proj_info.cred_lim,
    tbl_proj_info.bgn_date,
    tbl_proj_info.end_date,
    tbl_proj_info.map_rpy,
    tbl_proj_info.map_accr,
    tbl_proj_info.bank_id,
    tbl_guar_typ.guar_name,
    tbl_fina_typ.fina_name,
    tbl_bank_info.bank_name,
    tbl_proj_info.fina_id,
    tbl_proj_info.guar_id
    FROM
    tbl_proj_info
    LEFT JOIN tbl_fina_typ ON tbl_proj_info.fina_id = tbl_fina_typ.fina_id
    LEFT JOIN tbl_guar_typ ON tbl_proj_info.guar_id = tbl_guar_typ.guar_id
    LEFT JOIN tbl_bank_info ON tbl_proj_info.bank_id = tbl_bank_info.bank_id
    LIMIT ?, ?`,
    addProj: `INSERT INTO tbl_proj_info(proj_name,proj_intro,cred_lim,bgn_date,end_date,map_rpy,map_accr,fina_id,guar_id) VALUES (?,?,?,?,?,?,?,?,?)`,
    updateProj: `UPDATE tbl_proj_info SET proj_name = ?, proj_intro = ?, cred_lim=?, bgn_date=?, end_date=?, map_rpy=?, map_accr=?, fina_id=?,guar_id=? WHERE proj_id = ?`,
    ptList: `SELECT
    tbl_con_rec.con_id,
    tbl_con_rec.cls_id,
    tbl_con_rec.con_rec_id,
    tbl_con_rec.con_rec_amu,
    tbl_con_rec.con_rec_name,
    tbl_con_rec.con_rec_date,
    tbl_con_rec.con_rec_sou,
    tbl_con_rec.con_rec_note,
    tbl_con_rec.agmt_id,
    IFNULL((
        SELECT SUM(new_tbl_con_rec.con_rec_amu) 
        FROM tbl_con_rec AS new_tbl_con_rec 
        WHERE new_tbl_con_rec.cls_id='CLS_002' 
        AND new_tbl_con_rec.con_rec_sou = tbl_con_rec.con_rec_id), 0) AS rec_total
        FROM
    tbl_con_rec 
    WHERE
    tbl_con_rec.cls_id = 'CLS_001'
    LIMIT ?, ?`,
    mtList: `SELECT
    tbl_con_rec.con_id,
    tbl_con_rec.cls_id,
    tbl_con_rec.con_rec_id,
    tbl_con_rec.con_rec_amu,
    tbl_con_rec.con_rec_name,
    tbl_con_rec.con_rec_date,
    tbl_con_rec.con_rec_sou,
    tbl_con_rec.con_rec_note,
    tbl_con_rec.agmt_id,
    IFNULL((
        SELECT SUM(new_tbl_con_rec.con_rec_amu) 
        FROM tbl_con_rec AS new_tbl_con_rec 
        WHERE new_tbl_con_rec.cls_id='CLS_003' 
        AND new_tbl_con_rec.con_rec_sou = tbl_con_rec.con_rec_id), 0) AS rec_total
        FROM
    tbl_con_rec 
    WHERE
    tbl_con_rec.con_rec_sou = ?
    `,
    spList: `SELECT
    tbl_con_rec.con_id,
    tbl_con_rec.cls_id,
    tbl_con_rec.con_rec_id,
    tbl_con_rec.con_rec_amu,
    tbl_con_rec.con_rec_name,
    tbl_con_rec.con_rec_date,
    tbl_con_rec.con_rec_sou,
    tbl_con_rec.con_rec_note,
    tbl_con_rec.agmt_id
    FROM
    tbl_con_rec
    WHERE
    con_rec_sou = ?`,
    agmtList: `SELECT
    tbl_agmt_info.agmt_index_id,
    tbl_agmt_info.agmt_id,
    tbl_agmt_info.agmt_name,
    tbl_agmt_info.agmt_value,
    tbl_agmt_info.beg_date,
    tbl_agmt_info.end_date,
    tbl_agmt_info.agmt_note,
    tbl_agmt_info.agmt_part
    FROM
    tbl_agmt_info
    LIMIT
    ?,?`,
    addAgmt: `INSERT INTO tbl_agmt_info(agmt_id, agmt_name, agmt_value, beg_date, end_date, agmt_note, agmt_part) VALUES(?, ?, ?, ?, ?, ?, ?)`,
    updateAgmt: `UPDATE tbl_agmt_info SET agmt_name = ?, agmt_value = ?, beg_date = ?, end_date = ?, agmt_note = ?, agmt_part = ? WHERE agmt_index_id = ?`

}

module.exports = caiwuStr
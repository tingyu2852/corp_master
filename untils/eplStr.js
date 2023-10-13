const eplStr = {
    eplList: `SELECT
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
      LEFT JOIN pro_info ON epl_info.pro_id = pro_info.pro_id`,
      acl:`SELECT
      acl_info.acl_id,
      acl_info.proj_id,
      acl_info.epl_id
      FROM
      acl_info
      `
}

module.exports = eplStr
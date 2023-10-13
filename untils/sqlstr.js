var mysql2=require('mysql2')
const sqlstr = {
    eqdetail: `SELECT
equipment_detail.eq_detailId,
equipment_detail.equipment_infoId,
equipment_detail.equipment_sn,
equipment_detail.room_id,
equipment_detail.department_id,
equipment_detail.eq_status,
equipment_detail.baofei_date,
equipment_info.equipment_cateid,
equipment_info.equipment_name,
equipment_info.equipment_price,
equipment_info.supplier_id,
equipment_info.vendor_id,
equipment_info.jinhuo_data,
equipment_cate.equipment_catename,
room.room_name,
room.building_id,
vendor.vendor_name,
supplier.supplier_name,
department.department_name,
department.school_id,
FROM
equipment_detail
LEFT JOIN equipment_info ON equipment_detail.equipment_infoId = equipment_info.equipment_id
LEFT JOIN equipment_cate ON equipment_info.equipment_cateid = equipment_cate.equipment_cateid
LEFT JOIN room ON equipment_detail.room_id = room.room_id
LEFT JOIN vendor ON equipment_info.vendor_id = vendor.vendor_id
LEFT JOIN supplier ON equipment_info.supplier_id = supplier.supplier_id
LEFT JOIN department ON equipment_detail.department_id = department.department_id
ORDER BY
?? ?
LIMIT ?, ?`,
    deparment: `SELECT
department.department_id,
department.department_name,
department.school_id
FROM
department`,
    addEqdetaild: `INSERT INTO equipment_detail(equipment_infoId, equipment_sn, room_id, department_id,eq_status,baofei_date) VALUES (?,?,?,?,?,?)`,
    updateEqdetail: `UPDATE equipment_detail SET equipment_infoId = ?, equipment_sn = ?, room_id = ?, department_id = ? ,eq_status = ? ,baofei_date=? WHERE eq_detailId = ?`,
    deleteEqdetail: `DELETE FROM equipment_detail WHERE eq_detailId in (?)`,
    addUnit: `INSERT INTO school (school_name, unit_address, unit_phone, contact_name, contact_phone, unit_url) VALUES (?, ?, ?, ?, ?, ?)`,
    deleteUnit: `DELETE FROM school WHERE school_id in (?)`,
    updadeUnit: `UPDATE school SET school_name = ?, unit_address = ?, unit_phone = ?, contact_name = ?, contact_phone = ?, unit_url = ?, unit_remark = ? WHERE school_id = ?`,
    build: `SELECT
building.building_id,
building.building_name,
building.school_id,
building.building_floor,
(
SELECT COUNT(*)
FROM room
WHERE
room.building_id = building.building_id
) as building_roomnum,
school.school_name
FROM
building
LEFT JOIN school ON building.school_id = school.school_id
`,
    addBuild: `INSERT INTO building (building_name, school_id, building_floor) VALUES (?,?,?)`,
    updateBuild: `UPDATE building SET building_name = ?, school_id = ?, building_floor = ? WHERE building_id = ?`,
    deleteBuild: `DELETE FROM building WHERE building_id in (?)`,
    room: `SELECT 
room.room_id,
room.building_id,
room.room_name,
room.room_cate,
room.remark,
room.room_img,
building.building_name,
building.school_id,
school.school_name
FROM
room
LEFT JOIN building ON room.building_id = building.building_id
LEFT JOIN school ON building.school_id = school.school_id
ORDER BY
room.room_id ASC
LIMIT ?, ?`,
    roomTotal: `SELECT
Count(room.room_id) AS total
FROM
room`,
    addRoom: `INSERT INTO room(building_id, room_name, room_cate,room_img, remark) VALUES (?,?,?,?,?)`,
    updateRoom: `UPDATE room SET building_id = ?, room_name = ?, room_cate = ?,room_img = ?, remark = ? WHERE room_id = ?`,
    deleteRoom: `DELETE FROM room WHERE room_id in (?)`,
    eqInfo: `SELECT
    equipment_info.equipment_id,
    equipment_info.equipment_cateid,
    equipment_info.equipment_name,
    equipment_info.equipment_price,
    equipment_info.supplier_id,
    equipment_info.vendor_id,
    equipment_info.jinhuo_data,
    equipment_info.school_id,
    equipment_info.img_url,
    equipment_info.remark,
    equipment_info.jinhuo_num,
    vendor.vendor_name,
    supplier.supplier_name,
    school.school_name,
    equipment_cate.equipment_catename,
    (SELECT COUNT(equipment_detail.equipment_infoId)
    FROM
    equipment_detail
    WHERE
    equipment_detail.equipment_infoId = equipment_info.equipment_id) AS numa,
    (SELECT SUM(wx_eqnum)
    FROM
    wx_log
    WHERE
    wx_log.wx_eqid = equipment_info.equipment_id) AS numb
    FROM
    equipment_info
    LEFT JOIN vendor ON equipment_info.vendor_id = vendor.vendor_id
    LEFT JOIN supplier ON equipment_info.supplier_id = supplier.supplier_id
    LEFT JOIN school ON equipment_info.school_id = school.school_id
    LEFT JOIN equipment_cate ON equipment_info.equipment_cateid = equipment_cate.equipment_cateid
    LIMIT ?,?`,
    changjia: `SELECT
vendor.vendor_id,
vendor.vendor_name
FROM
vendor
`,
    gonghuoshang: `SELECT
supplier.supplier_id,
supplier.supplier_name
FROM
supplier`,
    updateInfo: `UPDATE equipment_info SET equipment_cateid = ?, equipment_name = ?, equipment_price = ?, supplier_id = ?, vendor_id = ?, 
jinhuo_data = ?, school_id = ?, img_url = ?, remark = ?, jinhuo_num = ? WHERE equipment_id = ?`,
    addInfo: `INSERT INTO equipment_info(equipment_cateid, equipment_name, equipment_price, supplier_id, vendor_id, jinhuo_data, school_id, img_url, remark, jinhuo_num) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    baoxiu: `
SELECT
baoxiu_copy1.id,
baoxiu_copy1.bx_name,
baoxiu_copy1.shebei_id,
baoxiu_copy1.time,
baoxiu_copy1.bx_ren,
baoxiu_copy1.bx_phone,
baoxiu_copy1.bx_unitid,
baoxiu_copy1.bx_status,
equipment_detail.equipment_infoId,
equipment_detail.equipment_sn,
equipment_detail.room_id,
equipment_info.equipment_name,
equipment_info.school_id,
room.room_name,
school.school_name,
equipment_info.equipment_cateid,
equipment_cate.equipment_catename
FROM
baoxiu_copy1
LEFT JOIN equipment_detail ON baoxiu_copy1.shebei_id = equipment_detail.eq_detailId
LEFT JOIN equipment_info ON equipment_detail.equipment_infoId = equipment_info.equipment_id
LEFT JOIN room ON equipment_detail.room_id = room.room_id
LEFT JOIN school ON equipment_info.school_id = school.school_id
LEFT JOIN equipment_cate ON equipment_info.equipment_cateid = equipment_cate.equipment_cateid
LIMIT ?, ?`,
    bx_chuli: `UPDATE baoxiu_copy1 SET bx_status = 1 WHERE id = ?`,
    room_eq: `SELECT
room.room_id,
equipment_detail.eq_detailId,
equipment_detail.equipment_infoId,
equipment_detail.equipment_sn,
equipment_detail.department_id,
equipment_info.equipment_name
FROM
room
LEFT JOIN equipment_detail ON room.room_id = equipment_detail.room_id
LEFT JOIN equipment_info ON equipment_detail.equipment_infoId = equipment_info.equipment_id
WHERE
room.room_id = ?`,
    addBx: `INSERT INTO baoxiu_copy1(bx_name, shebei_id, time, bx_ren, bx_phone, bx_unitid, bx_status, room_id) VALUES (?,?,?,?,?,?,?,?)`,
    addWx: `INSERT INTO wx_log(eq_guzhang, shebei_id, bx_time, bx_ren, bx_phone, bx_unitid, room_id, wx_time, wx_ren, wx_method, wx_eqid, wx_eqnum, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    deleteBx: `DELETE FROM baoxiu_copy1 WHERE id in (?)`,
    wx_list: `
SELECT
wx_log.id,
wx_log.eq_guzhang,
wx_log.shebei_id,
wx_log.bx_time,
wx_log.bx_ren,
wx_log.bx_phone,
wx_log.bx_unitid,
wx_log.room_id,
wx_log.wx_time,
wx_log.wx_ren,
wx_log.wx_method,
wx_log.wx_eqid,
wx_log.wx_eqnum,
wx_log.remark,
equipment_detail.equipment_sn,
equipment_info.equipment_cateid,
equipment_info.equipment_name,
equipment_cate.equipment_catename,
room.room_name,
room.building_id,
school.school_name,
wx_eq.equipment_name AS wx_eqname,
wx_eqcate.equipment_cateid AS wx_cateid
FROM
wx_log
LEFT JOIN equipment_detail ON wx_log.shebei_id = equipment_detail.eq_detailId
LEFT JOIN equipment_info ON equipment_detail.equipment_infoId = equipment_info.equipment_id
LEFT JOIN equipment_cate ON equipment_info.equipment_cateid = equipment_cate.equipment_cateid
LEFT JOIN room ON wx_log.room_id = room.room_id
LEFT JOIN school ON wx_log.bx_unitid = school.school_id
LEFT JOIN equipment_info AS wx_eq ON wx_log.wx_eqid = wx_eq.equipment_id
LEFT JOIN equipment_cate AS wx_eqcate ON wx_eq.equipment_cateid = wx_eqcate.equipment_cateid
LIMIT ?, ?`,
    updateWx: `UPDATE wx_log SET eq_guzhang = ?, shebei_id = ?, bx_time = ?, bx_ren = ?, bx_phone = ?, bx_unitid = ?, room_id = ?, wx_time = ?, wx_ren = ?, wx_method = ?, wx_eqid = ?, wx_eqnum = ?, remark = ? WHERE id = ?`,
    deleteWx: `DELETE FROM wx_log WHERE id in (?)`,
    sx_wx: `
SELECT
wx_log.id,
wx_log.eq_guzhang,
wx_log.shebei_id,
wx_log.bx_time,
wx_log.bx_ren,
wx_log.bx_phone,
wx_log.bx_unitid,
wx_log.room_id,
wx_log.wx_time,
wx_log.wx_ren,
wx_log.wx_method,
wx_log.wx_eqid,
wx_log.wx_eqnum,
wx_log.remark,
equipment_detail.equipment_sn,
equipment_info.equipment_cateid,
equipment_info.equipment_name,
equipment_cate.equipment_catename,
room.room_name,
room.building_id,
school.school_name,
wx_eq.equipment_name AS wx_eqname,
wx_eqcate.equipment_cateid AS wx_cateid
FROM
wx_log
LEFT JOIN equipment_detail ON wx_log.shebei_id = equipment_detail.eq_detailId
LEFT JOIN equipment_info ON equipment_detail.equipment_infoId = equipment_info.equipment_id
LEFT JOIN equipment_cate ON equipment_info.equipment_cateid = equipment_cate.equipment_cateid
LEFT JOIN room ON wx_log.room_id = room.room_id
LEFT JOIN school ON wx_log.bx_unitid = school.school_id
LEFT JOIN equipment_info AS wx_eq ON wx_log.wx_eqid = wx_eq.equipment_id
LEFT JOIN equipment_cate AS wx_eqcate ON wx_eq.equipment_cateid = wx_eqcate.equipment_cateid`,
total1_sx:`SELECT
Count(wx_log.id) AS total
FROM
wx_log
LEFT JOIN room ON wx_log.room_id = room.room_id
WHERE
room.room_name LIKE ?`,
total2_sx:`SELECT
Count(wx_log.id) AS total
FROM
wx_log
WHERE
wx_log.wx_time BETWEEN ? AND ?`,
total3_sx:`SELECT
Count(wx_log.id) AS total
FROM
wx_log
LEFT JOIN room ON wx_log.room_id = room.room_id
WHERE
wx_log.wx_time BETWEEN ? AND ?
AND
room.room_name LIKE ?`,
supplier:`SELECT
supplier.supplier_id,
supplier.supplier_name
FROM
supplier`,
addsupplier:`INSERT INTO supplier(supplier_name) VALUES (?)`,
updateSupplier:`UPDATE supplier SET supplier_name = ? WHERE supplier_id = ?`,
deleteSupplier:`DELETE FROM supplier WHERE supplier_id in (?)`,
vendor:`SELECT
vendor.vendor_id,
vendor.vendor_name
FROM
vendor
`,
addVendor:`INSERT INTO vendor(vendor_name) VALUES (?)`,
updateVendor:`UPDATE vendor SET vendor_name = ? WHERE vendor_id = ?`,
deleteVendor:`DELETE FROM vendor WHERE vendor_id in (?)`,
sx_eqdetail:`
SELECT
equipment_detail.eq_detailId,
equipment_detail.equipment_infoId,
equipment_detail.equipment_sn,
equipment_detail.room_id,
equipment_detail.department_id,
equipment_detail.eq_status,
equipment_detail.baofei_date,
equipment_info.equipment_cateid,
equipment_info.equipment_name,
equipment_info.equipment_price,
equipment_info.supplier_id,
equipment_info.vendor_id,
equipment_info.jinhuo_data,
equipment_cate.equipment_catename,
room.room_name,
room.building_id,
vendor.vendor_name,
supplier.supplier_name,
department.department_name,
department.school_id
FROM
equipment_detail
LEFT JOIN equipment_info ON equipment_detail.equipment_infoId = equipment_info.equipment_id
LEFT JOIN equipment_cate ON equipment_info.equipment_cateid = equipment_cate.equipment_cateid
LEFT JOIN room ON equipment_detail.room_id = room.room_id
LEFT JOIN vendor ON equipment_info.vendor_id = vendor.vendor_id
LEFT JOIN supplier ON equipment_info.supplier_id = supplier.supplier_id
LEFT JOIN department ON equipment_detail.department_id = department.department_id
`,
sx_eqdetails:`SELECT
Count(equipment_detail.eq_detailId) AS total
FROM
equipment_detail
INNER JOIN equipment_info ON equipment_detail.equipment_infoId = equipment_info.equipment_id
INNER JOIN room ON equipment_detail.room_id = room.room_id`,
selecteq:`
SELECT
equipment_info.equipment_id,
equipment_info.equipment_cateid,
equipment_info.equipment_name,
equipment_info.equipment_price,
equipment_info.supplier_id,
equipment_info.vendor_id,
equipment_info.jinhuo_num,
equipment_info.remark,
(SELECT COUNT(equipment_detail.equipment_infoId)
    FROM
    equipment_detail
    WHERE
    equipment_detail.equipment_infoId = equipment_info.equipment_id) AS numa,
(SELECT COALESCE(SUM(wx_eqnum),0)
    FROM
    wx_log
    WHERE
    wx_log.wx_eqid = equipment_info.equipment_id) AS numb
FROM
equipment_info
WHERE
equipment_info.equipment_cateid = ?`

}


module.exports = sqlstr
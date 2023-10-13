const sqlstr = {
    week: `WITH RECURSIVE days AS (
        SELECT DATE('2023-06-01') AS date
        UNION ALL
        SELECT date + INTERVAL 1 DAY
        FROM days
        WHERE date < DATE('2023-06-30')
      )
      SELECT DATE_FORMAT(days.date,'%m-%d') AS date , COUNT(weixiu.date)+COUNT(wx_log.wx_time) AS total_count
      FROM days
      LEFT JOIN weixiu ON DATE(weixiu.date) = days.date
      LEFT JOIN wx_log ON DATE(wx_log.wx_time) = days.date
      GROUP BY days.date
      ORDER BY days.date`
}


module.exports = sqlstr
var express = require('express');
const { linkSql, linkSeverSql } = require('../untils/sql');
var router = express.Router();
var sqlObj = require('../untils/sql')
var sqlstr = require('../untils/sqlstr')

router.get('/', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSeverSql(`SELECT
    happy_08.h_date,
    happy_08.h_01,
    happy_08.h_02,
    happy_08.h_03,
    happy_08.h_04,
    happy_08.h_05,
    happy_08.h_06,
    happy_08.h_07,
    happy_08.h_08,
    happy_08.h_09,
    happy_08.h_10,
    happy_08.h_11,
    happy_08.h_12,
    happy_08.h_13,
    happy_08.h_14,
    happy_08.h_15,
    happy_08.h_16,
    happy_08.h_17,
    happy_08.h_18,
    happy_08.h_19,
    happy_08.h_20
    FROM
    lotto.happy_08
    ORDER BY
    happy_08.h_date DESC
    LIMIT ?, ?
    `, [(current - 1) * size, size - 0])
    let total = await linkSeverSql(`SELECT
    Count(happy_08.h_date) AS total
    FROM
    lotto.happy_08
    `)
    res.send({ code: 20000, data: { k8list: data, total: total[0].total } })
})
router.get('/k8', async (req, res) => {
    let { current, size } = req.query
    let data = await linkSeverSql(`SELECT
    happy_08.h_date,
    happy_08.h_01,
    happy_08.h_02,
    happy_08.h_03,
    happy_08.h_04,
    happy_08.h_05,
    happy_08.h_06,
    happy_08.h_07,
    happy_08.h_08,
    happy_08.h_09,
    happy_08.h_10,
    happy_08.h_11,
    happy_08.h_12,
    happy_08.h_13,
    happy_08.h_14,
    happy_08.h_15,
    happy_08.h_16,
    happy_08.h_17,
    happy_08.h_18,
    happy_08.h_19,
    happy_08.h_20
    FROM
    lotto.happy_08
    ORDER BY
    happy_08.h_date DESC
    `)
    
    res.send({ code: 20000, data: { k8list: data} })
})

module.exports = router;
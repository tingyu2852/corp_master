var express = require('express');
var router = express.Router();
const jwt = require('../untils/jwt.js')
const { linkSql, linkMySql } = require('../untils/sql');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('master.user');
});

router.post('/login', async (req, res, next) => {


    try {
       // console.log(req.body);
        const { username, password } = req.body
        let status = await linkMySql(async sql => {
            try {
                await sql.beginTransaction()
                let userInfo = (await sql.execute(`SELECT
        user_info.user_id,
        user_info.user_name,
        user_info.user_password,
        user_info.user_token_time
        FROM
        user_info
        WHERE
        user_info.user_name = '${username}'
        `))[0][0]
                // return data

                if (userInfo) {
                    if (password !== userInfo.user_password) {
                        //await sql.rollback()
                        return { code: 20001, message: '密码错误' }
                    } else {
                        const timeStamp = (Date.now()).toString()
                        const token = jwt.sign(username, timeStamp)
                        await sql.execute(`UPDATE user_info SET user_token_time = ${timeStamp}`)
                        await sql.commit()
                        return { code: 20000, token }



                    }
                } else {

                    return { code: 20001, message: '用户名不存在' }

                }
            } catch (error) {
                await sql.rollback()
                throw new Error(error)
            }


        })
        return res.send(status)
    } catch (error) {
        return res.send({ code: 20001, message: '系统出现错误，请联系管理员' })
    }
    //console.log(userInfo);


})

router.get('/info', (req, res, next) => {
    //console.log(req.body)
    res.send({
        code: 20000,
        data: {
            roles: [
                "admin"
            ],
            introduction: "I am a super administrator",
            avatar: "https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif",
            name: "Super Admin",
            routes:['Projs', 'Info','Detail', 'Jichu', 'Bank', 'Corp','Rate','Fina','Guar','Agmt']
        }
    })
})
router.post('/test', (req, res, next) => {
    console.log(req.body)
    res.send({ code: 200, str: '123' })
})

module.exports = router;

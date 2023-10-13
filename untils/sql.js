
//var mysql2 = require('mysql2')

const createConnectionPool = require('../untils/sqlCon');
// console.log(createConnectionPool);
// return
let sql2 = createConnectionPool();
// const config = {
//     host: '127.0.0.1',
//     user: 'root',
//     password: 'root',
//     database: 'li',
function con() {
    sql2 = null
    sql2 = createConnectionPool();
}

//     dateStrings: true,
//     connectionLimit: 10 //创建一个连接池
// }

//let  promisePool = mysql2.createPool(config).promise()
async function getpool() {

    try {
        const pool = await sql2.getConnection()
        return pool
    } catch (error) {
        console.log(123);
        await  con()
        const pool1 = await sql2.getConnection()

        return pool1
    }
}

const sqlObj = {
    async linkSql(sql, arr = [], xh = false, xunhuan) {

        //console.log(promisePool.ended);
        let promisePool = null
        promisePool = await getpool()
        console.log(promisePool.connection._closing, '------');
        if (promisePool.connection._closing) {
        
            promisePool = null
            promisePool = await getpool()
        }
        try {

            //console.log(promisePool);
            if (!xh) {

                let data = await promisePool.query(sql, arr)
                
                promisePool.release(err => {
                    console.log(err);
                })
                //await sql2.end()
                return data[0]
            } else {


                let res = await xunhuan(promisePool)

                await promisePool.release(err => {
                    console.log(err);
                })
                // await sql2.end()
                return res
            }


        } catch (error) {
            console.log(error)

            await promisePool.release(function (err) {
                console.log(err)
            })


            //promisePool = mysql2.createPool(config).promise()
            console.log(error)
            throw new Error(error)
        }
    },
    async linkMySql(xunhuan) {

       
        let promisePool = null
        promisePool = await getpool()

        if (promisePool.connection._closing) {
            promisePool = null
            promisePool = await getpool()
        }
        try {
            let res = await xunhuan(promisePool)

            await promisePool.release(err => {
                console.log(err);
            })
            return res
        } catch (error) {
            console.log('release');
            console.log('------------------');
            await promisePool.release(function (err) {
                console.log(err)
            })
            //promisePool = mysql2.createPool(config).promise()
            console.log(error)
            throw new Error(error)
        }
    },
    async linkSeverSql(sql, arr = []) {
       
        const promisePool = mysql2.createPool(config).promise()
        try {
            let data = await promisePool.query(sql, arr)
            await promisePool.end(function (err) {
                return console.log(err)
            })
            //console.log(data[0])
            return data[0]

        } catch (error) {
            return console.log(error)
            throw new Error(error)
        }
    }
}

module.exports = sqlObj
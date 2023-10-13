const jwt = require('jsonwebtoken')


const scert = 'SRT20230914'

function sign(username,timeStamp){
    const token = jwt.sign({username,timeStamp},scert)
    return token

}


function verify(token){
    const isJwt = jwt.verify(token,scert,(err,doce)=>{
        if(err){
            return false
        }else{
            return doce
        }
    })
    return isJwt
}


module.exports={
    sign,
    verify
}
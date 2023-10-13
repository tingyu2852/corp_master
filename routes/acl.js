var express = require('express');
const { linkSql, linkMySql } = require('../untils/sql');
const finaStr = require('../untils/finaStr')
var router = express.Router();

router.get('/role', async (req, res) => {
    let data = await linkSql(`SELECT
    rule_menu.rule_id,
    rule_menu.rule_name,
    rule_menu.rule_value,
    rule_menu.rule_parent_id,
    rule_menu.rule_cate
    FROM
    rule_menu`)
    let a1 = []
    let a2 = []
    let a3 = []
    let a4 = []
    for (let i = 0; i < data.length; i++) {
        let cate = data[i].rule_cate
        switch (cate) {
            case 1:
               a1[0]=data[i]
                break;
            case 2:
                a2.push(data[i])
                break;
            case 3:
                a3.push(data[i])
                break;
            case 4:
                a4.push(data[i])
                break;
            default:
                break;
        }
    }
    
    a3.map((item,index)=>{
        item.children=[]
        for(let i=0;i<a4.length;i++){
            if(item.rule_id===a4[i].rule_parent_id){
                item.children.push(a4[i])
            }
        }
        
    })
   a2.map((item,index)=>{
        item.children=[]
        for(let i=0;i<a3.length;i++){
            if(item.rule_id===a3[i].rule_parent_id){
                item.children.push(a3[i])
            }
        }
    })
    a1[0].children = [...a2]

    const list1 =  roleInfoList(a1,[1,2,3,4,5,6,7,8,9,10,11,12,13])
   
    res.send({ code: 20000, data: { roleList: a1 ,list1} })
})

function roleInfoList(list,idList){
   liet = list.map((item,index)=>{
        item.isRole = false
        idList.forEach(aitem=>{
            if(item.rule_id === aitem){
                item.isRole = true
                return item
            }
        })
        if(item.children){
            roleInfoList(item.children,idList)
        }else{
            return
        }
        return item
    })
    return list
}

router.get('/map',async(req,res)=>{
    let list= [{num:1},{num:2},{num:3},{num:4}]
     list.map(item=> {
        item.children =false
        item.num*=2
        
    })
   
    let list2 = [1,2,3,4]
    list2=list2.map(item=>{
        item*=2
        return item
    }); console.log(list2);
    res.send({code:20000})
})


module.exports = router;
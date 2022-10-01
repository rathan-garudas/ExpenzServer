var groupRoute = require('express').Router();
var { logger } = require('../utils');
var { verifyJWT } = require('../utils/jwt');
var { groupData, listGroups, calculateDebts, addExpense , addGroup, deleteGroup, deleteExpense, settleDebts, addMembers } = require('../db/groups/utils');
var {addActivity} =  require('../db/activity');


groupRoute.use((req,res,next) => {
    //console.log("came here");
    try{
        verifyJWT(req,res);
        next();
    } catch(err){
        res.status(403).json({error: err});
    }
});

groupRoute.get("/data", async (req, res) => {   
    var id = req.body.user.user["_id"];
    //console.log(id);
    try{
        var result = await listGroups(id);
        return res.status(200).json({data: result});
    }
    catch(err){
        return res.status(500).json({error: err});
    }

});

groupRoute.get("/:groupId", async (req, res) => {
    var { groupId } = req.params;
    var id = req.body.user.user["_id"];
    try{
        var result = await groupData(groupId);
        //console.log("group data");
        var debts = await calculateDebts(groupId, id);
        // console.log("result", result.connections);
        debts["debts"] = result.connections[id];
        return res.status(200).json({ data: result, debts});
    } catch(err){
        return res.status(500).json({error: err});
    }
});

groupRoute.put("/new", async(req, res) => {
    var { body } = req;
    var id = req.body.user.user["_id"];
    var name = req.body.user.user["displayName"];
    var { name } = body;
    //console.log(id);
    try{
        var result = await addGroup(body, id);
        var val = "You created the "+name+" group";
        await addActivity(id, val);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({error: err});
    }
})



groupRoute.put("/expense/:groupId/", async (req, res) => {
    var { groupId } = req.params;
    var id = req.body.user.user["_id"];
    var expense = req.body;
    var { amount} = expense;
    try{
        var result = await addExpense(groupId, expense);
        var val = "You added an expense of $" + amount;
        await addActivity(id, val);
        var debts = await calculateDebts(groupId, id);
        return res.status(200).json({ data: result, debts});
    } catch(err){
        return res.status(500).json({error: err});
    }
});

groupRoute.put("/:groupId", async function(req, res){
    var { groupId } = req.params;
    var { groupName } = req.body;
    var id = req.body.user.user["_id"];
    try{
        await deleteGroup(groupId);
        var val = "You archived "+ groupName+" group";
        await addActivity(id, val);
        return res.status(200).json({success: true});
    } catch(err){
        return res.status(500).json({error: err});
    }
});

groupRoute.put("/:groupId/expense/:expenseId", async function(req, res){
    console.log("++++++++++++++++++++++++++++++++++++++");
    var { groupId, expenseId } = req.params;
    var { expenseName, groupName } = req.body;
    var id = req.body.user.user["_id"];
    try{
        await deleteExpense(groupId, expenseId);
        console.log("body",req);
        var val = "You archived "+ expenseName +" expense in "+ groupName +" group";
        await addActivity(id, val);
        return res.status(200).json({success: true});
    } catch(err){
        //console.log(err);
        return res.status(500).json({error: err});
    }
});

groupRoute.post("/:groupId/expense/:expenseId", async function(req, res){
    var { groupId, expenseId } = req.params;
    try{
        await deleteExpense(groupId, expenseId);
        return res.status(200).json({success: true});
    } catch(err){
        return res.status(500).json({error: err});
    }
});

groupRoute.post("/:groupId/settle", async (req, res) => {
    var { groupId } = req.params;
    var { lender, borrower,username, money, everything} = req.body;
    try{
        var results = await settleDebts(groupId, lender, borrower, money, everything);
        var val = "You paid "+ username +" $" + amount;
        await addActivity(id, val);
        return res.status(200).json(results);
    } catch(err){
        return res.status(500).json({error: err});
    }
});

groupRoute.put("/:groupId/members", async (req, res) => {
    try {
        var { groupId } = req.params;
        var { members } = req.body;
        var results =await addMembers(groupId, members);
        return res.status(200).json(results);
    } catch (err) {
        console.log(err)
        return res.status(500).json({error: err});
    }
    
})



module.exports = groupRoute;


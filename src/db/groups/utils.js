const groupModel = require('../schema/groups');
const mongoose = require('../MongoConnection');
const {addGroupUser, userGroups} = require('../user');
const { addActivity } = require('../activity');

async function groupData(group){
    try{
        var results = await groupModel.findById(group);
        // console.log(results);
        var { expenses } = results;
        var dummy1 = [];
        var dummy2 = [];
        for(var i=0; i<expenses.length; i++){
            var { is_deleted } = expenses[i];
            if(is_deleted){
                dummy2.push(expenses[i]);
            }else{
                dummy1.push(expenses[i]);
            }
        }
        results["expenses"] = [...dummy1, ...dummy2];

        return results;
    } catch(err){
        throw err;
    }
}

async function calculateDebts(groupID,userID){
    try{
        const group = await groupData(groupID);
        //console.log(group);
        var {expenses} = group;

        var monthExp = {};
        var weekExp = {};

        for(var i=0; i<expenses.length; i++){
            var expense = expenses[i];
            var ori_amount = expense.amount;
            var { division, is_deleted, is_payment } = expense;
            var time = expense["timestamp"];
            for(var exp in division){
                var { lender, borrower, amount} = division[exp];
                //console.log("lend borrow",lender, borrower, userID);
                if(!is_deleted && !is_payment){
                    if(time >= Date.now() - 604800000){
                        if(!(borrower in weekExp)){
                            weekExp[borrower] = 0;
                        }
                        weekExp[borrower] += amount;
                    }
                    if(time >= Date.now() - 2419200000){
                        if(!(borrower in monthExp)){
                            monthExp[borrower] = 0;
                        }
                        monthExp[borrower] += amount;
                    }
                }
            }    
        }

        
        var out = {weekExp, monthExp}
        //console.log("out", out);
        return out;
    } catch(e) {
        //console.log(e);
        throw e;
    }
}

async function settleDebts(group, lend, borrow, money, everything = false) {
    try{
        const group_vals = await groupData(group);
        //console.log(group_vals);
        var {expenses} = group_vals;
        expenses.sort((a, b) => a.timestamp - b.timestamp);
        if(!everything){    
            for(var expense in expenses){
                var {division} = expense;
                for(var exp in division){
                    var { lender, borrower, is_settled, amount, is_deleted} = exp;
                    if(!is_deleted && !is_settled && lend === lender && borrower === borrow){
                        if(amount <= money){
                            exp.amount = 0;
                            exp.is_settled = true;
                            money -= amount;
                        } else{
                            exp.amount -= money;
                            money = 0;
                        }
                        if(money === 0){
                            break;
                        }
                    }
                }
                if(money === 0){
                    break;
                }
            }
        } else{
            for(var expense in expenses){
                for(var exp in expense){
                    var { lender, borrower, is_settled, amount, is_deleted} = exp;
                    if(!is_deleted && !is_settled && lend === lender && borrower === borrow){
                        exp.amount = 0;
                        exp.is_settled = true;
                    }
                }
            }
        }
        var results = await groupModel.findByIdAndUpdate(group, {expenses});
        return results;

    } catch(err) {
        throw err;
    }
}


async function addExpense(group, expense){
    try{
        // const group_vals = await groupData(group);
        //console.log(group_vals);
        var groupData = await groupModel.findById(group);
        console.log(groupData);
        var { connections } = groupData;

        expense["_id"] = new mongoose.Types.ObjectId();
        
        expense["is_deleted"] = false;
        var { division } = expense;
        for(var i=0; i< division.length; i++){
            division[i]["is_settled"] = false;
        }
        //console.log(division);
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var dt = date.getDate();
        expense["timestamp"] = Date.now();
        expense["date"] = dt.toString()+"-"+month.toString()+"-"+year.toString();
        // var { expenses } = group_vals;
        delete expense["user"];
        // var new_expenses = [expense, ...expenses ];

        for(var i=0; i<division.length; i++){
            var { lender, borrower, amount } = division[i];
            if(lender !== borrower){
                connections[lender][borrower] = parseInt(connections[lender][borrower],10) + parseInt(amount,10);
                connections[borrower][lender] = parseInt(connections[borrower][lender],10) - parseInt(amount,10);
            }
        }
        await groupModel.findByIdAndUpdate(group, {"connections": connections});
        await groupModel.findByIdAndUpdate(group, {"$push": { "expenses": expense}});

        
        var results = await groupModel.findById(group);
        //console.log("final",results);
        return results;
    } catch(err) {
        console.log(err);
        throw err;
    }
}

async function addGroup(data, id){
    var {name, members} = data;
    var connections = {};
    var newMembers = [id, ...members];
    // console.log(newMembers);
    for(var i = 0; i < newMembers.length; i++){
        for(var j = 0; j < newMembers.length; j++){
            if(i !== j){
                if(!(newMembers[i] in connections)){
                    connections[newMembers[i]] = {};
                }
                connections[newMembers[i]][newMembers[j]] = 0;
            }
        }
    };

    try{
        var result = await groupModel.create({name, admin: id, members, expenses: [],is_archived: false, connections});
        // console.log("connections", result.connections);
        await addGroupUser(result["_id"], [id, ...members]);
        result = await listGroups(id);
        // console.log(result);
        return result;
    } catch(err){
        //console.log(err);
        throw err;
    }
}

async function listGroups(user){
    var result = {};
    try{
        var groups = await userGroups(user);
        for(var i=0; i<groups.length; i++){
            var group = groups[i];
            if(!(group in result)){
                result[group] = {};
            }
            //console.log("group:",group);
            var group_det = await groupModel.findById(group, {  name: 1, admin: 1,is_archived: 1,is_payment: 1, connections: 1});
            //console.log(group_det);
            var debts = await calculateDebts(group, user);
            //console.log(debts);
            var {name, admin, is_archived, is_payment, connections} = group_det;
            debts["debts"] = connections[String(user)];
            result[group] = {"_id": group, name, admin,is_payment, debts,is_archived};
        }
        //console.log(result);
        var final = [];
        for(var item in result){
            //console.log(result[item]);
            final.push(result[item]);
        }
        return final;
    } catch(err){
        console.log(err);
        throw err;
    }
}

async function deleteGroup(group){
    try{
        await groupModel.findByIdAndUpdate(group, {is_archived: true});
        return;
    } catch(err){
        throw err;
    }
}

async function deleteExpense(group, expense_id){
    try{
        var { expenses, connections } = await groupData(group);
        for(var i = 0; i < expenses.length; i++){
            var expense  = expenses[i];
            if(expense["_id"] == expense_id){
                expense["is_deleted"] = true;
                var { division } = expense;
                for(var j = 0; j < division.length; j++){
                    var { lender, borrower, amount} = division[j];
                    if(lender !== borrower){
                        connections[lender][borrower] = parseInt(connections[lender][borrower],10) - parseInt(amount,10);
                        connections[borrower][lender] = parseInt(connections[borrower][lender],10) + parseInt(amount,10);
                    }
                }
            }
        }
        console.log(connections);
        await groupModel.findByIdAndUpdate(group, { expenses, connections });
        return;
    } catch(err){
        throw err;
    }
}

async function updateExpense(group, expense){
    try{
        const { expenses } = await groupData(group);
        for(var i=0; i< expenses.length; i++){
            if(expenses[i]["_id"] == expense["_id"]){
                expenses[i] = expense;
            }
        }
        await groupModel.getByIdAndUpdate(group, { expenses });
        return;
    } catch(err){
        throw err;
    }
}

async function addMembers(group, data){
    try{
        var { admin, members, connections } = await groupData(group, data);
        console.log(connections);
        var newMembers = [...members, ...data];
        members = [admin, ...members];

        for(var i = 0; i < data.length; i++){
            for(var j in connections){
                connections[j][data[i]] = 0;
            }
        }
        console.log(connections);

        for(var i = 0; i < data.length; i++){
            for(var j=0; j< data.length; j++){
                if(i != j){
                    if(!(data[i] in connections)){
                        connections[data[i]] = {};
                    }
                    connections[data[i]][data[j]] = 0;
                }
                
            }
        }
        console.log(connections);
        for(var i=0; i< data.length; i++){
            for(var j=0; j< members.length; j++){
                if(!(data[i] in connections)){
                    connections[data[i]] = {};
                }
                connections[data[i]][members[j]] = 0;
            }
        }
        console.log(connections);
        await groupModel.findByIdAndUpdate(group, {members: newMembers, connections: connections});
        return [];
    } catch(err){
        throw err;
    }
}


module.exports = { groupData, calculateDebts, settleDebts, addExpense, listGroups, deleteGroup, addGroup, deleteExpense, updateExpense, addMembers };
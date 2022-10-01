const jwt = require('jsonwebtoken');
const userModel = require('../schema/user');
const {logger} = require('../../utils/logger');
const path = require('path');
const filepath = `${path.dirname(__filename)}\ ${path.basename(__filename)}`;
const saltRounds = 10;
var bcrypt = require('bcrypt');
async function loginUser(user){
    const { email, password } = user;
    try{
        var result = await userModel.findOne({email});
        if(result.length === 0){
            throw new Error('User not found');
        }
        await bcrypt.compare(password, result.password);
        result = await userModel.findOne({email},{password: 0});
        var users = await userModel.find({}, {password:0});
        var out = {};
        out.user = result;
        out.users = users;
        return out;
    } catch(err){
        throw err;
    }  
}

async function registerUser(user){
    //console.log(user);
    const { email, password, displayName } = user;
    try{
        var hash =await bcrypt.hash(password, saltRounds);
        var result = await userModel.create({email, password: hash, displayName, groups: []});
        return [];
    } catch(err){
        throw err;
    }
}


async function addGroupUser(group, members){
    try{
        var results =await userModel.updateMany({"_id": { "$in": members }}, {"$push": {"groups": group.toString()}});
        //console.log(results);
        // await userModel.updateMany({ "_id": { "$in": members }}, {"$push": { "members": [group]}});
    } catch(err){
        throw err
    }
}
async function userGroups(user){
    try{
        var val =await userModel.findById(user, {groups: 1});
        // console.log("value", val.groups);
        return val.groups;
    } catch(err){
        //console.log("Error in userGroups");
        throw err;
    }
}

async function removeUserFromGroup(user,group){
    try{
        var val =await userModel.findById(user, {groups: 1});
        val = val.filter((item) => item !== group);
        await userModel.findByIdAndUpdate(user, { groups: val});
    } catch(err){
        throw err;
    }
}

module.exports = { registerUser, loginUser, addGroupUser, userGroups, removeUserFromGroup };
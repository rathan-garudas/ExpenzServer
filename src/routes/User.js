var userRoute = require('express').Router();
var { logger } = require('../utils');
var { registerUser, loginUser } = require('../db/user');
var { createJWT} = require('../utils/jwt');

userRoute.use((req,res,next) => {
    //console.log("came here");
    next();
})
userRoute.post("/login", async function(req, res){
    var data = req.body;
    try{
        var user = await loginUser(data);
        //console.log(user);
        var token =createJWT(user.user);
        //console.log("No error in token");
        return res.status(200).json({token,user});
    } catch(err){
        return res.status(401).send({ error: err});
    }
});

userRoute.put("/register",async function(req, res){
    var data = req.body;
    //console.log("came in here");
    try{
        var user =await registerUser(data);
        //console.log("No error in insert");
        var token =createJWT(user);
        //console.log("No error in token");
        return res.status(200).json({token,user});
    } catch(err){
        return res.status(401).send({ error: err});
    }
});


module.exports = userRoute;
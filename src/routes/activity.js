var activityRoute = require('express').Router();
var { getActivity } = require('../db/activity');
var { verifyJWT } = require('../utils/jwt');


activityRoute.use((req,res,next) => {
    try{
        verifyJWT(req,res);
        next();
    } catch(err){
        //console.log(err);
        res.status(403).json({error: err});
    }
});

activityRoute.get("/", async (req, res) => {
    try {
        var id = req.body.user.user["_id"];
        //console.log("came here");
        var result = await getActivity(id);
        return res.status(200).json({result: result});
    } catch(err){
        return res.status(500).json({error: err});
    }
});

module.exports = activityRoute;
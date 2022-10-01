const activityModel = require('../schema/activity');


var addActivity = async (user, activity) => {
    try {
        var date = new Date();
        var dt = date.getDate();
        var year = date.getFullYear();
        var month = date.getMonth();
        var act = {activity, timestamp: String(month)+"-"+String(dt)+"-"+String(year)};
        var result = await activityModel.find({user});
        //console.log(result);
        if(result.length === 0){
            await activityModel.create({user, activities: [act]});
        } else{
            await activityModel.findOneAndUpdate({user}, { "$push": {activities: act}});
        }
    } catch (err) {
        //console.log(err);
        throw err;
    }

}

var getActivity = async (user) => {
    try {
        console.log(user);
        var result = await activityModel.findOne({user});
        //console.log("result",result);
        return result;
    } catch (err) {
        throw err;
    }
};

module.exports = { addActivity, getActivity};
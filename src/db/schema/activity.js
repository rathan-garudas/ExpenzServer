const mongoose = require('../MongoConnection');

const activitySchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true},
    activities: { type: Array, required: true}
});

const activityModel = mongoose.model('activity', activitySchema);


module.exports = activityModel;
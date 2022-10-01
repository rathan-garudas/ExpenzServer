const mongoose = require('../MongoConnection');

const userSchema = new mongoose.Schema({
    displayName: { type: String, required: true, unique: true},
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true},
    groups: {type: Array},   
})

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
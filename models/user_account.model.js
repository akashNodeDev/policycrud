const mongoose = require('mongoose');

const UserAccountSchema = mongoose.Schema({
   account_name:{type:String,default:""},
   account_type:{type:String,default:"Personal",enum:["Personal","Commercial"]}
}, {timestamps: true, versionKey: false})

module.exports = mongoose.model('User_Account', UserAccountSchema);

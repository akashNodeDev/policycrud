const mongoose = require('mongoose');

const LobSchema = mongoose.Schema({
   category_name:{type:String,default:""}
}, {timestamps: true, versionKey: false})

module.exports = mongoose.model('Lob', LobSchema);

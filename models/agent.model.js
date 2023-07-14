const mongoose = require('mongoose');

const AgentSchema = mongoose.Schema({
   agent:{type:String,default:""},
   
   producer:{type:String,default:""},
   csr:{type:String,default:""}
}, {timestamps: true, versionKey: false})

module.exports = mongoose.model('Agent', AgentSchema);

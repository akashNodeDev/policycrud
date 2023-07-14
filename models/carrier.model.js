const mongoose = require('mongoose');

const CarrierSchema = mongoose.Schema({
   company_name:{type:String,default:""}
}, {timestamps: true, versionKey: false})

module.exports = mongoose.model('Carrier', CarrierSchema);

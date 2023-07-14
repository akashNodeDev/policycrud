const mongoose = require('mongoose');

const PolicySchema = mongoose.Schema({
   policy_no:{type:String,default:""},
   policy_mode:{type:Number,default:0},
   premium_amount_written:{type:Number,default:0.0},
   premium_amount:{type:Number,default:0.0},
   policy_type:{type:String,default:"Single",enum:["Single","Package"]},
   company_id:{type:mongoose.Schema.Types.ObjectId,ref:"Carrier",enum:null},
   category_id:{type:mongoose.Schema.Types.ObjectId,ref:"Lob",default:null},
   user_account_id:{type:mongoose.Schema.Types.ObjectId,ref:"User_Account",default:null},
   user_id:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
   policy_start_date:{type:Date,default:null},
   policy_end_date:{type:Date,default:null},
   agent_id:{type:mongoose.Schema.Types.ObjectId,default:null,ref:"agents"}
}, {timestamps: true, versionKey: false})

module.exports = mongoose.model('Policy', PolicySchema);

const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    firstname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, default: "", enum: ['Male','Female','Other',""] },
    city: { type: String, default: "" },
    address:{type:String,default:""},
    state:{type:String,default:""},
    zip:{type:String,default:""},
    dob:{type:Date,default:null},
    user_account_id:{type:mongoose.Schema.Types.ObjectId,ref:"User_Account",default:null},
    userType:{type:String,default:""},
    primary:{type:String,default:""},
    application_id:{type:String,default:""},
    agency_id:{type:String,default:""},
    hasActive:{type:String,default:""},
    clientPolicy:{type:mongoose.Schema.Types.ObjectId,ref:"policies",default:null}
}, {
    timestamps: true, versionKey: false
})


module.exports = mongoose.model('User', UserSchema);

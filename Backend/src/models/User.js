const mongoose=require("mongoose");

const UserSchema=new mongoose.Schema({
    name:{type:String,required:true,trim:true},
    email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},
    password:{type:String,required:true},
    verifyotp:{type:String,default:" "},
    isVerified:{type:Boolean,default:false},
    otpexpiresat:{type:Number,default:0},
    resetotp:{type:String,default:" "},
    profileImage: {
        type: String,   
        default: ""
      },
    resetotpexpiresat:{type:Number,default:0},
    role:{
        type:String,
        enum: ["USER", "DRIVER", "ADMIN", "FLEET_OPERATOR"],
        default:"USER"
    },
    fleetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Fleet",
        default: null,
        index: true
    },
    activationToken: {
        type: String,
        default: null
    },
    activationTokenExpires: {
        type: Date,
        default: null
    },
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now},
    isActive:{type:Boolean,default:true},
    isDeleted:{type:Boolean,default:false},
    isBlocked:{type:Boolean,default:false},
    rating:{type:Number,default:5.0},
    ridesCount:{type:Number,default:0}
  
})

const usermodel=mongoose.model("User",UserSchema);
module.exports=usermodel;
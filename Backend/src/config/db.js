const mongoose=require("mongoose");

const connectDB=async()=>{
    mongoose.connection.on('connected',()=>{
        console.log("MongoDB connected");
    })
    mongoose.connection.on('error',(err)=>{
        console.log("MongoDB connection error",err);
    })
    const mongoUri = process.env.MONGODB_URL;
    if (!mongoUri) {
      throw new Error("MONGODB_URL environment variable is required");
    }
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
}

module.exports=connectDB;

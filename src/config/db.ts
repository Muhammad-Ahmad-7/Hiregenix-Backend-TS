import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);
        const collections = await mongoose.connection.db?.listCollections().toArray();
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log("Collections in hiregenix DB:");
        console.log(collections?.map(c => c.name));
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

export default connectDB;

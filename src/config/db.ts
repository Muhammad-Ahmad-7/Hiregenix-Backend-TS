import mongoose from "mongoose";
import { config } from "./config.js";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodb.uri);
        const collections = await mongoose.connection.db?.listCollections().toArray();
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log("Collections in hiregenix DB:");
        console.log(collections?.map((c: any) => c.name));
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

export default connectDB;

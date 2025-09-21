import { v2 as cloudinary } from "cloudinary"
import { config } from "./config.js"

if (
    !config.cloudinary.cloudName ||
    !config.cloudinary.apiKey ||
    !config.cloudinary.apiSecret
) {
    throw new Error("Cloudinary configuration values are missing");
}

cloudinary.config({
    cloud_name: config.cloudinary.cloudName as string,
    api_key: config.cloudinary.apiKey as string,
    api_secret: config.cloudinary.apiSecret as string,
});

export default cloudinary;
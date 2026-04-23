// src/config/config.ts
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface Config {
  port: string | number;
  mongodb: {
    uri: string;
  };
  jwt: {
    accessTokenSecret: string;
    accessTokenExpiresIn: string;
    refreshTokenSecret: string;
    refreshTokenExpiresIn: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  email: {
    host: string | undefined;
    port: number;
    user: string | undefined;
    pass: string | undefined;
  };
  frontend: {
    url: string | undefined;
    dockerUrl: string | undefined;
    prodDevUrl: string | undefined;
  };
  cloudinary: {
    cloudName: string | undefined;
    apiKey: string | undefined;
    apiSecret: string | undefined;
  };
  qdrant: {
    url: string;
    apiKey: string;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  aiModel: {
    geminiApiKey: string;
  };
  pythonAi: {
    url: string;
  };
}

export const config: Config = {
  port: process.env.PORT || 8000,
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/mydatabase",
  },
  jwt: {
    accessTokenSecret:
      process.env.ACCESS_TOKEN_SECRET || "default-access-secret-key",
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    refreshTokenSecret:
      process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret-key",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
  },
  bcrypt: {
    saltRounds: parseInt(process.env.SALT_ROUNDS || "10", 10),
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  frontend: {
    url: process.env.FRONTEND_URL,
    dockerUrl: process.env.FRONTEND_DOCKER_URL,
    prodDevUrl: process.env.FRONTEND_PROD_DEV_URL,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  qdrant: {
    url: process.env.QDRANT_URL || "https://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY || "",
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "",
  },
  aiModel: {
    geminiApiKey: process.env.API_KEY!,
  },
  pythonAi: {
    url: process.env.PYTHON_AI_URL || "http://localhost:8000",
  },
};

import { google } from "googleapis"
import { config } from "../config/config.js";

const GOOGLE_CLIENT_ID = config.google.clientId;
const GOOGLE_CLIENT_SECRET = config.google.clientSecret;
const GOOGLE_REDIRECT_URI = config.google.redirectUri;

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'postmessage'
);

export default oauth2Client;
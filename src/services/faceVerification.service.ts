import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import axios from 'axios';
import dotenv from 'dotenv';
import { config } from '../config/config.js';

dotenv.config();

// 1. Initialize the Client with credentials
const rekognitionClient = new RekognitionClient({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

/**
 * Fetch image bytes from a URL
 */
async function getImageBytes(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data); // 'binary' is default for Buffers from arraybuffers
}

async function compareFaces(sourceUrl: string, targetImage: Buffer) {
    try {
        const sourceBytes = await getImageBytes(sourceUrl);

        // 2. Prepare the Command
        const params = {
            SourceImage: { Bytes: sourceBytes },
            TargetImage: { Bytes: targetImage },
            SimilarityThreshold: 80,
        };

        const command = new CompareFacesCommand(params);

        // 3. Send the command using the client
        // (v3 returns a promise by default)
        const result = await rekognitionClient.send(command);

        return result;
    } catch (err) {
        console.error('Error comparing faces:', err);
        throw err;
    }
}

export default compareFaces;
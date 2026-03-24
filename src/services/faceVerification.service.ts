import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
import { config } from '../config/config.js';

dotenv.config();


// Configure AWS credentials
AWS.config.update({
    region: config.aws.region, // change if needed
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
});

const rekognition = new AWS.Rekognition();

/**
 * Fetch image bytes from a URL
 */
async function getImageBytes(url: string) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
}


async function compareFaces(sourceUrl: string, targetImage: Buffer) {
    try {
        const sourceBytes = await getImageBytes(sourceUrl);
        const targetBytes = targetImage; // already in buffer form

        const params = {
            SourceImage: { Bytes: sourceBytes },
            TargetImage: { Bytes: targetBytes },
            SimilarityThreshold: 80, // adjust threshold based on testing
        };

        const result = await rekognition.compareFaces(params).promise();

        // console.log("RESULT => ", result);

        return result;
    } catch (err) {
        console.error('Error comparing faces:', err);
        throw err;
    }
}

export default compareFaces;

// // Example usage
// (async () => {
//     const referenceImage = 'https://res.cloudinary.com/hiregenx/image/upload/v1773823830/generation-9ddfc3fd-d72a-41cb-bf67-2da0fa64f9b8_duvzi7.png'; // replace
//     const liveImage = 'https://res.cloudinary.com/hiregenx/image/upload/v1773821104/WIN_20260316_15_01_14_Pro_dxijhl.jpg';    // replace

//     const similarity = await compareFaces(referenceImage, liveImage);
//     console.log('Final similarity score:', similarity);
// })();
const {
    S3Client
} = require("@aws-sdk/client-s3");

let s3Client = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1", // Fallback region jika tidak diset
        endpoint: process.env.AWS_ENDPOINT || undefined, // Gunakan jika menggunakan MinIO
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        forcePathStyle: !!process.env.AWS_ENDPOINT, // Wajib untuk MinIO
    });
} else {
    console.warn("AWS/MinIO configuration skipped: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY is not set");
}

module.exports = s3Client;
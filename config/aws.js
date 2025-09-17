const {
    S3Client
} = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT || undefined, // Gunakan jika menggunakan MinIO
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: !!process.env.AWS_ENDPOINT, // Wajib untuk MinIO
});

module.exports = s3Client;
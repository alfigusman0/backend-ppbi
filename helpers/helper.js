/* Config */
const database = require('../config/database');
const redis = require('../config/redis');
/* Libraries */
const fs = require('fs');
const chmodr = require('chmodr');
const mv = require('mv');
const moment = require('moment-timezone');
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3Client = require("../config/aws");
const path = require("path");
const winston = require('winston');
const axios = require('axios');
const DailyRotateFile = require('winston-daily-rotate-file');
const {
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");

/* Logger */
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    winston.format.json()
  ),
  handleExceptions: true,
  handleRejections: true,
  transports: [
    new winston.transports.Console({}),
    new DailyRotateFile({
      filename: "./logs/log-%DATE%.log",
      zippedArchive: true,
      maxSize: "100m",
      maxFiles: "14d"
    }),
  ]
});

const helper = {};

helper.runSQL = async function (value) {
  return new Promise(function (resolve, reject) {
    try {
      database.query(value.sql, value.param, function (error, rows, _fields) {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

helper.getPagination = (value, limit, currentpage) => {
  let limitdata = limit || process.env.LIMIT_DATA;
  let totalpage = Math.ceil(value[0].total / limitdata);
  let pagination = [];
  if (value[0].total > limitdata) {
    for (let i = 1; i <= totalpage; i++) {
      pagination.push(i);
    }
  }
  return {
    totaldata: value[0].total,
    totalpagination: totalpage,
    currentpage: parseInt(currentpage) || 0,
  };
};

helper.checkFolder = async (path) => {
  try {
    /* create a folder recursively, if the folder is not already available */
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, {
        recursive: true
      });
      chmodr(path, 0o777, (err) => {
        if (err) throw new Error(err);
        console.log('Success change permission.');
      });
    } else {
      console.log("folder is already available");
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

helper.uploadFile = async (oldpath, newpath) => {
  try {
    mv(oldpath, newpath, (err) => {
      if (err) throw new Error(err);
      console.log("file transfer successful.");
    });
    return true
  } catch (e) {
    console.error(e);
    return false;
  }
}

helper.deleteFile = async (path) => {
  try {
    if (fs.existsSync(path)) {
      fs.unlink(path, (err) => {
        if (err) throw err;
        console.log("successfully deleted file");
      });
    } else {
      console.log("file not found");
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

helper.id = async () => {
  let response = Date.now() + 1;
  return response
};

helper.uuid = () => {
  let sqlQueryUUID = {
    sql: "SELECT UUID() as uuidLong"
  }
  let response = helper.runSQL(sqlQueryUUID)
  return response
};

helper.gmailconfig = (method, url, token) => {
  return {
    method: method,
    url: url,
    headers: {
      Authorization: `Bearer ${token} `,
      "Content-type": "application/json"
    },
  };
}

/* Upload file to S3 */
const upload = (folder = "", allowedFileTypes = null) => {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_BUCKET_NAME,
      acl: "public-read", // Atur akses file agar bisa diakses publik
      key: (req, file, cb) => {
        const folderPath = folder ? `${folder}/` : ""; // Jika folder ada, tambahkan prefix
        const ext = path.extname(file.originalname); // Ambil ekstensi file
        console.log(`File extension: ${ext}`); // Debugging
        const fileName = `${folderPath}${Date.now()+1}${ext}`;
        cb(null, fileName);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (allowedFileTypes && allowedFileTypes.length > 0) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedFileTypes.includes(ext)) {
          return cb(new Error(`File type not allowed: ${ext}`), false);
        }
      }
      cb(null, true);
    },
  });
};
helper.upload = upload;

// Fungsi hapus file dari S3
helper.deleteFile = async (fileUrl) => {
  try {
    // Ambil nama bucket dari ENV
    const bucketName = process.env.AWS_BUCKET_NAME;

    // Ekstrak path file dari URL
    const filePath = fileUrl.split(`/${bucketName}/`)[1];

    if (!filePath) {
      throw new Error("Invalid file URL");
    }

    // Perintah hapus file
    const deleteParams = {
      Bucket: bucketName,
      Key: filePath,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));

    return {
      success: true,
      message: "File deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to delete file",
      error: error.message
    };
  }
};

helper.deleteKeysByPattern = async (patterns) => {
  if (process.env.REDIS_ACTIVE !== 'ON') {
    console.log('Redis is not active, skipping cache deletion.');
    return 0;
  }

  try {
    let deletedCount = 0;

    if (process.env.REDIS_CLUSTER === 'true') {
      // Mode Cluster: Memindai semua node master
      const nodes = redis.nodes('master');
      for (const node of nodes) {
        const stream = node.scanStream({
          match: patterns,
          count: 100000
        });

        console.log(`Scanning keys in node ${node.options.host}:${node.options.port} with pattern: ${patterns}`);

        stream.on('data', async (keys) => {
          if (keys.length > 0) {
            const pipeline = node.pipeline();
            keys.forEach(key => pipeline.del(key));
            await pipeline.exec();
            deletedCount += keys.length;
            console.log(`Deleted ${keys.length} keys from node ${node.options.host}:${node.options.port}`);
          }
        });

        stream.on('error', (err) => {
          console.error(`Error scanning keys on node ${node.options.host}:${node.options.port}:`, err);
        });

        await new Promise(resolve => stream.on('end', resolve));
      }
    } else {
      // Mode Standalone: Memindai instance tunggal
      const stream = redis.scanStream({
        match: patterns,
        count: 100000
      });

      stream.on('data', async (keys) => {
        if (keys.length > 0) {
          const pipeline = redis.pipeline();
          keys.forEach(key => pipeline.del(key));
          await pipeline.exec();
          deletedCount += keys.length;
          console.log(`Deleted ${keys.length} keys from standalone Redis`);
        }
      });

      stream.on('error', (err) => {
        console.error('Error scanning keys in standalone Redis:', err);
      });

      await new Promise(resolve => stream.on('end', resolve));
    }

    console.log(`Total deleted keys: ${deletedCount}`);
    return deletedCount;
  } catch (error) {
    logger.error('Redis error during cache deletion:', error);
    throw error;
  }
};

// convert date to string format YYYY-MM-DD
helper.convertoDate = (date) => {
  if (date) {
    let dateFormat = moment(date).tz('Asia/Jakarta').format("YYYY-MM-DD");
    /* let dateFormat = moment(date).format("YYYY-MM-DD"); */
    return dateFormat;
  } else {
    return null;
  }
};

helper.convertoDateTime = (date) => {
  if (!date) return null;

  // Log input untuk debugging
  console.log('Input date:', date);

  // Cek apakah input sudah menyertakan zona waktu (misalnya, ISO 8601 dengan offset)
  const parsedDate = moment.parseZone(date);
  if (parsedDate.isValid()) {
    // Jika input memiliki zona waktu, konversi ke Asia/Jakarta
    return parsedDate.tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
  }

  // Jika input tanpa zona waktu, asumsikan sebagai WIB
  const localDate = moment.tz(date, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta');
  if (!localDate.isValid()) {
    console.error('Invalid date format:', date);
    return null;
  }

  return localDate.format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Helper Axios Request
 * @param {Object} options
 * @param {string} options.url - Target URL
 * @param {string} [options.method="GET"] - HTTP Method (GET, POST, PUT, DELETE, PATCH)
 * @param {Object} [options.headers={}] - Custom headers
 * @param {Object} [options.params={}] - Query params (untuk GET dsb.)
 * @param {Object|FormData|string} [options.data={}] - Body data (untuk POST/PUT/PATCH)
 * @param {number} [options.timeout=15000] - Timeout request (default 15 detik)
 */
helper.httpRequest = async function (options) {
  try {
    const config = {
      method: options.method || "GET",
      url: options.url,
      headers: options.headers || {},
      params: options.params || {},
      data: options.data || {},
      timeout: options.timeout || 15000,
      validateStatus: function (_status) {
        // Jangan langsung throw error, biar bisa handle status code manual
        return true;
      },
    };

    const response = await axios(config);

    return {
      success: true,
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      } : null,
    };
  }
};

module.exports = helper;
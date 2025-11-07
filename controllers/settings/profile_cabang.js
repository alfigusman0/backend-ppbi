/* Config */
const redis = require('../../config/redis');
/* Libraries */
const winston = require('winston');
const md5 = require('md5');
const DailyRotateFile = require('winston-daily-rotate-file');
/* Helpers */
const helper = require('../../helpers/helper');
const response = require('../../helpers/response');
const isEmpty = require('../../validation/is-empty');
/* Logger */
const logger = winston.createLogger({
  level: 'info',
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
      filename: './logs/log-%DATE%.log',
      zippedArchive: true,
      maxSize: '100m',
      maxFiles: '14d',
    }),
  ],
});

const Controller = {};

const redisPrefix = process.env.REDIS_PREFIX + 'settings:profile-cabang:';

// Helper function to check access rights
const checkAccess = async (req, action) => {
  const sql = {
    sql: 'SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?',
    param: [req.authIdsLevel, 14, `%${action}%`],
  };
  const result = await helper.runSQL(sql);
  return result.length > 0;
};

// Helper function to handle errors
const handleError = (error, res) => {
  logger.error(error);
  return response.sc500('An error occurred in the system, please try again.', {}, res);
};

Controller.create = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'create');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const ketua = req.body.ketua || null;
    const sekertaris = req.body.sekertaris || null;
    const bendahara = req.body.bendahara || null;
    const profile = req.body.profile || null;
    const visi = req.body.visi || null;
    const misi = req.body.misi || null;
    const program = req.body.program || null;
    const nomor_sk = req.body.nomor_sk || null;
    const masa_aktif = req.body.masa_aktif || null;
    const file_sk = req.body.file_sk || null;

    const { ids_cabang } = req.body;

    // Check existing data
    const checkData = await helper.runSQL({
      sql: 'SELECT ids_cabang FROM `tbs_profile_cabang` WHERE ids_cabang = ? LIMIT 1',
      param: [ids_cabang],
    });
    if (checkData.length) {
      return response.sc400('Data already exists.', {}, res);
    }

    const sqlInsert = {
      sql: 'INSERT INTO `tbs_profile_cabang`(`ids_cabang`, `ketua`, `sekertaris`, `bendahara`, `profile`, `visi`, `misi`, `program`, `nomor_sk`, `masa_aktif`, `file_sk`, `created_by`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      param: [
        ids_cabang,
        ketua,
        sekertaris,
        bendahara,
        profile,
        visi,
        misi,
        program,
        nomor_sk,
        masa_aktif,
        file_sk,
        req.authIdUser,
      ],
    };

    const result = await helper.runSQL(sqlInsert);
    const json = {
      ids_profile_cabang: result.insertId,
    };

    // Hapus cache Redis
    try {
      await helper.deleteKeysByPattern(redisPrefix + '*');
    } catch (redisError) {
      logger.error('Failed to delete Redis cache in create:', redisError);
    }

    return response.sc200('Data added successfully.', json, res);
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

Controller.read = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'read');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const {
      ids_profile_cabang,
      ids_cabang,
      cabang,
      ids_provinsi,
      provinsi,
      pulau,
      ids_kabkota,
      kabkota,
      id_profile_ketua,
      ketua,
    } = req.query;
    const order_by = req.query.order_by || 'created_at ASC';
    const key = redisPrefix + 'read:' + md5(req.originalUrl);

    // Check Redis cache
    let cache = null;
    if (process.env.REDIS_ACTIVE === 'ON') {
      try {
        cache = await redis.get(key);
        if (cache) {
          return response.sc200('Data from cache.', JSON.parse(cache), res);
        }
      } catch (redisError) {
        logger.error('Redis get error:', redisError);
      }
    }

    // Pagination
    const resPerPage = parseInt(req.query.limit) || parseInt(process.env.LIMIT_DATA || 10); // Default 10
    const page = (parseInt(req.query.page) || 1) - 1; // Pastikan page tidak negatif
    const currentPage = parseInt(req.query.page) || 1;

    // Build SQL query
    let sqlRead = 'SELECT * FROM `views_profile_cabang`';
    let sqlReadTotalData = 'SELECT COUNT(ids_profile_cabang) as total FROM `views_profile_cabang`';
    const params = [];
    const totalParams = [];

    const addCondition = (field, value, operator = '=') => {
      if (!isEmpty(value)) {
        let condition;
        let paramValue = value;

        if (['IN', 'NOT IN'].includes(operator)) {
          // Handle comma-separated string or array input
          if (typeof value === 'string') {
            paramValue = value.split(',').map(item => item.trim());
          } else if (!Array.isArray(value)) {
            paramValue = [value];
          }
          // Create placeholders for IN/NOT IN clause
          condition = `${field} ${operator} (${paramValue.map(() => '?').join(', ')})`;
          // Spread array values into params
          params.push(...paramValue);
          totalParams.push(...paramValue);
        } else {
          // Existing logic for other operators
          condition = `${field} ${operator} ?`;
          paramValue = operator === 'LIKE' ? `%${value}%` : value;
          params.push(paramValue);
          totalParams.push(paramValue);
        }

        sqlRead += sqlRead.includes('WHERE') ? ` AND ${condition}` : ` WHERE ${condition}`;
        sqlReadTotalData += sqlReadTotalData.includes('WHERE')
          ? ` AND ${condition}`
          : ` WHERE ${condition}`;
      }
    };

    addCondition('ids_profile_cabang', ids_profile_cabang, 'IN');
    addCondition('ids_cabang', ids_cabang, 'IN');
    addCondition('cabang', cabang, 'LIKE');
    addCondition('ids_provinsi', ids_provinsi, 'IN');
    addCondition('provinsi', provinsi, 'LIKE');
    addCondition('pulau', pulau);
    addCondition('ids_kabkota', ids_kabkota, 'IN');
    addCondition('kabkota', kabkota, 'LIKE');
    addCondition('id_profile_ketua', id_profile_ketua, 'IN');
    addCondition('ketua', ketua, 'LIKE');

    sqlRead += ` ORDER BY ${order_by} LIMIT ?, ?`;
    params.push(page * resPerPage, resPerPage);

    // Execute queries
    const [getData, getTotalData] = await Promise.all([
      helper.runSQL({
        sql: sqlRead,
        param: params,
      }),
      helper.runSQL({
        sql: sqlReadTotalData,
        param: totalParams,
      }),
    ]);

    if (!getData.length) {
      return response.sc404('Data not found.', {}, res);
    }

    const pagination = helper.getPagination(getTotalData, resPerPage, currentPage);
    const json = {
      data: getData,
      pagination,
    };

    // Set Redis cache
    if (process.env.REDIS_ACTIVE === 'ON') {
      try {
        await redis.set(
          key,
          JSON.stringify(json),
          'EX',
          60 * 60 * 24 * (process.env.REDIS_DAY || 1)
        ); // Default 1 hari
      } catch (redisError) {
        logger.error('Redis error:', redisError);
      }
    }

    return response.sc200('', json, res);
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

Controller.update = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'update');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const id = req.params.id;
    const {
      ids_cabang,
      ketua,
      sekertaris,
      bendahara,
      profile,
      visi,
      misi,
      program,
      nomor_sk,
      masa_aktif,
      file_sk,
    } = req.body;

    // Check existing data
    const checkData = await helper.runSQL({
      sql: 'SELECT ids_profile_cabang FROM `tbs_profile_cabang` WHERE ids_profile_cabang = ? LIMIT 1',
      param: [id],
    });

    if (!checkData.length) {
      return response.sc404('Data not found.', {}, res);
    }

    // Build SQL update query
    const updates = [];
    const params = [];

    const addUpdate = (field, value) => {
      if (!isEmpty(value)) {
        updates.push(`${field} = ?`);
        params.push(value);
      }
    };

    addUpdate('ids_cabang', ids_cabang);
    addUpdate('ketua', ketua);
    addUpdate('sekertaris', sekertaris);
    addUpdate('bendahara', bendahara);
    addUpdate('profile', profile);
    addUpdate('visi', visi);
    addUpdate('misi', misi);
    addUpdate('program', program);
    addUpdate('nomor_sk', nomor_sk);
    addUpdate('masa_aktif', masa_aktif);
    addUpdate('file_sk', file_sk);

    // Check Data Update
    if (isEmpty(params)) {
      return response.sc400('No data has been changed.', {}, res);
    }

    addUpdate('updated_by', req.authIdUser);
    const sqlUpdate = {
      sql: `UPDATE \`tbs_profile_cabang\` SET ${updates.join(
        ', '
      )} WHERE \`ids_profile_cabang\` = ?`,
      param: [...params, id],
    };

    await helper.runSQL(sqlUpdate);
    const json = {
      ids_profile_cabang: id,
    };

    // Hapus cache Redis
    try {
      await helper.deleteKeysByPattern(redisPrefix + '*');
    } catch (redisError) {
      logger.error('Failed to delete Redis cache in update:', redisError);
    }

    return response.sc200('Data changed successfully.', json, res);
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

Controller.delete = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'delete');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const id = req.params.id;

    // Check existing data
    const checkData = await helper.runSQL({
      sql: 'SELECT ids_profile_cabang FROM `tbs_profile_cabang` WHERE ids_profile_cabang = ? LIMIT 1',
      param: [id],
    });

    if (!checkData.length) {
      return response.sc404('Data not found.', {}, res);
    }

    // SQL Delete Data
    const sqlDelete = {
      sql: 'DELETE FROM `tbs_profile_cabang` WHERE ids_profile_cabang = ?',
      param: [id],
    };

    await helper.runSQL(sqlDelete);

    // Hapus cache Redis
    try {
      await helper.deleteKeysByPattern(redisPrefix + '*');
    } catch (redisError) {
      logger.error('Failed to delete Redis cache in delete:', redisError);
    }

    return response.sc200('Data deleted successfully.', {}, res);
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

Controller.single = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'single');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const {
      ids_profile_cabang,
      ids_cabang,
      cabang,
      ids_provinsi,
      provinsi,
      pulau,
      ids_kabkota,
      kabkota,
      id_profile_ketua,
      ketua,
    } = req.query;
    const key = redisPrefix + 'single:' + md5(req.originalUrl);

    // Check Redis cache
    let cache = null;
    if (process.env.REDIS_ACTIVE === 'ON') {
      try {
        cache = await redis.get(key);
        if (cache) {
          return response.sc200('Data from cache.', JSON.parse(cache), res);
        }
      } catch (redisError) {
        logger.error('Redis get error:', redisError);
      }
    }

    // Build SQL query
    let sqlSingle = 'SELECT * FROM `tbs_profile_cabang`';
    const params = [];

    const addCondition = (field, value, operator = '=') => {
      if (!isEmpty(value)) {
        let condition;
        let paramValue = value;

        if (['IN', 'NOT IN'].includes(operator)) {
          // Handle comma-separated string or array input
          if (typeof value === 'string') {
            paramValue = value.split(',').map(item => item.trim());
          } else if (!Array.isArray(value)) {
            paramValue = [value];
          }
          // Create placeholders for IN/NOT IN clause
          condition = `${field} ${operator} (${paramValue.map(() => '?').join(', ')})`;
          // Spread array values into params
          params.push(...paramValue);
        } else {
          // Existing logic for other operators
          condition = `${field} ${operator} ?`;
          paramValue = operator === 'LIKE' ? `%${value}%` : value;
          params.push(paramValue);
        }

        sqlSingle += sqlSingle.includes('WHERE') ? ` AND ${condition}` : ` WHERE ${condition}`;
      }
    };

    addCondition('ids_profile_cabang', ids_profile_cabang);
    addCondition('ids_cabang', ids_cabang);
    addCondition('cabang', cabang, 'LIKE');
    addCondition('ids_provinsi', ids_provinsi);
    addCondition('provinsi', provinsi, 'LIKE');
    addCondition('pulau', pulau);
    addCondition('ids_kabkota', ids_kabkota);
    addCondition('kabkota', kabkota, 'LIKE');
    addCondition('id_profile_ketua', id_profile_ketua);
    addCondition('ketua', ketua, 'LIKE');

    // Limit to 1 row
    sqlSingle += ' LIMIT 1';

    // Execute query
    const getData = await helper.runSQL({
      sql: sqlSingle,
      param: params,
    });

    if (!getData.length) {
      return response.sc404('Data not found.', {}, res);
    }

    const json = getData[0];

    // Set Redis cache
    if (process.env.REDIS_ACTIVE === 'ON') {
      try {
        await redis.set(
          key,
          JSON.stringify(json),
          'EX',
          60 * 60 * 24 * (process.env.REDIS_DAY || 1)
        ); // Default 1 hari
      } catch (redisError) {
        logger.error('Redis error:', redisError);
      }
    }

    return response.sc200('', json, res);
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

module.exports = Controller;

/* Libraries */
const winston = require('winston');
const md5 = require('md5');
const DailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment-timezone');
/* Helpers */
const helper = require('../helpers/helper');
const response = require('../helpers/response');
const isEmpty = require('../validation/is-empty');
/* Config */
const redis = require('../config/redis');
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

const redisPrefix = process.env.REDIS_PREFIX + 'statistik:event:';

// Helper function to handle errors
const handleError = (error, res) => {
  logger.error(error);
  return response.sc500('An error occurred in the system, please try again.', {}, res);
};

// Helper function to process multiple values (support IN operator)
const processMultipleValues = value => {
  if (!value) return null;

  // Jika value adalah array, langsung return
  if (Array.isArray(value)) return value;

  // Jika value adalah string dengan koma, split menjadi array
  if (typeof value === 'string' && value.includes(',')) {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
  }

  // Jika single value, return sebagai array dengan 1 item
  return [value];
};

// Helper function to build SQL condition for multiple values
const buildCondition = (field, values, operator = 'IN') => {
  if (!values || values.length === 0) return { condition: null, params: [] };

  if (values.length === 1) {
    // Untuk single value, gunakan operator = atau !=
    const singleOperator = operator === 'NOT IN' ? '!=' : '=';
    return {
      condition: `${field} ${singleOperator} ?`,
      params: [values[0]],
    };
  } else {
    // Untuk multiple values, gunakan IN atau NOT IN
    const placeholders = values.map(() => '?').join(',');
    return {
      condition: `${field} ${operator} (${placeholders})`,
      params: values,
    };
  }
};

/**
 * Statistik Event
 */
Controller.s1 = async (req, res) => {
  try {
    const {
      // Filter parameters (IN)
      ids_cabang,
      jenis,
      status,
      ids_provinsi,
      ids_kabkota,
      ids_kecamatan,
      ids_kelurahan,
      pulau,
      tahun,
      bulan,
      // Filter parameters (NOT IN)
      ids_cabang_not,
      jenis_not,
      status_not,
      ids_provinsi_not,
      ids_kabkota_not,
      ids_kecamatan_not,
      ids_kelurahan_not,
      pulau_not,
      // Special filters
      sedang_berlangsung, // true/false
      periode_aktif, // true/false - event yang sedang dalam periode akses
      // Grouping parameters
      group_by, // status, jenis, cabang, provinsi, kabkota, kecamatan, kelurahan, pulau, tahun, bulan
      // Date range
      tgl_awal,
      tgl_akhir,
    } = req.query;

    const key = redisPrefix + 's1:' + md5(req.originalUrl);

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

    // Build base query
    let sqlSelect = 'SELECT ';
    let sqlFrom = ' FROM view_event ve';
    const params = [];
    const conditions = [];

    // Handle grouping
    const groupFields = group_by ? group_by.split(',') : [];
    const selectFields = [];
    const groupByFields = [];

    // Add fields based on grouping
    if (groupFields.length > 0) {
      groupFields.forEach(field => {
        switch (field.trim()) {
          case 'status':
            selectFields.push('ve.status');
            groupByFields.push('ve.status');
            break;
          case 'jenis':
            selectFields.push('ve.jenis');
            groupByFields.push('ve.jenis');
            break;
          case 'cabang':
            selectFields.push('ve.ids_cabang', 've.cabang');
            groupByFields.push('ve.ids_cabang', 've.cabang');
            break;
          case 'provinsi':
            selectFields.push('ve.ids_provinsi', 've.provinsi');
            groupByFields.push('ve.ids_provinsi', 've.provinsi');
            break;
          case 'kabkota':
            selectFields.push('ve.ids_kabkota', 've.kabkota');
            groupByFields.push('ve.ids_kabkota', 've.kabkota');
            break;
          case 'kecamatan':
            selectFields.push('ve.ids_kecamatan', 've.kecamatan');
            groupByFields.push('ve.ids_kecamatan', 've.kecamatan');
            break;
          case 'kelurahan':
            selectFields.push('ve.ids_kelurahan', 've.kelurahan');
            groupByFields.push('ve.ids_kelurahan', 've.kelurahan');
            break;
          case 'pulau':
            selectFields.push('ve.pulau');
            groupByFields.push('ve.pulau');
            break;
          case 'tahun':
            selectFields.push('YEAR(ve.tgl_awal_acara) as tahun');
            groupByFields.push('YEAR(ve.tgl_awal_acara)');
            break;
          case 'bulan':
            selectFields.push(
              'YEAR(ve.tgl_awal_acara) as tahun',
              'MONTH(ve.tgl_awal_acara) as bulan'
            );
            groupByFields.push('YEAR(ve.tgl_awal_acara)', 'MONTH(ve.tgl_awal_acara)');
            break;
        }
      });

      // Add count field
      selectFields.push('COUNT(*) as total');
      sqlSelect += selectFields.join(', ');
    } else {
      // No grouping - just total count
      sqlSelect += 'COUNT(*) as total';
    }

    // Process multiple values for fields that support IN operator
    const processedIdsCabang = processMultipleValues(ids_cabang);
    const processedJenis = processMultipleValues(jenis);
    const processedStatus = processMultipleValues(status);
    const processedIdsProvinsi = processMultipleValues(ids_provinsi);
    const processedIdsKabkota = processMultipleValues(ids_kabkota);
    const processedIdsKecamatan = processMultipleValues(ids_kecamatan);
    const processedIdsKelurahan = processMultipleValues(ids_kelurahan);
    const processedPulau = processMultipleValues(pulau);

    // Process multiple values for fields that support NOT IN operator
    const processedIdsCabangNot = processMultipleValues(ids_cabang_not);
    const processedJenisNot = processMultipleValues(jenis_not);
    const processedStatusNot = processMultipleValues(status_not);
    const processedIdsProvinsiNot = processMultipleValues(ids_provinsi_not);
    const processedIdsKabkotaNot = processMultipleValues(ids_kabkota_not);
    const processedIdsKecamatanNot = processMultipleValues(ids_kecamatan_not);
    const processedIdsKelurahanNot = processMultipleValues(ids_kelurahan_not);
    const processedPulauNot = processMultipleValues(pulau_not);

    // Build conditions for fields that support IN operator
    const conditionsIN = [
      buildCondition('ve.ids_cabang', processedIdsCabang, 'IN'),
      buildCondition('ve.jenis', processedJenis, 'IN'),
      buildCondition('ve.status', processedStatus, 'IN'),
      buildCondition('ve.ids_provinsi', processedIdsProvinsi, 'IN'),
      buildCondition('ve.ids_kabkota', processedIdsKabkota, 'IN'),
      buildCondition('ve.ids_kecamatan', processedIdsKecamatan, 'IN'),
      buildCondition('ve.ids_kelurahan', processedIdsKelurahan, 'IN'),
      buildCondition('ve.pulau', processedPulau, 'IN'),
    ];

    // Build conditions for fields that support NOT IN operator
    const conditionsNOTIN = [
      buildCondition('ve.ids_cabang', processedIdsCabangNot, 'NOT IN'),
      buildCondition('ve.jenis', processedJenisNot, 'NOT IN'),
      buildCondition('ve.status', processedStatusNot, 'NOT IN'),
      buildCondition('ve.ids_provinsi', processedIdsProvinsiNot, 'NOT IN'),
      buildCondition('ve.ids_kabkota', processedIdsKabkotaNot, 'NOT IN'),
      buildCondition('ve.ids_kecamatan', processedIdsKecamatanNot, 'NOT IN'),
      buildCondition('ve.ids_kelurahan', processedIdsKelurahanNot, 'NOT IN'),
      buildCondition('ve.pulau', processedPulauNot, 'NOT IN'),
    ];

    // Add IN conditions
    conditionsIN.forEach(({ condition, params: conditionParams }) => {
      if (condition) {
        conditions.push(condition);
        params.push(...conditionParams);
      }
    });

    // Add NOT IN conditions
    conditionsNOTIN.forEach(({ condition, params: conditionParams }) => {
      if (condition) {
        conditions.push(condition);
        params.push(...conditionParams);
      }
    });

    // Year filter (single value)
    if (!isEmpty(tahun)) {
      conditions.push('YEAR(ve.tgl_awal_acara) = ?');
      params.push(tahun);
    }

    // Month filter (single value)
    if (!isEmpty(bulan)) {
      conditions.push('MONTH(ve.tgl_awal_acara) = ?');
      params.push(bulan);
    }

    // Date range filter
    if (!isEmpty(tgl_awal) && !isEmpty(tgl_akhir)) {
      conditions.push('ve.tgl_awal_acara BETWEEN ? AND ?');
      params.push(tgl_awal, tgl_akhir);
    } else if (!isEmpty(tgl_awal)) {
      conditions.push('ve.tgl_awal_acara >= ?');
      params.push(tgl_awal);
    } else if (!isEmpty(tgl_akhir)) {
      conditions.push('ve.tgl_awal_acara <= ?');
      params.push(tgl_akhir);
    }

    // Special: Event yang sedang berlangsung
    if (sedang_berlangsung === 'true') {
      const now = moment().format('YYYY-MM-DD');
      conditions.push('ve.tgl_awal_acara <= ? AND ve.tgl_akhir_acara >= ?');
      params.push(now, now);
    }

    // Special: Event dalam periode akses (30 hari sebelum sampai 15 hari setelah acara)
    if (periode_aktif === 'true') {
      const now = moment().format('YYYY-MM-DD');
      conditions.push(
        'DATE_SUB(ve.tgl_awal_acara, INTERVAL 30 DAY) <= ? AND DATE_ADD(ve.tgl_akhir_acara, INTERVAL 15 DAY) >= ?'
      );
      params.push(now, now);
    }

    // Construct final SQL
    let sql = sqlSelect + sqlFrom;

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (groupByFields.length > 0) {
      sql += ' GROUP BY ' + groupByFields.join(', ');
    }

    // Add ordering for grouped results
    if (groupByFields.length > 0) {
      if (groupFields.includes('bulan')) {
        sql += ' ORDER BY tahun, bulan';
      } else if (groupFields.includes('tahun')) {
        sql += ' ORDER BY tahun';
      } else {
        sql += ' ORDER BY total DESC';
      }
    }

    // Execute query
    const getData = await helper.runSQL({
      sql: sql,
      param: params,
    });

    let json = {};

    if (groupFields.length === 0) {
      // Single total result
      json = {
        total: getData[0]?.total || 0,
      };
    } else {
      // Grouped results
      json = {
        data: getData,
        total_groups: getData.length,
        summary: {
          total_events: getData.reduce((sum, item) => sum + parseInt(item.total), 0),
        },
      };

      // Add additional summary by group type if single grouping
      if (groupFields.length === 1) {
        const groupType = groupFields[0];
        json.summary[`by_${groupType}`] = getData.reduce((acc, item) => {
          const key = item[groupType] || item[groupType.replace('ve.', '')];
          acc[key] = parseInt(item.total);
          return acc;
        }, {});
      }
    }

    // Add filter information
    json.filters_applied = {
      // IN filters
      ids_cabang: processedIdsCabang,
      jenis: processedJenis,
      status: processedStatus,
      ids_provinsi: processedIdsProvinsi,
      ids_kabkota: processedIdsKabkota,
      ids_kecamatan: processedIdsKecamatan,
      ids_kelurahan: processedIdsKelurahan,
      pulau: processedPulau,
      // NOT IN filters
      ids_cabang_not: processedIdsCabangNot,
      jenis_not: processedJenisNot,
      status_not: processedStatusNot,
      ids_provinsi_not: processedIdsProvinsiNot,
      ids_kabkota_not: processedIdsKabkotaNot,
      ids_kecamatan_not: processedIdsKecamatanNot,
      ids_kelurahan_not: processedIdsKelurahanNot,
      pulau_not: processedPulauNot,
      // Other filters
      tahun,
      bulan,
      sedang_berlangsung,
      periode_aktif,
      group_by: groupFields,
    };

    // Set Redis cache
    if (process.env.REDIS_ACTIVE === 'ON') {
      try {
        await redis.set(
          key,
          JSON.stringify(json),
          'EX',
          60 * 60 * (process.env.REDIS_HOUR || 1) // Default 1 jam
        );
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

/**
 * Statistik Dashboard
 */
Controller.dashboard = async (req, res) => {
  try {
    const { tahun, ids_cabang, ids_cabang_not, jenis, jenis_not, status, status_not } = req.query;

    const key = redisPrefix + 'dashboard:' + md5(req.originalUrl);

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

    const params = [];
    const conditions = [];

    // Process multiple values for dashboard
    const processedIdsCabang = processMultipleValues(ids_cabang);
    const processedIdsCabangNot = processMultipleValues(ids_cabang_not);
    const processedJenis = processMultipleValues(jenis);
    const processedJenisNot = processMultipleValues(jenis_not);
    const processedStatus = processMultipleValues(status);
    const processedStatusNot = processMultipleValues(status_not);

    // Build conditions for IN operators
    if (processedIdsCabang) {
      const cabangCondition = buildCondition('ve.ids_cabang', processedIdsCabang, 'IN');
      if (cabangCondition.condition) {
        conditions.push(cabangCondition.condition);
        params.push(...cabangCondition.params);
      }
    }

    if (processedJenis) {
      const jenisCondition = buildCondition('ve.jenis', processedJenis, 'IN');
      if (jenisCondition.condition) {
        conditions.push(jenisCondition.condition);
        params.push(...jenisCondition.params);
      }
    }

    if (processedStatus) {
      const statusCondition = buildCondition('ve.status', processedStatus, 'IN');
      if (statusCondition.condition) {
        conditions.push(statusCondition.condition);
        params.push(...statusCondition.params);
      }
    }

    // Build conditions for NOT IN operators
    if (processedIdsCabangNot) {
      const cabangNotCondition = buildCondition('ve.ids_cabang', processedIdsCabangNot, 'NOT IN');
      if (cabangNotCondition.condition) {
        conditions.push(cabangNotCondition.condition);
        params.push(...cabangNotCondition.params);
      }
    }

    if (processedJenisNot) {
      const jenisNotCondition = buildCondition('ve.jenis', processedJenisNot, 'NOT IN');
      if (jenisNotCondition.condition) {
        conditions.push(jenisNotCondition.condition);
        params.push(...jenisNotCondition.params);
      }
    }

    if (processedStatusNot) {
      const statusNotCondition = buildCondition('ve.status', processedStatusNot, 'NOT IN');
      if (statusNotCondition.condition) {
        conditions.push(statusNotCondition.condition);
        params.push(...statusNotCondition.params);
      }
    }

    if (!isEmpty(tahun)) {
      conditions.push('YEAR(ve.tgl_awal_acara) = ?');
      params.push(tahun);
    }

    let whereClause = '';
    if (conditions.length > 0) {
      whereClause = ' WHERE ' + conditions.join(' AND ');
    }

    // Multiple queries for dashboard summary dengan penanganan WHERE yang benar
    const queries = {
      total_events: {
        sql: `SELECT COUNT(*) as total FROM view_event ve ${whereClause}`,
        param: params,
      },
      by_status: {
        sql: `SELECT status, COUNT(*) as total FROM view_event ve ${whereClause} GROUP BY status ORDER BY total DESC`,
        param: params,
      },
      by_jenis: {
        sql: `SELECT jenis, COUNT(*) as total FROM view_event ve ${whereClause} AND jenis IS NOT NULL GROUP BY jenis ORDER BY total DESC`,
        param: params,
      },
      by_cabang: {
        sql: `SELECT ids_cabang, cabang, COUNT(*) as total FROM view_event ve ${whereClause} GROUP BY ids_cabang, cabang ORDER BY total DESC LIMIT 10`,
        param: params,
      },
      by_provinsi: {
        sql: `SELECT ids_provinsi, provinsi, COUNT(*) as total FROM view_event ve ${whereClause} GROUP BY ids_provinsi, provinsi ORDER BY total DESC LIMIT 10`,
        param: params,
      },
      sedang_berlangsung: {
        sql: `SELECT COUNT(*) as total FROM view_event ve ${
          whereClause ? whereClause + ' AND ' : ' WHERE '
        } ve.tgl_awal_acara <= CURDATE() AND ve.tgl_akhir_acara >= CURDATE()`,
        param: params,
      },
      by_bulan: {
        sql: `SELECT YEAR(tgl_awal_acara) as tahun, MONTH(tgl_awal_acara) as bulan, COUNT(*) as total FROM view_event ve ${whereClause} GROUP BY YEAR(tgl_awal_acara), MONTH(tgl_awal_acara) ORDER BY tahun, bulan`,
        param: params,
      },
    };

    // Fix the jenis query - ensure proper WHERE clause construction
    if (whereClause) {
      queries.by_jenis.sql = `SELECT jenis, COUNT(*) as total FROM view_event ve ${whereClause} AND jenis IS NOT NULL GROUP BY jenis ORDER BY total DESC`;
    } else {
      queries.by_jenis.sql = `SELECT jenis, COUNT(*) as total FROM view_event ve WHERE jenis IS NOT NULL GROUP BY jenis ORDER BY total DESC`;
    }

    // Execute all queries in parallel
    const results = await Promise.all(
      Object.values(queries).map(queryConfig =>
        helper
          .runSQL({
            sql: queryConfig.sql,
            param: queryConfig.param,
          })
          .catch(error => {
            logger.error('Query execution error:', {
              sql: queryConfig.sql,
              params: queryConfig.param,
              error: error.message,
            });
            return []; // Return empty array on error to prevent complete failure
          })
      )
    );

    const json = {
      summary: {
        total_events: results[0][0]?.total || 0,
        sedang_berlangsung: results[5][0]?.total || 0,
      },
      by_status: results[1],
      by_jenis: results[2],
      by_cabang: results[3],
      by_provinsi: results[4],
      by_bulan: results[6],
      filters: {
        tahun,
        ids_cabang: processedIdsCabang,
        ids_cabang_not: processedIdsCabangNot,
        jenis: processedJenis,
        jenis_not: processedJenisNot,
        status: processedStatus,
        status_not: processedStatusNot,
      },
    };

    // Set Redis cache
    if (process.env.REDIS_ACTIVE === 'ON') {
      try {
        await redis.set(
          key,
          JSON.stringify(json),
          'EX',
          60 * 30 // 30 menit untuk dashboard
        );
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

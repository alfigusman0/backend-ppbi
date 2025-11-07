/* Config */
const redis = require('../../config/redis');
/* Libraries */
const winston = require('winston');
const md5 = require('md5');
const DailyRotateFile = require('winston-daily-rotate-file');
/* Helpers */
const helper = require('../../helpers/helper');
const response = require('../../helpers/response');
const whatsapp = require('../../helpers/whatsapp');
const isEmpty = require('../../validation/is-empty');
/* Logger */
const logger = winston.createLogger({
  jenis_suiseki: 'info',
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

const redisPrefix = process.env.REDIS_PREFIX + 'formulir:pendaftaran:';

const delay = () => {
  const min = 90;
  const max = 120;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to check access rights
const checkAccess = async (req, action) => {
  const sql = {
    sql: 'SELECT * FROM tbs_hak_akses WHERE ids_level = ? AND ids_modul = ? AND permission LIKE ?',
    param: [req.authIdsLevel, 26, `%${action}%`],
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

    const created_by =
      req.authTingkat <= 5 ? req.body.created_by || req.authIdUser : req.authIdUser;
    const id_pohon = isEmpty(req.body.id_pohon) ? null : req.body.id_pohon;
    const id_suiseki = isEmpty(req.body.id_suiseki) ? null : req.body.id_suiseki;
    const id_pengantar = isEmpty(req.body.id_pengantar) ? null : req.body.id_pengantar;
    const keterangan = isEmpty(req.body.keterangan) ? null : req.body.keterangan;
    const { id_event, id_kategori, ukuran, foto } = req.body;

    /* Get Data Kelas */
    const getKelas = await helper.runSQL({
      sql: 'SELECT ids_kelas FROM tbl_kategori WHERE id_event = ? AND id_kategori = ? LIMIT 1',
      param: [id_event, id_kategori],
    });
    if (!getKelas.length) {
      return response.sc400(
        'Failed to generate registration number. Please check class data.',
        {},
        res
      );
    }

    const no_registrasi = await Controller.getNoRegistrasi(id_event, getKelas[0].ids_kelas);
    if (!no_registrasi) {
      return response.sc400(
        'Failed to generate registration number. Please check event and class data.',
        {},
        res
      );
    }

    const sqlInsert = {
      sql: 'INSERT INTO `tbl_formulir`(`id_event`, `no_registrasi`, `id_pohon`, `id_suiseki`, `id_kategori`, `ukuran`, `foto`, `id_pengantar`, `keterangan`, `created_by`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      param: [
        id_event,
        no_registrasi,
        id_pohon,
        id_suiseki,
        id_kategori,
        ukuran,
        foto,
        id_pengantar,
        keterangan,
        created_by,
      ],
    };

    const result = await helper.runSQL(sqlInsert);
    const json = {
      id_formulir: result.insertId,
    };

    try {
      await helper.deleteKeysByPattern(redisPrefix + '*');
    } catch (redisError) {
      logger.error('Failed to delete Redis cache in create:', redisError);
    }

    // Template
    const template = `Halo *[Nama Peserta]*\n\nSelamat [Jenis] anda :\nNomor Registrasi: *[Nomor Registrasi]*\nJenis [Jenis]: *[Jenis Bonsai]*\ntelah terdaftar pada *[Nama Event]* \n\nSilahkan melakukan pembayaran pada stand meja Pembayaran\n\nHormat Kami,\nPanitia Pameran *[Nama Event]*\n\nPesan ini dikirimkan secara otomatis melalui sistem`;
    /* Get Event */
    const event = await helper.runSQL({
      sql: 'SELECT * FROM view_event WHERE id_event = ? LIMIT 1',
      param: [id_event],
    });
    /* Get Profile */
    const profile = await helper.runSQL({
      sql: 'SELECT * FROM view_profile WHERE created_by = ? LIMIT 1',
      param: [created_by],
    });
    let message;
    if (!isEmpty(id_pohon)) {
      const pohon = await helper.runSQL({
        sql: 'SELECT * FROM view_pohon WHERE id_pohon = ? LIMIT 1',
        param: [id_pohon],
      });
      const data = {
        jenis: 'Bonsai',
        nama_lengkap: profile[0].nama_lengkap,
        no_registrasi: no_registrasi,
        jenis_bonsai: pohon[0].jenis_bonsai,
        nama_acara: event[0].nama_acara,
      };
      message = replaceMessage(template, data);
    } else {
      const suiseki = await helper.runSQL({
        sql: 'SELECT * FROM view_suiseki WHERE id_suiseki = ? LIMIT 1',
        param: [id_suiseki],
      });
      const data = {
        jenis: 'Suiseki',
        nama_lengkap: profile[0].nama_lengkap,
        no_registrasi: no_registrasi,
        jenis_bonsai: suiseki[0].jenis_suiseki,
        nama_acara: event[0].nama_acara,
      };
      message = replaceMessage(template, data);
    }

    const target = profile[0].nmr_tlpn;
    /* Send Notification Whatsapp */
    const fb = await whatsapp.sendMessage(id_event, { target, message, delay });
    if (!fb.success) {
      const statusCode = fb.errorType === 'TOKEN_ERROR' ? 401 : 500;
      console.log(`Error Whatsapp : ${statusCode} : ${fb.message}`);
    }

    return response.sc200('Data added successfully.', json, res);
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

Controller.read_bonsai = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'read');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const key = redisPrefix + 'read:' + md5(req.originalUrl);
    const created_by = req.authTingkat <= 5 ? req.query.created_by : req.authIdUser;
    const order_by = req.query.order_by || 'created_at DESC';
    const {
      id_formulir,
      uuid,
      id_event,
      nama_acara,
      ids_cabang,
      cabang,
      nomor_sertifikat,
      no_registrasi,
      no_juri,
      id_bonsai,
      uuid_bonsai,
      id_profile,
      nama_lengkap,
      ids_jenis_bonsai,
      jenis_bonsai,
      ids_kelas,
      nama_kelas,
      id_kategori,
      nama_kategori,
      bayar,
      cetak,
      arena,
      meja,
      id_juri,
      juri_nama,
    } = req.query;

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
    let sqlRead = 'SELECT * FROM `view_formulir_pohon`';
    let sqlReadTotalData = 'SELECT COUNT(id_formulir) as total FROM `view_formulir_pohon`';
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

    addCondition('id_formulir', id_formulir, 'IN');
    addCondition('uuid', uuid);
    addCondition('id_event', id_event, 'IN');
    addCondition('nama_acara', nama_acara, 'LIKE');
    addCondition('ids_cabang', ids_cabang, 'IN');
    addCondition('cabang', cabang, 'LIKE');
    addCondition('nomor_sertifikat', nomor_sertifikat, 'LIKE');
    addCondition('no_registrasi', no_registrasi, 'LIKE');
    addCondition('no_juri', no_juri, 'LIKE');
    addCondition('id_bonsai', id_bonsai, 'IN');
    addCondition('uuid_bonsai', uuid_bonsai);
    addCondition('id_profile', id_profile, 'IN');
    addCondition('nama_lengkap', nama_lengkap, 'LIKE');
    addCondition('ids_jenis_bonsai', ids_jenis_bonsai, 'IN');
    addCondition('jenis_bonsai', jenis_bonsai, 'LIKE');
    addCondition('ids_kelas', ids_kelas, 'IN');
    addCondition('nama_kelas', nama_kelas, 'LIKE');
    addCondition('id_kategori', id_kategori, 'IN');
    addCondition('nama_kategori', nama_kategori, 'LIKE');
    addCondition('bayar', bayar);
    addCondition('cetak', cetak);
    addCondition('arena', arena);
    addCondition('meja', meja);
    addCondition('id_juri', id_juri, 'IN');
    addCondition('juri_nama', juri_nama, 'LIKE');
    addCondition('created_by', created_by);

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

Controller.read_suiseki = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'read');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const key = redisPrefix + 'read:' + md5(req.originalUrl);
    const created_by = req.authTingkat <= 5 ? req.query.created_by : req.authIdUser;
    const order_by = req.query.order_by || 'created_at DESC';
    const {
      id_formulir,
      uuid,
      id_event,
      nama_acara,
      ids_cabang,
      cabang,
      nomor_sertifikat,
      no_registrasi,
      no_juri,
      id_suiseki,
      uuid_suiseki,
      id_profile,
      nama_lengkap,
      ids_jenis_suiseki,
      jenis_suiseki,
      ids_kelas,
      nama_kelas,
      id_kategori,
      nama_kategori,
      bayar,
      cetak,
      arena,
      meja,
    } = req.query;

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
    let sqlRead = 'SELECT * FROM `view_formulir_suiseki`';
    let sqlReadTotalData = 'SELECT COUNT(id_formulir) as total FROM `view_formulir_suiseki`';
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

    addCondition('id_formulir', id_formulir, 'IN');
    addCondition('uuid', uuid);
    addCondition('id_event', id_event, 'IN');
    addCondition('nama_acara', nama_acara, 'LIKE');
    addCondition('ids_cabang', ids_cabang, 'IN');
    addCondition('cabang', cabang, 'LIKE');
    addCondition('nomor_sertifikat', nomor_sertifikat, 'LIKE');
    addCondition('no_registrasi', no_registrasi, 'LIKE');
    addCondition('no_juri', no_juri, 'LIKE');
    addCondition('id_suiseki', id_suiseki, 'IN');
    addCondition('uuid_suiseki', uuid_suiseki);
    addCondition('id_profile', id_profile, 'IN');
    addCondition('nama_lengkap', nama_lengkap, 'LIKE');
    addCondition('ids_jenis_suiseki', ids_jenis_suiseki, 'IN');
    addCondition('jenis_suiseki', jenis_suiseki, 'LIKE');
    addCondition('ids_kelas', ids_kelas, 'IN');
    addCondition('nama_kelas', nama_kelas, 'LIKE');
    addCondition('id_kategori', id_kategori, 'IN');
    addCondition('nama_kategori', nama_kategori, 'LIKE');
    addCondition('bayar', bayar);
    addCondition('cetak', cetak);
    addCondition('arena', arena);
    addCondition('meja', meja);
    addCondition('created_by', created_by);

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
      id_event,
      nomor_sertifikat,
      no_registrasi,
      no_juri,
      id_pohon,
      id_suiseki,
      id_kategori,
      ukuran,
      bukti_bayar,
      bayar,
      cetak,
      arena,
      meja,
      foto,
      id_pengantar,
      total,
      kriteria,
      keterangan,
      id_profile_juri,
    } = req.body;

    /* Check existing data */
    let sql = 'SELECT * FROM `tbl_formulir` WHERE id_formulir = ?';
    const param = [id];
    if (req.authTingkat > 5) {
      sql += ' AND created_by = ?';
      param.push(req.authIdUser);
    }
    sql += ' LIMIT 1';
    const checkData = await helper.runSQL({
      sql,
      param,
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

    if (req.authTingkat <= 5) {
      addUpdate('id_event', id_event);
      addUpdate('nomor_sertifikat', nomor_sertifikat);
      addUpdate('no_registrasi', no_registrasi);
      addUpdate('no_juri', no_juri);
      addUpdate('bayar', bayar);
      addUpdate('arena', arena);
      addUpdate('meja', meja);
      addUpdate('id_pengantar', id_pengantar);
      addUpdate('total', total);
      addUpdate('kriteria', kriteria);
      addUpdate('keterangan', keterangan);
      addUpdate('id_profile_juri', id_profile_juri);
    }

    addUpdate('id_pohon', id_pohon);
    addUpdate('id_suiseki', id_suiseki);
    addUpdate('id_kategori', id_kategori);
    addUpdate('ukuran', ukuran);
    addUpdate('bukti_bayar', bukti_bayar);
    addUpdate('cetak', cetak);
    addUpdate('foto', foto);

    // Check Data Update
    if (isEmpty(params)) {
      return response.sc400('No data has been changed.', {}, res);
    }

    addUpdate('updated_by', req.authIdUser);
    const sqlUpdate = {
      sql: `UPDATE \`tbl_formulir\` SET ${updates.join(', ')} WHERE \`id_formulir\` = ?`,
      param: [...params, id],
    };

    await helper.runSQL(sqlUpdate);
    const json = {
      id_formulir: id,
    };

    // Hapus cache Redis
    try {
      await helper.deleteKeysByPattern(redisPrefix + '*');
    } catch (redisError) {
      logger.error('Failed to delete Redis cache in update:', redisError);
    }

    if (!isEmpty(bayar) && bayar === 'SUDAH') {
      let message;
      const template = `Halo *[Nama Peserta]*\n\nTerima kasih [Jenis] anda :\nNomor Registrasi: *[Nomor Registrasi]*\nJenis [Jenis]: *[Jenis Bonsai]*\ntelah melakukan pembayaran sebesar *[Harga]* pada Pameran *[Nama Event]*.\n\nHormat Kami,\nPanitia Pameran *[Nama Event]*\n\nPesan ini dikirimkan secara otomatis melalui sistem`;
      /* Get Event */
      const event = await helper.runSQL({
        sql: 'SELECT * FROM view_event WHERE id_event = ? LIMIT 1',
        param: [checkData[0].id_event],
      });
      /* Get Profile */
      const profile = await helper.runSQL({
        sql: 'SELECT * FROM view_profile WHERE created_by = ? LIMIT 1',
        param: [checkData[0].created_by],
      });
      /* Get Kategori */
      const kategori = await helper.runSQL({
        sql: 'SELECT * FROM view_kategori WHERE id_kategori = ? LIMIT 1',
        param: [checkData[0].id_kategori],
      });

      /* Get Jenis */
      if (!isEmpty(checkData[0].id_pohon)) {
        const pohon = await helper.runSQL({
          sql: 'SELECT * FROM view_pohon WHERE id_pohon = ? LIMIT 1',
          param: [checkData[0].id_pohon],
        });
        const data = {
          jenis: 'Bonsai',
          nama_lengkap: profile[0].nama_lengkap,
          no_registrasi: no_registrasi,
          jenis_bonsai: pohon[0].jenis_bonsai,
          nama_acara: event[0].nama_acara,
          harga: kategori[0].uang,
        };
        message = replaceMessage(template, data);
      } else {
        const suiseki = await helper.runSQL({
          sql: 'SELECT * FROM view_suiseki WHERE id_suiseki = ? LIMIT 1',
          param: [checkData[0].id_suiseki],
        });
        const data = {
          jenis: 'Suiseki',
          nama_lengkap: profile[0].nama_lengkap,
          no_registrasi: checkData[0].no_registrasi,
          jenis_bonsai: suiseki[0].jenis_suiseki,
          nama_acara: event[0].nama_acara,
          harga: kategori[0].uang,
        };
        message = replaceMessage(template, data);
      }

      const target = profile[0].nmr_tlpn;
      /* Send Notification Whatsapp */
      const fb = await whatsapp.sendMessage(checkData[0].id_event, { target, message, delay });
      if (!fb.success) {
        const statusCode = fb.errorType === 'TOKEN_ERROR' ? 401 : 500;
        console.log(`Error Whatsapp : ${statusCode} : ${fb.message}`);
      }
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

    /* Check existing data */
    let sql = 'SELECT id_formulir FROM `tbl_formulir` WHERE id_formulir = ?';
    const param = [id];
    if (req.authTingkat > 5) {
      sql += ' AND created_by = ?';
      param.push(req.authIdUser);
    }
    sql += ' LIMIT 1';
    const checkData = await helper.runSQL({
      sql,
      param,
    });
    if (!checkData.length) {
      return response.sc404('Data not found.', {}, res);
    }

    /* Status Pembayaran */
    if (checkData[0].bayar === 'SUDAH') {
      return response.sc400('Data tidak dapat dihapus karena sudah dibayar.', {}, res);
    }

    // SQL Delete Data
    const sqlDelete = {
      sql: 'DELETE FROM `tbl_formulir` WHERE id_formulir = ?',
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

Controller.single_bonsai = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'single');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const key = redisPrefix + 'single:' + md5(req.originalUrl);
    const created_by = req.authTingkat <= 5 ? req.query.created_by : req.authIdUser;
    const {
      id_formulir,
      uuid,
      id_event,
      nama_acara,
      ids_cabang,
      cabang,
      nomor_sertifikat,
      no_registrasi,
      no_juri,
      id_bonsai,
      uuid_bonsai,
      id_profile,
      nama_lengkap,
      ids_jenis_bonsai,
      jenis_bonsai,
      ids_kelas,
      nama_kelas,
      id_kategori,
      nama_kategori,
      bayar,
      cetak,
      arena,
      meja,
      id_juri,
      juri_nama,
    } = req.query;

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
    let sqlSingle = 'SELECT * FROM `view_formulir_pohon`';
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

    addCondition('id_formulir', id_formulir);
    addCondition('uuid', uuid);
    addCondition('id_event', id_event);
    addCondition('nama_acara', nama_acara, 'LIKE');
    addCondition('ids_cabang', ids_cabang);
    addCondition('cabang', cabang, 'LIKE');
    addCondition('nomor_sertifikat', nomor_sertifikat, 'LIKE');
    addCondition('no_registrasi', no_registrasi, 'LIKE');
    addCondition('no_juri', no_juri, 'LIKE');
    addCondition('id_bonsai', id_bonsai);
    addCondition('uuid_bonsai', uuid_bonsai);
    addCondition('id_profile', id_profile);
    addCondition('nama_lengkap', nama_lengkap, 'LIKE');
    addCondition('ids_jenis_bonsai', ids_jenis_bonsai);
    addCondition('jenis_bonsai', jenis_bonsai, 'LIKE');
    addCondition('ids_kelas', ids_kelas);
    addCondition('nama_kelas', nama_kelas, 'LIKE');
    addCondition('id_kategori', id_kategori);
    addCondition('nama_kategori', nama_kategori, 'LIKE');
    addCondition('bayar', bayar);
    addCondition('cetak', cetak);
    addCondition('arena', arena);
    addCondition('meja', meja);
    addCondition('id_juri', id_juri);
    addCondition('juri_nama', juri_nama, 'LIKE');
    addCondition('created_by', created_by);

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

Controller.single_suiseki = async (req, res) => {
  try {
    const hasAccess = await checkAccess(req, 'single');
    if (!hasAccess) {
      return response.sc401('Access denied.', {}, res);
    }

    const key = redisPrefix + 'single:' + md5(req.originalUrl);
    const created_by = req.authTingkat <= 5 ? req.query.created_by : req.authIdUser;
    const {
      id_formulir,
      uuid,
      id_event,
      nama_acara,
      ids_cabang,
      cabang,
      nomor_sertifikat,
      no_registrasi,
      no_juri,
      id_suiseki,
      uuid_suiseki,
      id_profile,
      nama_lengkap,
      ids_jenis_suiseki,
      jenis_suiseki,
      ids_kelas,
      nama_kelas,
      id_kategori,
      nama_kategori,
      bayar,
      cetak,
      arena,
      meja,
    } = req.query;

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
    let sqlSingle = 'SELECT * FROM `view_formulir_suiseki`';
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

    addCondition('id_formulir', id_formulir);
    addCondition('uuid', uuid);
    addCondition('id_event', id_event);
    addCondition('nama_acara', nama_acara, 'LIKE');
    addCondition('ids_cabang', ids_cabang);
    addCondition('cabang', cabang, 'LIKE');
    addCondition('nomor_sertifikat', nomor_sertifikat, 'LIKE');
    addCondition('no_registrasi', no_registrasi, 'LIKE');
    addCondition('no_juri', no_juri, 'LIKE');
    addCondition('id_suiseki', id_suiseki);
    addCondition('uuid_suiseki', uuid_suiseki);
    addCondition('id_profile', id_profile);
    addCondition('nama_lengkap', nama_lengkap, 'LIKE');
    addCondition('ids_jenis_suiseki', ids_jenis_suiseki);
    addCondition('jenis_suiseki', jenis_suiseki, 'LIKE');
    addCondition('ids_kelas', ids_kelas);
    addCondition('nama_kelas', nama_kelas, 'LIKE');
    addCondition('id_kategori', id_kategori);
    addCondition('nama_kategori', nama_kategori, 'LIKE');
    addCondition('bayar', bayar);
    addCondition('cetak', cetak);
    addCondition('arena', arena);
    addCondition('meja', meja);
    addCondition('created_by', created_by);

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

/* Get Kode Nomor Registrasi */
Controller.getNoRegistrasi = async (id_event, ids_kelas) => {
  try {
    const result = await helper.runSQL({
      sql: 'SELECT no_registrasi FROM view_formulir_pohon WHERE id_event = ? AND ids_kelas = ? ORDER BY no_registrasi DESC LIMIT 1',
      param: [id_event, ids_kelas],
    });
    if (!result.length) {
      const getKelas = await helper.runSQL({
        sql: 'SELECT kode FROM tbs_kelas WHERE ids_kelas = ? LIMIT 1',
        param: [ids_kelas],
      });
      if (!getKelas.length) {
        return null;
      }
      return `${getKelas[0].kode}-00001`;
    }
    console.log(result);
    const lastNo = result[0].no_registrasi;
    const parts = lastNo.split('-');
    const lastPart = parseInt(parts[parts.length - 1]);
    const newPart = lastPart + 1;
    const newNo = `${parts.slice(0, parts.length - 1).join('-')}-${newPart
      .toString()
      .padStart(5, '0')}`;
    return newNo;
  } catch (error) {
    console.log(error);
    logger.error('Error getting registration number:', error);
    return null;
  }
};

// Fungsi untuk mengganti placeholder dengan data dari variabel
function replaceMessage(template, data) {
  return template
    .replace(/\[Jenis\]/g, data.jenis || '')
    .replace(/\[Nama Peserta\]/g, data.nama_lengkap || '')
    .replace(/\[Nomor Registrasi\]/g, data.no_registrasi || '')
    .replace(/\[Jenis Bonsai\]/g, data.jenis_bonsai || '')
    .replace(/\[Nama Event\]/g, data.nama_acara || '')
    .replace(/\[Harga\]/g, formatRupiah(data.harga) || '');
}

// Function untuk format Rupiah
function formatRupiah(harga) {
  if (!harga) return 'Rp 0';

  // Konversi ke number jika string
  const numberHarga = typeof harga === 'string' ? parseInt(harga.replace(/\D/g, '')) : harga;

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numberHarga);
}

module.exports = Controller;

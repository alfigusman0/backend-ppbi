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
 * Statistik Formulir
 */
Controller.s2 = async (req, res) => {
  try {
    const {
      // Filter parameters (IN)
      id_event,
      jenis_event,
      ids_cabang,
      bayar,
      cetak,
      arena,
      meja,
      id_kategori,
      ids_kelas,
      kode_kelas,
      kriteria,
      // Filter parameters (NOT IN)
      id_event_not,
      jenis_event_not,
      ids_cabang_not,
      bayar_not,
      cetak_not,
      arena_not,
      meja_not,
      id_kategori_not,
      ids_kelas_not,
      kode_kelas_not,
      kriteria_not,
      // Filter khusus Bonsai
      ids_jenis_bonsai,
      spesies,
      // Filter khusus Suiseki
      ids_jenis_suiseki,
      // Special filters
      sudah_bayar, // true/false
      sudah_cetak, // true/false
      sudah_arena, // true/false
      // Grouping parameters
      group_by, // jenis_event, bayar, cetak, arena, meja, id_kategori, ids_kelas, kode_kelas, kriteria, spesies, ids_jenis_bonsai, ids_jenis_suiseki, bulan, tahun
      // Date range
      tgl_awal,
      tgl_akhir,
    } = req.query;

    const key = redisPrefix + 's2:' + md5(req.originalUrl);

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

    // Build base query - Menggabungkan Bonsai dan Suiseki dengan UNION
    let sqlSelect = 'SELECT ';
    let sqlFrom = ` FROM (
      SELECT
        'Bonsai' as jenis_formulir,
        vfp.id_formulir,
        vfp.id_event,
        vfp.jenis_event,
        vfp.ids_cabang,
        vfp.cabang,
        vfp.bayar,
        vfp.cetak,
        vfp.arena,
        vfp.meja,
        vfp.id_kategori,
        vfp.nama_kategori,
        vfp.ids_kelas,
        vfp.kode_kelas,
        vfp.nama_kelas,
        vfp.kriteria,
        vfp.ids_jenis_bonsai,
        vfp.jenis_bonsai,
        vfp.spesies,
        NULL as ids_jenis_suiseki,
        NULL as jenis_suiseki,
        vfp.created_at,
        vfp.tgl_awal_acara
      FROM view_formulir_pohon vfp
      UNION ALL
      SELECT
        'Suiseki' as jenis_formulir,
        vfs.id_formulir,
        vfs.id_event,
        vfs.jenis_event,
        vfs.ids_cabang,
        vfs.cabang,
        vfs.bayar,
        vfs.cetak,
        vfs.arena,
        vfs.meja,
        vfs.id_kategori,
        vfs.nama_kategori,
        vfs.ids_kelas,
        vfs.kode_kelas,
        vfs.nama_kelas,
        vfs.kriteria,
        NULL as ids_jenis_bonsai,
        NULL as jenis_bonsai,
        NULL as spesies,
        vfs.ids_jenis_suiseki,
        vfs.jenis_suiseki,
        vfs.created_at,
        vfs.tgl_awal_acara
      FROM view_formulir_suiseki vfs
    ) as formulir_gabungan`;

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
          case 'jenis_event':
            selectFields.push('jenis_event');
            groupByFields.push('jenis_event');
            break;
          case 'jenis_formulir':
            selectFields.push('jenis_formulir');
            groupByFields.push('jenis_formulir');
            break;
          case 'bayar':
            selectFields.push('bayar');
            groupByFields.push('bayar');
            break;
          case 'cetak':
            selectFields.push('cetak');
            groupByFields.push('cetak');
            break;
          case 'arena':
            selectFields.push('arena');
            groupByFields.push('arena');
            break;
          case 'meja':
            selectFields.push('meja');
            groupByFields.push('meja');
            break;
          case 'id_kategori':
            selectFields.push('id_kategori', 'nama_kategori');
            groupByFields.push('id_kategori', 'nama_kategori');
            break;
          case 'ids_kelas':
            selectFields.push('ids_kelas', 'kode_kelas', 'nama_kelas');
            groupByFields.push('ids_kelas', 'kode_kelas', 'nama_kelas');
            break;
          case 'kriteria':
            selectFields.push('kriteria');
            groupByFields.push('kriteria');
            break;
          case 'spesies':
            selectFields.push('spesies');
            groupByFields.push('spesies');
            break;
          case 'ids_jenis_bonsai':
            selectFields.push('ids_jenis_bonsai', 'jenis_bonsai');
            groupByFields.push('ids_jenis_bonsai', 'jenis_bonsai');
            break;
          case 'ids_jenis_suiseki':
            selectFields.push('ids_jenis_suiseki', 'jenis_suiseki');
            groupByFields.push('ids_jenis_suiseki', 'jenis_suiseki');
            break;
          case 'tahun':
            selectFields.push('YEAR(tgl_awal_acara) as tahun');
            groupByFields.push('YEAR(tgl_awal_acara)');
            break;
          case 'bulan':
            selectFields.push('YEAR(tgl_awal_acara) as tahun', 'MONTH(tgl_awal_acara) as bulan');
            groupByFields.push('YEAR(tgl_awal_acara)', 'MONTH(tgl_awal_acara)');
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
    const processedIdEvent = processMultipleValues(id_event);
    const processedJenisEvent = processMultipleValues(jenis_event);
    const processedIdsCabang = processMultipleValues(ids_cabang);
    const processedBayar = processMultipleValues(bayar);
    const processedCetak = processMultipleValues(cetak);
    const processedArena = processMultipleValues(arena);
    const processedMeja = processMultipleValues(meja);
    const processedIdKategori = processMultipleValues(id_kategori);
    const processedIdsKelas = processMultipleValues(ids_kelas);
    const processedKodeKelas = processMultipleValues(kode_kelas);
    const processedKriteria = processMultipleValues(kriteria);
    const processedIdsJenisBonsai = processMultipleValues(ids_jenis_bonsai);
    const processedSpesies = processMultipleValues(spesies);
    const processedIdsJenisSuiseki = processMultipleValues(ids_jenis_suiseki);

    // Process multiple values for fields that support NOT IN operator
    const processedIdEventNot = processMultipleValues(id_event_not);
    const processedJenisEventNot = processMultipleValues(jenis_event_not);
    const processedIdsCabangNot = processMultipleValues(ids_cabang_not);
    const processedBayarNot = processMultipleValues(bayar_not);
    const processedCetakNot = processMultipleValues(cetak_not);
    const processedArenaNot = processMultipleValues(arena_not);
    const processedMejaNot = processMultipleValues(meja_not);
    const processedIdKategoriNot = processMultipleValues(id_kategori_not);
    const processedIdsKelasNot = processMultipleValues(ids_kelas_not);
    const processedKodeKelasNot = processMultipleValues(kode_kelas_not);
    const processedKriteriaNot = processMultipleValues(kriteria_not);

    // Build conditions for fields that support IN operator
    const conditionsIN = [
      buildCondition('id_event', processedIdEvent, 'IN'),
      buildCondition('jenis_event', processedJenisEvent, 'IN'),
      buildCondition('ids_cabang', processedIdsCabang, 'IN'),
      buildCondition('bayar', processedBayar, 'IN'),
      buildCondition('cetak', processedCetak, 'IN'),
      buildCondition('arena', processedArena, 'IN'),
      buildCondition('meja', processedMeja, 'IN'),
      buildCondition('id_kategori', processedIdKategori, 'IN'),
      buildCondition('ids_kelas', processedIdsKelas, 'IN'),
      buildCondition('kode_kelas', processedKodeKelas, 'IN'),
      buildCondition('kriteria', processedKriteria, 'IN'),
      buildCondition('ids_jenis_bonsai', processedIdsJenisBonsai, 'IN'),
      buildCondition('spesies', processedSpesies, 'IN'),
      buildCondition('ids_jenis_suiseki', processedIdsJenisSuiseki, 'IN'),
    ];

    // Build conditions for fields that support NOT IN operator
    const conditionsNOTIN = [
      buildCondition('id_event', processedIdEventNot, 'NOT IN'),
      buildCondition('jenis_event', processedJenisEventNot, 'NOT IN'),
      buildCondition('ids_cabang', processedIdsCabangNot, 'NOT IN'),
      buildCondition('bayar', processedBayarNot, 'NOT IN'),
      buildCondition('cetak', processedCetakNot, 'NOT IN'),
      buildCondition('arena', processedArenaNot, 'NOT IN'),
      buildCondition('meja', processedMejaNot, 'NOT IN'),
      buildCondition('id_kategori', processedIdKategoriNot, 'NOT IN'),
      buildCondition('ids_kelas', processedIdsKelasNot, 'NOT IN'),
      buildCondition('kode_kelas', processedKodeKelasNot, 'NOT IN'),
      buildCondition('kriteria', processedKriteriaNot, 'NOT IN'),
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

    // Date range filter
    if (!isEmpty(tgl_awal) && !isEmpty(tgl_akhir)) {
      conditions.push('tgl_awal_acara BETWEEN ? AND ?');
      params.push(tgl_awal, tgl_akhir);
    } else if (!isEmpty(tgl_awal)) {
      conditions.push('tgl_awal_acara >= ?');
      params.push(tgl_awal);
    } else if (!isEmpty(tgl_akhir)) {
      conditions.push('tgl_awal_acara <= ?');
      params.push(tgl_akhir);
    }

    // Special filters
    if (sudah_bayar === 'true') {
      conditions.push("bayar = 'SUDAH'");
    } else if (sudah_bayar === 'false') {
      conditions.push("bayar = 'BELUM'");
    }

    if (sudah_cetak === 'true') {
      conditions.push("cetak = 'SUDAH'");
    } else if (sudah_cetak === 'false') {
      conditions.push("cetak = 'BELUM'");
    }

    if (sudah_arena === 'true') {
      conditions.push("arena = 'IYA'");
    } else if (sudah_arena === 'false') {
      conditions.push("arena = 'TIDAK'");
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
          total_formulir: getData.reduce((sum, item) => sum + parseInt(item.total), 0),
        },
      };

      // Add additional summary by group type if single grouping
      if (groupFields.length === 1) {
        const groupType = groupFields[0];
        json.summary[`by_${groupType}`] = getData.reduce((acc, item) => {
          const key = item[groupType] || item[groupType.replace('formulir_gabungan.', '')];
          acc[key] = parseInt(item.total);
          return acc;
        }, {});
      }
    }

    // Add filter information
    json.filters_applied = {
      // IN filters
      id_event: processedIdEvent,
      jenis_event: processedJenisEvent,
      ids_cabang: processedIdsCabang,
      bayar: processedBayar,
      cetak: processedCetak,
      arena: processedArena,
      meja: processedMeja,
      id_kategori: processedIdKategori,
      ids_kelas: processedIdsKelas,
      kode_kelas: processedKodeKelas,
      kriteria: processedKriteria,
      ids_jenis_bonsai: processedIdsJenisBonsai,
      spesies: processedSpesies,
      ids_jenis_suiseki: processedIdsJenisSuiseki,
      // NOT IN filters
      id_event_not: processedIdEventNot,
      jenis_event_not: processedJenisEventNot,
      ids_cabang_not: processedIdsCabangNot,
      bayar_not: processedBayarNot,
      cetak_not: processedCetakNot,
      arena_not: processedArenaNot,
      meja_not: processedMejaNot,
      id_kategori_not: processedIdKategoriNot,
      ids_kelas_not: processedIdsKelasNot,
      kode_kelas_not: processedKodeKelasNot,
      kriteria_not: processedKriteriaNot,
      // Special filters
      sudah_bayar,
      sudah_cetak,
      sudah_arena,
      // Date filters
      tgl_awal,
      tgl_akhir,
      // Grouping
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
    const { tahun, ids_cabang, ids_cabang_not, id_event, id_event_not } = req.query;

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
    const processedIdEvent = processMultipleValues(id_event);
    const processedIdEventNot = processMultipleValues(id_event_not);

    // Build conditions for IN operators
    if (processedIdsCabang) {
      const cabangCondition = buildCondition('ve.ids_cabang', processedIdsCabang, 'IN');
      if (cabangCondition.condition) {
        conditions.push(cabangCondition.condition);
        params.push(...cabangCondition.params);
      }
    }

    if (processedIdEvent) {
      const eventCondition = buildCondition('ve.id_event', processedIdEvent, 'IN');
      if (eventCondition.condition) {
        conditions.push(eventCondition.condition);
        params.push(...eventCondition.params);
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

    if (processedIdEventNot) {
      const eventNotCondition = buildCondition('ve.id_event', processedIdEventNot, 'NOT IN');
      if (eventNotCondition.condition) {
        conditions.push(eventNotCondition.condition);
        params.push(...eventNotCondition.params);
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

    // Query untuk event (existing)
    const eventQueries = {
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
      sedang_berlangsung: {
        sql: `SELECT COUNT(*) as total FROM view_event ve ${
          whereClause ? whereClause + ' AND ' : ' WHERE '
        } ve.tgl_awal_acara <= CURDATE() AND ve.tgl_akhir_acara >= CURDATE()`,
        param: params,
      },
    };

    // Query untuk formulir (new)
    const formulirWhereClause = whereClause.replace(/ve\./g, 'fg.');
    const formulirQueries = {
      total_formulir: {
        sql: `SELECT COUNT(*) as total FROM (
          SELECT 'Bonsai' as jenis_formulir, vfp.* FROM view_formulir_pohon vfp
          UNION ALL
          SELECT 'Suiseki' as jenis_formulir, vfs.* FROM view_formulir_suiseki vfs
        ) as fg ${formulirWhereClause}`,
        param: params,
      },
      formulir_by_jenis: {
        sql: `SELECT jenis_formulir, COUNT(*) as total FROM (
          SELECT 'Bonsai' as jenis_formulir, vfp.* FROM view_formulir_pohon vfp
          UNION ALL
          SELECT 'Suiseki' as jenis_formulir, vfs.* FROM view_formulir_suiseki vfs
        ) as fg ${formulirWhereClause} GROUP BY jenis_formulir ORDER BY total DESC`,
        param: params,
      },
      formulir_by_bayar: {
        sql: `SELECT bayar, COUNT(*) as total FROM (
          SELECT 'Bonsai' as jenis_formulir, vfp.* FROM view_formulir_pohon vfp
          UNION ALL
          SELECT 'Suiseki' as jenis_formulir, vfs.* FROM view_formulir_suiseki vfs
        ) as fg ${formulirWhereClause} GROUP BY bayar ORDER BY total DESC`,
        param: params,
      },
      formulir_by_cetak: {
        sql: `SELECT cetak, COUNT(*) as total FROM (
          SELECT 'Bonsai' as jenis_formulir, vfp.* FROM view_formulir_pohon vfp
          UNION ALL
          SELECT 'Suiseki' as jenis_formulir, vfs.* FROM view_formulir_suiseki vfs
        ) as fg ${formulirWhereClause} GROUP BY cetak ORDER BY total DESC`,
        param: params,
      },
      formulir_by_arena: {
        sql: `SELECT arena, COUNT(*) as total FROM (
          SELECT 'Bonsai' as jenis_formulir, vfp.* FROM view_formulir_pohon vfp
          UNION ALL
          SELECT 'Suiseki' as jenis_formulir, vfs.* FROM view_formulir_suiseki vfs
        ) as fg ${formulirWhereClause} GROUP BY arena ORDER BY total DESC`,
        param: params,
      },
      formulir_by_event: {
        sql: `SELECT fg.id_event, ve.nama_acara, COUNT(*) as total FROM (
          SELECT 'Bonsai' as jenis_formulir, vfp.* FROM view_formulir_pohon vfp
          UNION ALL
          SELECT 'Suiseki' as jenis_formulir, vfs.* FROM view_formulir_suiseki vfs
        ) as fg
        JOIN view_event ve ON fg.id_event = ve.id_event
        ${formulirWhereClause}
        GROUP BY fg.id_event, ve.nama_acara
        ORDER BY total DESC
        LIMIT 10`,
        param: params,
      },
    };

    // Fix the jenis query - ensure proper WHERE clause construction
    if (whereClause) {
      eventQueries.by_jenis.sql = `SELECT jenis, COUNT(*) as total FROM view_event ve ${whereClause} AND jenis IS NOT NULL GROUP BY jenis ORDER BY total DESC`;
    } else {
      eventQueries.by_jenis.sql = `SELECT jenis, COUNT(*) as total FROM view_event ve WHERE jenis IS NOT NULL GROUP BY jenis ORDER BY total DESC`;
    }

    // Execute all queries in parallel
    const eventResults = await Promise.all(
      Object.values(eventQueries).map(queryConfig =>
        helper
          .runSQL({
            sql: queryConfig.sql,
            param: queryConfig.param,
          })
          .catch(error => {
            logger.error('Event query execution error:', {
              sql: queryConfig.sql,
              params: queryConfig.param,
              error: error.message,
            });
            return []; // Return empty array on error to prevent complete failure
          })
      )
    );

    const formulirResults = await Promise.all(
      Object.values(formulirQueries).map(queryConfig =>
        helper
          .runSQL({
            sql: queryConfig.sql,
            param: queryConfig.param,
          })
          .catch(error => {
            logger.error('Formulir query execution error:', {
              sql: queryConfig.sql,
              params: queryConfig.param,
              error: error.message,
            });
            return []; // Return empty array on error to prevent complete failure
          })
      )
    );

    const json = {
      // Event statistics (existing)
      summary: {
        total_events: eventResults[0][0]?.total || 0,
        sedang_berlangsung: eventResults[4][0]?.total || 0,
        total_formulir: formulirResults[0][0]?.total || 0,
      },
      by_status: eventResults[1],
      by_jenis: eventResults[2],
      by_cabang: eventResults[3],

      // Formulir statistics (new)
      formulir_by_jenis: formulirResults[1],
      formulir_by_bayar: formulirResults[2],
      formulir_by_cetak: formulirResults[3],
      formulir_by_arena: formulirResults[4],
      formulir_by_event: formulirResults[5],

      filters: {
        tahun,
        ids_cabang: processedIdsCabang,
        ids_cabang_not: processedIdsCabangNot,
        id_event: processedIdEvent,
        id_event_not: processedIdEventNot,
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

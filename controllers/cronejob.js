/* Libraries */
const moment = require('moment-timezone');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
/* Helpers */
const helper = require('../helpers/helper');
const response = require('../helpers/response');
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

const handleError = (error, res) => {
  logger.error(error);
  return response.sc500('An error occurred in the system, please try again.', {}, res);
};

// Helper function untuk menghitung rata-rata dengan menghilangkan nilai tertinggi dan terendah
function calculateAverageRemoveExtremes(scores) {
  if (scores.length < 3) return calculateAverage(scores);

  const sorted = [...scores].sort((a, b) => a - b);
  // Hilangkan nilai terendah (index 0) dan tertinggi (index terakhir)
  const middleScores = sorted.slice(1, -1);
  return calculateAverage(middleScores);
}

// Helper function untuk menghitung rata-rata biasa
function calculateAverage(scores) {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((total, score) => total + score, 0);
  return sum / scores.length;
}

/* Create Hak Akses */
Controller.cj1 = async (req, res) => {
  try {
    let count_create = 0;
    let count_update = 0;
    const insertValues = [];
    const updateCases = [];
    const updateParams = [];

    // Get all levels and modules in one go
    const [getDataLevel, getDataModul] = await Promise.all([
      helper.runSQL({
        sql: 'SELECT * FROM tbs_level',
        param: [],
      }),
      helper.runSQL({
        sql: 'SELECT * FROM tbs_modul',
        param: [],
      }),
    ]);

    // Collect all existing hak akses in one query
    const existingAccess = await helper.runSQL({
      sql: 'SELECT ids_level, ids_modul FROM tbs_hak_akses',
      param: [],
    });

    // Create a Set for quick lookup of existing access
    const existingAccessSet = new Set(
      existingAccess.map(row => `${row.ids_level}-${row.ids_modul}`)
    );

    // Process all combinations and prepare bulk operations
    for (const level of getDataLevel) {
      for (const modul of getDataModul) {
        const key = `${level.ids_level}-${modul.ids_modul}`;

        if (!existingAccessSet.has(key)) {
          // Prepare for bulk insert
          insertValues.push([
            level.ids_level,
            modul.ids_modul,
            level.tingkat <= 4 ? modul.aksi : 'read,single',
            1, // created_by
          ]);
          count_create++;
        } else if (level.tingkat <= 3) {
          // Prepare for bulk update
          updateCases.push(`WHEN ids_level = ? AND ids_modul = ? THEN ?`);
          updateParams.push(level.ids_level, modul.ids_modul, modul.aksi);
          count_update++;
        }
      }
    }

    // Execute bulk insert if there are records to insert
    if (insertValues.length > 0) {
      const placeholders = insertValues.map(() => '(?, ?, ?, ?)').join(',');
      await helper
        .runSQL({
          sql: `INSERT INTO tbs_hak_akses (ids_level, ids_modul, permission, created_by) VALUES ${placeholders}`,
          param: insertValues.flat(),
        })
        .catch(error => {
          console.error('Error during bulk insert:', error);
          throw error;
        });
    }

    // Execute bulk update if there are records to update
    if (updateCases.length > 0) {
      const caseStatement = updateCases.join(' ');
      await helper
        .runSQL({
          sql: `UPDATE tbs_hak_akses SET permission = CASE ${caseStatement} END WHERE (ids_level, ids_modul) IN (${updateCases
            .map(() => '(?, ?)')
            .join(', ')})`,
          param: [...updateParams, ...updateParams.filter((_, i) => i % 3 < 2)],
        })
        .catch(error => {
          console.error('Error during bulk update:', error);
          throw error;
        });
    }

    const message = 'Auto create default hak akses successfully.';
    const json = {
      created: count_create,
      updated: count_update,
    };
    return response.sc200(message, json, res);
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

/* Event - Create Settings */
Controller.cj2 = async (req, res) => {
  try {
    let count_create = 0;
    const insertValues = [];

    // Ambil semua event dengan status DITERIMA
    const eventList = await helper.runSQL({
      sql: "SELECT id_event, tgl_awal_acara, tgl_akhir_acara FROM tbl_event WHERE status = 'DITERIMA'",
      param: [],
    });

    if (eventList.length === 0) {
      return response.sc200('Tidak ada event dengan status DITERIMA.', { created: 0 }, res);
    }

    // Ambil semua setting yang sudah ada
    const existingSettings = await helper.runSQL({
      sql: `SELECT id_event, nama_setting FROM tbl_setting WHERE id_event IN (${eventList
        .map(() => '?')
        .join(',')})`,
      param: eventList.map(e => e.id_event),
    });
    const settingsMap = new Set(existingSettings.map(row => `${row.id_event}-${row.nama_setting}`));

    // Durasi fleksibel (modify sesuai kebutuhan)
    const DURATIONS = {
      awal_akses: { months: -1 },
      akhir_akses: { months: 1 },
      awal_pendaftaran: { weeks: -1 },
      akhir_pendaftaran: { days: -1 },
    };

    for (const event of eventList) {
      // Pastikan format dan zona waktu ke Asia/Jakarta (GMT+7)
      const baseStart = moment.tz(event.tgl_awal_acara, 'Asia/Jakarta').startOf('day');
      const baseEnd = moment.tz(event.tgl_akhir_acara, 'Asia/Jakarta').startOf('day');

      // Kalkulasi tanggal setting sesuai format dan request
      const settings = {
        'Token Whatsapp': 'token-fonnte',
        'Metode Pembayaran': 'Masukkan metode pembayaran di sini',
        'Jumlah Sertifikat': '0',
        'Nomor Sertifikat': 'Masukkan nomor sertifikat di sini',
        'Tanggal Sertifikat': baseStart.format('YYYY-MM-DD'),
        'Tanggal Awal Akses': baseStart
          .clone()
          .add(DURATIONS.awal_akses.months, 'month')
          .format('YYYY-MM-DD'),
        'Tanggal Akhir Akses': baseEnd
          .clone()
          .add(DURATIONS.akhir_akses.months, 'month')
          .format('YYYY-MM-DD'),
        'Tanggal Awal Pendaftaran': baseStart
          .clone()
          .add(DURATIONS.awal_pendaftaran.weeks, 'week')
          .format('YYYY-MM-DD'),
        'Tanggal Akhir Pendaftaran': baseEnd
          .clone()
          .add(DURATIONS.akhir_pendaftaran.days, 'day')
          .format('YYYY-MM-DD'),
        'Tanggal Awal Penilaian': baseStart.format('YYYY-MM-DD'),
        'Tanggal Akhir Penilaian': baseEnd.format('YYYY-MM-DD'),
      };

      for (const [nama_setting, setting_value] of Object.entries(settings)) {
        const key = `${event.id_event}-${nama_setting}`;
        if (!settingsMap.has(key)) {
          insertValues.push([
            event.id_event,
            nama_setting,
            setting_value,
            1, // created_by
          ]);
          count_create++;
        }
      }
    }

    // Bulk insert jika ada setting baru
    if (insertValues.length > 0) {
      const placeholders = insertValues.map(() => '(?, ?, ?, ?)').join(',');
      await helper
        .runSQL({
          sql: `INSERT INTO tbl_setting (id_event, nama_setting, setting, created_by) VALUES ${placeholders}`,
          param: insertValues.flat(),
        })
        .catch(error => {
          console.error('Terjadi error pada bulk insert:', error);
          throw error;
        });
    }

    return response.sc200('Auto create settings selesai.', { created: count_create }, res);
  } catch (error) {
    console.log(error);
    logger.error(error);
    return response.sc500('Terjadi kesalahan sistem, silakan coba ulang.', {}, res);
  }
};

/* Event - Create Penjurian Pohon Bonsai */
Controller.cj3 = async (req, res) => {
  try {
    let count_create = 0;
    let count_update = 0;
    const insertValues = [];

    // Daftar kode kelas yang dikecualikan dari penjurian (dinamis)
    const excludedClasses = ['A1', 'C1']; // A1 = Bahan, C1 = Bintang

    // Bisa ditambahkan kelas lain di sini jika diperlukan, contoh:
    // const excludedClasses = ['A1', 'C1', 'B1', 'B2'];

    // Ambil semua data juri dan formulir dengan JOIN untuk mendapatkan pasangan yang perlu diproses
    // Tambahkan filter untuk mengecualikan kelas tertentu
    const juriFormulirPairs = await helper.runSQL({
      sql: `SELECT DISTINCT
              j.id_juri,
              j.id_profile,
              j.id_event,
              f.id_formulir
            FROM tbl_juri j
            INNER JOIN tbl_formulir f ON j.id_event = f.id_event
            INNER JOIN tbl_kategori k ON f.id_kategori = k.id_kategori
            INNER JOIN tbs_kelas tk ON k.ids_kelas = tk.ids_kelas
            WHERE j.penilaian = 'BELUM' AND id_pohon IS NOT NULL AND bayar = 'SUDAH'
              AND tk.kode NOT IN (${excludedClasses.map(() => '?').join(',')})
            ORDER BY j.id_juri, f.id_formulir`,
      param: excludedClasses,
    });

    if (juriFormulirPairs.length === 0) {
      return response.sc200(
        'No pending jury assessments found.',
        {
          created: 0,
          updated: 0,
        },
        res
      );
    }

    // Ambil semua penilaian yang sudah ada untuk menghindari duplikasi
    const existingPenilaian = await helper.runSQL({
      sql: `SELECT id_formulir, id_profile FROM tbl_penilaian`,
      param: [],
    });

    // Buat Set untuk lookup cepat penilaian yang sudah ada
    const existingPenilaianSet = new Set(
      existingPenilaian.map(row => `${row.id_formulir}-${row.id_profile}`)
    );

    // Kumpulkan id_juri yang unik untuk diupdate statusnya nanti
    const uniqueJuriIds = new Set();

    // Proses setiap pasangan juri-formulir
    for (const pair of juriFormulirPairs) {
      const key = `${pair.id_formulir}-${pair.id_profile}`;

      // Hanya INSERT jika belum ada penilaian untuk kombinasi formulir-juri ini
      if (!existingPenilaianSet.has(key)) {
        insertValues.push([
          pair.id_formulir, // id_formulir
          pair.id_profile, // id_profile (juri)
          0.0, // penampilan (default 0)
          0.0, // gerak_dasar (default 0)
          0.0, // keserasian (default 0)
          0.0, // kematangan (default 0)
          null, // keterangan (default null)
          1, // created_by
        ]);
        count_create++;

        // Kumpulkan id_juri untuk update status
        uniqueJuriIds.add(pair.id_juri);
      }
    }

    // Proses Bulk Insert jika ada data yang perlu diinsert
    if (insertValues.length > 0) {
      const placeholders = insertValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',');
      await helper
        .runSQL({
          sql: `INSERT INTO tbl_penilaian (id_formulir, id_profile, penampilan, gerak_dasar, keserasian, kematangan, keterangan, created_by) VALUES ${placeholders}`,
          param: insertValues.flat(),
        })
        .catch(error => {
          console.error('Error during bulk insert:', error);
          throw error;
        });

      // Update status penilaian juri menjadi 'SUDAH' untuk juri yang sudah dibuatkan form penilaiannya
      if (uniqueJuriIds.size > 0) {
        const juriIdsArray = Array.from(uniqueJuriIds);
        const juriPlaceholders = juriIdsArray.map(() => '?').join(',');

        const updateResult = await helper
          .runSQL({
            sql: `UPDATE tbl_juri SET penilaian = 'SUDAH', updated_by = 1, updated_at = NOW() WHERE id_juri IN (${juriPlaceholders})`,
            param: juriIdsArray,
          })
          .catch(error => {
            console.error('Error during juri status update:', error);
            throw error;
          });

        count_update = updateResult.affectedRows || juriIdsArray.length;
      }
    }

    return response.sc200(
      'Auto create default penjurian successfully.',
      {
        created: count_create,
        updated: count_update,
        excluded_classes: excludedClasses,
        message: `${count_create} penilaian forms created, ${count_update} jury status updated. Excluded classes: ${excludedClasses.join(
          ', '
        )}`,
      },
      res
    );
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

/* Formulir - Akumulasi Penilaian Pohon Bonsai */
Controller.cj4 = async (req, res) => {
  try {
    let count_processed = 0;
    const updateFormulirValues = [];

    // Ambil hanya formulir BONSAI yang sudah memiliki penilaian
    const formulirList = await helper.runSQL({
      sql: `SELECT DISTINCT f.id_formulir FROM tbl_formulir f
            WHERE f.id_pohon IS NOT NULL AND f.sync = 0
            AND EXISTS (SELECT 1 FROM tbl_penilaian p WHERE p.id_formulir = f.id_formulir)`,
      param: [],
    });

    if (formulirList.length === 0) {
      return response.sc200('No bonsai formulir with assessments found.', { processed: 0 }, res);
    }

    // Proses setiap formulir bonsai
    for (const formulir of formulirList) {
      const bonsaiAssessments = await helper.runSQL({
        sql: `SELECT penampilan, gerak_dasar, keserasian, kematangan
              FROM view_penilaian_pohon
              WHERE id_formulir = ?`,
        param: [formulir.id_formulir],
      });

      if (bonsaiAssessments.length >= 3) {
        // Ekstrak nilai untuk setiap kriteria
        const penampilanScores = bonsaiAssessments.map(a => parseFloat(a.penampilan));
        const gerakDasarScores = bonsaiAssessments.map(a => parseFloat(a.gerak_dasar));
        const keserasianScores = bonsaiAssessments.map(a => parseFloat(a.keserasian));
        const kematanganScores = bonsaiAssessments.map(a => parseFloat(a.kematangan));

        let totalPenampilan, totalGerakDasar, totalKeserasian, totalKematangan;

        if (bonsaiAssessments.length === 3) {
          // Untuk 3 juri atau lainnya: langsung rata-ratakan
          totalPenampilan = calculateAverage(penampilanScores);
          totalGerakDasar = calculateAverage(gerakDasarScores);
          totalKeserasian = calculateAverage(keserasianScores);
          totalKematangan = calculateAverage(kematanganScores);
        } else {
          // Untuk lebih dari 3 juri: buang nilai tertinggi dan terendah, lalu rata-rata sisanya
          totalPenampilan = calculateAverageRemoveExtremes(penampilanScores);
          totalGerakDasar = calculateAverageRemoveExtremes(gerakDasarScores);
          totalKeserasian = calculateAverageRemoveExtremes(keserasianScores);
          totalKematangan = calculateAverageRemoveExtremes(kematanganScores);
        }

        // Total akhir = jumlah semua rata-rata kriteria
        const finalScore = totalPenampilan + totalGerakDasar + totalKeserasian + totalKematangan;

        // Tentukan kriteria berdasarkan skor final
        let kriteria = 'D';
        if (finalScore >= 321 && finalScore <= 400) {
          kriteria = 'A';
        } else if (finalScore >= 281 && finalScore <= 320) {
          kriteria = 'B';
        } else if (finalScore >= 241 && finalScore <= 280) {
          kriteria = 'C';
        }

        updateFormulirValues.push({
          id_formulir: formulir.id_formulir,
          penampilan: totalPenampilan,
          gerak_dasar: totalGerakDasar,
          keserasian: totalKeserasian,
          kematangan: totalKematangan,
          total: finalScore,
          kriteria: kriteria,
        });
        count_processed++;
      }
    }

    // Update database dengan hasil akumulasi bonsai
    for (const updateData of updateFormulirValues) {
      await helper
        .runSQL({
          sql: `UPDATE tbl_formulir SET penampilan = ?, gerak_dasar = ?, keserasian = ?, kematangan = ?, kriteria = ?, sync = 1 WHERE id_formulir = ?`,
          param: [
            updateData.penampilan,
            updateData.gerak_dasar,
            updateData.keserasian,
            updateData.kematangan,
            updateData.kriteria,
            updateData.id_formulir,
          ],
        })
        .catch(error => {
          console.error('Error updating bonsai formulir:', error);
          throw error;
        });
    }

    return response.sc200(
      'Auto accumulation of bonsai assessments completed successfully.',
      {
        processed: count_processed,
      },
      res
    );
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

/* Formulir - Akumulasi Penilaian Suiseki Tahap 1 */
Controller.cj5 = async (req, res) => {
  try {
    let count_processed = 0;
    const updateFormulirValues = [];

    // Ambil hanya formulir SUISEKI yang sudah memiliki penilaian tahap 1
    const formulirList = await helper.runSQL({
      sql: `SELECT DISTINCT f.id_formulir, f.keterangan, f.kriteria
            FROM tbl_formulir f
            WHERE f.id_suiseki IS NOT NULL AND f.sync = 0
            AND EXISTS (SELECT 1 FROM tbl_penilaian p WHERE p.id_formulir = f.id_formulir AND p.tahapan = 1)`,
      param: [],
    });

    if (formulirList.length === 0) {
      return response.sc200(
        'No suiseki formulir with stage 1 assessments found.',
        { processed: 0 },
        res
      );
    }

    // Proses setiap formulir suiseki untuk tahap 1
    for (const formulir of formulirList) {
      const suisekiAssessments = await helper.runSQL({
        sql: `SELECT penampilan, keselarasan
              FROM view_penilaian_suiseki
              WHERE id_formulir = ? AND tahapan = 1`,
        param: [formulir.id_formulir],
      });

      if (suisekiAssessments.length >= 3) {
        // Ekstrak nilai untuk setiap kriteria
        const penampilanScores = suisekiAssessments.map(a => parseFloat(a.penampilan));
        const keselarasanScores = suisekiAssessments.map(a => parseFloat(a.keselarasan));

        // Hitung rata-rata langsung tanpa menghilangkan nilai ekstrem
        const totalPenampilan = calculateAverage(penampilanScores);
        const totalKeselarasan = calculateAverage(keselarasanScores);

        // Pembobotan: Penampilan 80%, Keselarasan 20%
        const finalScore = totalPenampilan * 0.8 + totalKeselarasan * 0.2;
        const finalScoreKiteria = (4 / 5) * totalPenampilan * 2 + (1 / 5) * totalKeselarasan * 2;

        // Tentukan kriteria tahap 1 berdasarkan skor final
        let kriteriaTahap1 = 'D';
        if (finalScoreKiteria >= 161 && finalScoreKiteria <= 200) {
          kriteriaTahap1 = 'A';
        } else if (finalScoreKiteria >= 141 && finalScoreKiteria <= 160) {
          kriteriaTahap1 = 'B';
        } else if (finalScoreKiteria >= 121 && finalScoreKiteria <= 140) {
          kriteriaTahap1 = 'C';
        }

        // Update keterangan untuk tahap 1
        const keteranganBaru = `Kriteria Tahapan 1 : ${kriteriaTahap1}`;

        updateFormulirValues.push({
          id_formulir: formulir.id_formulir,
          gerak_dasar: finalScore, // Tahap 1 disimpan di gerak_dasar
          keterangan: keteranganBaru,
          kriteria: kriteriaTahap1, // Kriteria sementara untuk tahap 1
        });
        count_processed++;
      }
    }

    // Update database dengan hasil akumulasi suiseki tahap 1
    for (const updateData of updateFormulirValues) {
      await helper
        .runSQL({
          sql: `UPDATE tbl_formulir SET gerak_dasar = ?, keterangan = ?, kriteria = ?, sync = 1 WHERE id_formulir = ?`,
          param: [
            updateData.gerak_dasar,
            updateData.keterangan,
            updateData.kriteria,
            updateData.id_formulir,
          ],
        })
        .catch(error => {
          console.error('Error updating suiseki formulir tahap 1:', error);
          throw error;
        });
    }

    return response.sc200(
      'Auto accumulation of suiseki stage 1 assessments completed successfully.',
      {
        processed: count_processed,
      },
      res
    );
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

/* Formulir - Akumulasi Penilaian Suiseki Tahap 2 */
Controller.cj6 = async (req, res) => {
  try {
    let count_processed = 0;
    const updateFormulirValues = [];

    // Ambil hanya formulir SUISEKI yang sudah memiliki penilaian tahap 2
    const formulirList = await helper.runSQL({
      sql: `SELECT DISTINCT f.id_formulir, f.keterangan, f.kriteria
            FROM tbl_formulir f
            WHERE f.id_suiseki IS NOT NULL AND f.sync = 1
            AND EXISTS (SELECT 1 FROM tbl_penilaian p WHERE p.id_formulir = f.id_formulir AND p.tahapan = 2)`,
      param: [],
    });

    if (formulirList.length === 0) {
      return response.sc200(
        'No suiseki formulir with stage 2 assessments found.',
        { processed: 0 },
        res
      );
    }

    // Proses setiap formulir suiseki untuk tahap 2
    for (const formulir of formulirList) {
      const suisekiAssessments = await helper.runSQL({
        sql: `SELECT penampilan, keselarasan
              FROM view_penilaian_suiseki
              WHERE id_formulir = ? AND tahapan = 2`,
        param: [formulir.id_formulir],
      });

      if (suisekiAssessments.length >= 3) {
        // Ekstrak nilai untuk setiap kriteria
        const penampilanScores = suisekiAssessments.map(a => parseFloat(a.penampilan));
        const keselarasanScores = suisekiAssessments.map(a => parseFloat(a.keselarasan));

        // Hitung rata-rata langsung tanpa menghilangkan nilai ekstrem
        const totalPenampilan = calculateAverage(penampilanScores);
        const totalKeselarasan = calculateAverage(keselarasanScores);

        // Pembobotan: Penampilan 80%, Keselarasan 20%
        const finalScore = totalPenampilan * 0.8 + totalKeselarasan * 0.2;
        const finalScoreKiteria = (4 / 5) * totalPenampilan * 2 + (1 / 5) * totalKeselarasan * 2;

        // Tentukan kriteria tahap 1 berdasarkan skor final
        let kriteriaTahap2 = 'D';
        if (finalScoreKiteria >= 161 && finalScoreKiteria <= 200) {
          kriteriaTahap2 = 'A';
        } else if (finalScoreKiteria >= 141 && finalScoreKiteria <= 160) {
          kriteriaTahap2 = 'B';
        } else if (finalScoreKiteria >= 121 && finalScoreKiteria <= 140) {
          kriteriaTahap2 = 'C';
        }

        // Update keterangan untuk tahap 2 (tambahkan ke keterangan yang sudah ada)
        let keteranganBaru = formulir.keterangan || '';
        if (keteranganBaru) {
          keteranganBaru += `, Kriteria Tahapan 2 : ${kriteriaTahap2}`;
        } else {
          keteranganBaru = `Kriteria Tahapan 2 : ${kriteriaTahap2}`;
        }

        updateFormulirValues.push({
          id_formulir: formulir.id_formulir,
          keserasian: finalScore, // Tahap 2 disimpan di keserasian
          keterangan: keteranganBaru,
          kriteria: kriteriaTahap2, // Kriteria sementara untuk tahap 2
        });
        count_processed++;
      }
    }

    // Update database dengan hasil akumulasi suiseki tahap 2
    for (const updateData of updateFormulirValues) {
      await helper
        .runSQL({
          sql: `UPDATE tbl_formulir SET keserasian = ?, keterangan = ?, kriteria = ?, sync = 2 WHERE id_formulir = ?`,
          param: [
            updateData.keserasian,
            updateData.keterangan,
            updateData.kriteria,
            updateData.id_formulir,
          ],
        })
        .catch(error => {
          console.error('Error updating suiseki formulir tahap 2:', error);
          throw error;
        });
    }

    return response.sc200(
      'Auto accumulation of suiseki stage 2 assessments completed successfully.',
      {
        processed: count_processed,
      },
      res
    );
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

/* Formulir - Akumulasi Penilaian Suiseki Tahap 3 */
Controller.cj7 = async (req, res) => {
  try {
    let count_processed = 0;
    const updateFormulirValues = [];

    // Ambil hanya formulir SUISEKI yang sudah memiliki penilaian tahap 3
    const formulirList = await helper.runSQL({
      sql: `SELECT DISTINCT f.id_formulir, f.keterangan, f.kriteria
            FROM tbl_formulir f
            WHERE f.id_suiseki IS NOT NULL AND f.sync = 2
            AND EXISTS (SELECT 1 FROM tbl_penilaian p WHERE p.id_formulir = f.id_formulir AND p.tahapan = 3)`,
      param: [],
    });

    if (formulirList.length === 0) {
      return response.sc200(
        'No suiseki formulir with stage 3 assessments found.',
        { processed: 0 },
        res
      );
    }

    // Proses setiap formulir suiseki untuk tahap 3
    for (const formulir of formulirList) {
      const suisekiAssessments = await helper.runSQL({
        sql: `SELECT penampilan, keselarasan
              FROM view_penilaian_suiseki
              WHERE id_formulir = ? AND tahapan = 3`,
        param: [formulir.id_formulir],
      });

      if (suisekiAssessments.length >= 3) {
        // Ekstrak nilai untuk setiap kriteria
        const penampilanScores = suisekiAssessments.map(a => parseFloat(a.penampilan));
        const keselarasanScores = suisekiAssessments.map(a => parseFloat(a.keselarasan));

        // Hitung rata-rata langsung tanpa menghilangkan nilai ekstrem
        const totalPenampilan = calculateAverage(penampilanScores);
        const totalKeselarasan = calculateAverage(keselarasanScores);

        // Pembobotan: Penampilan 80%, Keselarasan 20%
        const finalScore = totalPenampilan * 0.8 + totalKeselarasan * 0.2;
        const finalScoreKiteria = (4 / 5) * totalPenampilan * 2 + (1 / 5) * totalKeselarasan * 2;

        // Tentukan kriteria tahap 1 berdasarkan skor final
        let kriteriaTahap3 = 'D';
        if (finalScoreKiteria >= 161 && finalScoreKiteria <= 200) {
          kriteriaTahap3 = 'A';
        } else if (finalScoreKiteria >= 141 && finalScoreKiteria <= 160) {
          kriteriaTahap3 = 'B';
        } else if (finalScoreKiteria >= 121 && finalScoreKiteria <= 140) {
          kriteriaTahap3 = 'C';
        }

        // Update keterangan untuk tahap 3 (tambahkan ke keterangan yang sudah ada)
        let keteranganBaru = formulir.keterangan || '';
        if (keteranganBaru) {
          keteranganBaru += `, Kriteria Tahapan 3 : ${kriteriaTahap3}`;
        } else {
          keteranganBaru = `Kriteria Tahapan 3 : ${kriteriaTahap3}`;
        }

        updateFormulirValues.push({
          id_formulir: formulir.id_formulir,
          kematangan: finalScore, // Tahap 3 disimpan di kematangan
          keterangan: keteranganBaru,
          kriteria: kriteriaTahap3, // Kriteria akhir untuk tahap 3
        });
        count_processed++;
      }
    }

    // Update database dengan hasil akumulasi suiseki tahap 3
    for (const updateData of updateFormulirValues) {
      await helper
        .runSQL({
          sql: `UPDATE tbl_formulir SET kematangan = ?, keterangan = ?, kriteria = ?, sync = 3 WHERE id_formulir = ?`,
          param: [
            updateData.kematangan,
            updateData.keterangan,
            updateData.kriteria,
            updateData.id_formulir,
          ],
        })
        .catch(error => {
          console.error('Error updating suiseki formulir tahap 3:', error);
          throw error;
        });
    }

    return response.sc200(
      'Auto accumulation of suiseki stage 3 assessments completed successfully.',
      {
        processed: count_processed,
      },
      res
    );
  } catch (error) {
    console.log(error);
    return handleError(error, res);
  }
};

module.exports = Controller;

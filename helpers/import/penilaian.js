/* Libraries */
const XLSX = require('xlsx');
const fs = require('fs');
const Validator = require('validator');
/* Helpers */
const helper = require('../helper');
const isEmpty = require('../../validation/is-empty');

const PenilaianImportService = {};

PenilaianImportService.preview = async req => {
  try {
    const { id_event } = req.body;

    // Validasi menggunakan Validator
    if (isEmpty(id_event) || !Validator.isInt(String(id_event), { min: 1 })) {
      throw {
        code: 400,
        message: 'ID Event harus dipilih dan berupa angka positif',
      };
    }

    if (!req.file) {
      throw {
        code: 400,
        message: 'File Excel harus diupload',
      };
    }

    // Baca file Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw {
        code: 400,
        message: 'File Excel kosong',
      };
    }

    // Dapatkan informasi event
    const eventInfo = await helper.runSQL({
      sql: `
        SELECT e.*
        FROM tbl_event e
        WHERE e.id_event = ?
      `,
      param: [id_event],
    });

    if (eventInfo.length === 0) {
      throw {
        code: 400,
        message: 'Event tidak ditemukan',
      };
    }

    const event = eventInfo[0];

    // Dapatkan semua juri yang terdaftar di event ini
    const semuaJuri = await helper.runSQL({
      sql: `
        SELECT
          j.id_juri,
          j.id_profile,
          p.nama_lengkap
        FROM tbl_juri j
        INNER JOIN tbl_profile p ON j.id_profile = p.id_profile
        WHERE j.id_event = ?
      `,
      param: [id_event],
    });

    if (semuaJuri.length === 0) {
      throw {
        code: 400,
        message: 'Tidak ada juri yang terdaftar untuk event ini',
      };
    }

    const results = {
      total_data: data.length,
      total_juri: semuaJuri.length,
      valid_data: 0,
      invalid_data: 0,
      data: [],
      id_event: id_event,
      event_info: {
        nama_acara: event.nama_acara,
        id_event: event.id_event,
      },
      daftar_juri: semuaJuri,
    };

    // Validasi setiap baris data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const no_juri = row['no_juri'] || '';
      const id_profile_juri = row['id_profile_juri'] || '';

      const validationResult = await PenilaianImportService.validateRow({
        no_juri,
        id_profile_juri,
        id_event,
        row_data: row,
        semua_juri: semuaJuri,
      });

      results.data.push({
        row_number: i + 2,
        no_juri,
        id_profile_juri,
        ...validationResult,
      });

      if (validationResult.status === 'VALID') {
        results.valid_data++;
      } else {
        results.invalid_data++;
      }
    }

    // Hapus file temporary
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return results;
  } catch (error) {
    // Hapus file temporary jika ada error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
};

PenilaianImportService.process = async req => {
  try {
    const { id_event } = req.body;

    // Validasi menggunakan Validator
    if (isEmpty(id_event) || !Validator.isInt(String(id_event), { min: 1 })) {
      throw {
        code: 400,
        message: 'ID Event harus dipilih dan berupa angka positif',
      };
    }

    if (!req.file) {
      throw {
        code: 400,
        message: 'File Excel harus diupload',
      };
    }

    // Baca file Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw {
        code: 400,
        message: 'File Excel kosong',
      };
    }

    // Dapatkan informasi event
    const eventInfo = await helper.runSQL({
      sql: `
        SELECT e.*
        FROM tbl_event e
        WHERE e.id_event = ?
      `,
      param: [id_event],
    });

    if (eventInfo.length === 0) {
      throw {
        code: 400,
        message: 'Event tidak ditemukan',
      };
    }

    const event = eventInfo[0];

    // Dapatkan semua juri yang terdaftar di event ini
    const semuaJuri = await helper.runSQL({
      sql: `
        SELECT
          j.id_juri,
          j.id_profile,
          p.nama_lengkap
        FROM tbl_juri j
        INNER JOIN tbl_profile p ON j.id_profile = p.id_profile
        WHERE j.id_event = ?
      `,
      param: [id_event],
    });

    if (semuaJuri.length === 0) {
      throw {
        code: 400,
        message: 'Tidak ada juri yang terdaftar untuk event ini',
      };
    }

    const results = {
      total_data: data.length,
      total_juri: semuaJuri.length,
      total_penilaian_diproses: 0,
      success_data: 0,
      failed_data: 0,
      details: [],
      id_event: id_event,
      event_info: {
        nama_acara: event.nama_acara,
        id_event: event.id_event,
      },
    };

    // Proses setiap baris data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const no_juri = row['no_juri'] || '';
      const id_profile_juri = row['id_profile_juri'] || '';

      try {
        const validationResult = await PenilaianImportService.validateRow({
          no_juri,
          id_profile_juri,
          id_event,
          row_data: row,
          semua_juri: semuaJuri,
        });

        if (validationResult.status === 'VALID') {
          let saveResults;

          if (validationResult.mode === 'spesifik') {
            // Simpan data penilaian untuk juri spesifik
            saveResults = await PenilaianImportService.savePenilaianUntukJuriSpesifik({
              id_formulir: validationResult.id_formulir,
              juri_spesifik: validationResult.juri_spesifik,
              penampilan: validationResult.penampilan,
              gerak_dasar: validationResult.gerak_dasar,
              keserasian: validationResult.keserasian,
              kematangan: validationResult.kematangan,
              tahapan: validationResult.tahapan,
              created_by: req.authIdUser,
            });
          } else {
            // Simpan data penilaian untuk SEMUA juri
            saveResults = await PenilaianImportService.savePenilaianUntukSemuaJuri({
              id_formulir: validationResult.id_formulir,
              semua_juri: validationResult.semua_juri_processed,
              penampilan: validationResult.penampilan,
              gerak_dasar: validationResult.gerak_dasar,
              keserasian: validationResult.keserasian,
              kematangan: validationResult.kematangan,
              tahapan: validationResult.tahapan,
              created_by: req.authIdUser,
            });
          }

          results.total_penilaian_diproses += saveResults.total_diproses;
          results.success_data++;
          results.details.push({
            row_number: i + 2,
            no_juri,
            id_profile_juri,
            mode: validationResult.mode,
            status: 'SUCCESS',
            message: saveResults.message,
            id_formulir: validationResult.id_formulir,
            detail_juri: saveResults.detail_juri,
          });
        } else {
          results.failed_data++;
          results.details.push({
            row_number: i + 2,
            no_juri,
            id_profile_juri,
            status: 'FAILED',
            message: validationResult.message,
          });
        }
      } catch (error) {
        results.failed_data++;
        results.details.push({
          row_number: i + 2,
          no_juri,
          id_profile_juri,
          status: 'FAILED',
          message: error.message || 'Terjadi kesalahan saat memproses data',
        });
      }
    }

    // Hapus file temporary
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return results;
  } catch (error) {
    // Hapus file temporary jika ada error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
};

PenilaianImportService.validateRow = async data => {
  const { no_juri, id_profile_juri, id_event, row_data, semua_juri } = data;

  // Validasi no_juri wajib menggunakan Validator
  if (isEmpty(no_juri)) {
    return {
      status: 'INVALID',
      message: 'No Juri wajib diisi',
    };
  }

  if (!Validator.isLength(no_juri, { min: 1, max: 20 })) {
    return {
      status: 'INVALID',
      message: 'No Juri harus antara 1-20 karakter',
    };
  }

  try {
    // Cari formulir berdasarkan no_juri DAN id_event
    const formulir = await helper.runSQL({
      sql: `
        SELECT
          f.id_formulir,
          f.no_juri,
          f.id_event
        FROM tbl_formulir f
        WHERE f.no_juri = ? AND f.id_event = ?
      `,
      param: [no_juri, id_event],
    });

    if (formulir.length === 0) {
      return {
        status: 'INVALID',
        message: `Formulir dengan no juri ${no_juri} tidak ditemukan untuk event ini`,
      };
    }

    const form = formulir[0];

    // Proses nilai dengan default values
    const penampilan = !isEmpty(row_data['penampilan']) ? parseFloat(row_data['penampilan']) : 0;
    const gerak_dasar = !isEmpty(row_data['gerak_dasar']) ? parseFloat(row_data['gerak_dasar']) : 0;
    const keserasian = !isEmpty(row_data['keserasian/keselarasan'])
      ? parseFloat(row_data['keserasian/keselarasan'])
      : 0;
    const kematangan = !isEmpty(row_data['kematangan']) ? parseFloat(row_data['kematangan']) : 0;
    const tahapan = !isEmpty(row_data['tahapan']) ? parseInt(row_data['tahapan']) : null;

    // Validasi nilai numerik
    if (
      !Validator.isFloat(String(penampilan), { min: 0, max: 100 }) ||
      !Validator.isFloat(String(gerak_dasar), { min: 0, max: 100 }) ||
      !Validator.isFloat(String(keserasian), { min: 0, max: 100 }) ||
      !Validator.isFloat(String(kematangan), { min: 0, max: 100 })
    ) {
      return {
        status: 'INVALID',
        message: 'Nilai penampilan, gerak_dasar, keserasian, kematangan harus antara 0-100',
      };
    }

    // Validasi tahapan
    if (tahapan !== null && !Validator.isInt(String(tahapan), { min: 1, max: 3 })) {
      return {
        status: 'INVALID',
        message: 'Tahapan harus antara 1-3 atau dikosongkan',
      };
    }

    // Tentukan mode: spesifik juri atau semua juri
    if (!isEmpty(id_profile_juri)) {
      // MODE SPESIFIK: Cari juri berdasarkan id_profile_juri
      const juriSpesifik = semua_juri.find(j => String(j.id_profile) === String(id_profile_juri));

      if (!juriSpesifik) {
        return {
          status: 'INVALID',
          message: `Juri dengan id_profile ${id_profile_juri} tidak ditemukan untuk event ini`,
        };
      }

      // PERBAIKAN: Cek apakah penilaian sudah ada berdasarkan id_formulir, id_profile, dan tahapan
      let existingQuery = `
        SELECT id_penilaian
        FROM tbl_penilaian
        WHERE id_formulir = ? AND id_profile = ?
      `;
      let existingParams = [form.id_formulir, juriSpesifik.id_profile];

      // Handle tahapan (bisa null atau nilai)
      if (tahapan === null) {
        existingQuery += ` AND (tahapan IS NULL OR tahapan = '')`;
      } else {
        existingQuery += ` AND tahapan = ?`;
        existingParams.push(tahapan);
      }

      const existing = await helper.runSQL({
        sql: existingQuery,
        param: existingParams,
      });

      const isExisting = existing.length > 0;

      return {
        status: 'VALID',
        mode: 'spesifik',
        message: isExisting
          ? `Data akan diupdate untuk juri ${juriSpesifik.nama_lengkap}`
          : `Data akan disimpan baru untuk juri ${juriSpesifik.nama_lengkap}`,
        id_formulir: form.id_formulir,
        penampilan,
        gerak_dasar,
        keserasian,
        kematangan,
        tahapan,
        juri_spesifik: {
          id_juri: juriSpesifik.id_juri,
          id_profile: juriSpesifik.id_profile,
          nama_juri: juriSpesifik.nama_lengkap,
          is_existing: isExisting,
          existing_id: isExisting ? existing[0].id_penilaian : null,
        },
      };
    } else {
      // MODE SEMUA JURI: Siapkan data untuk semua juri
      const semua_juri_processed = [];
      let total_existing = 0;
      let total_new = 0;

      for (const juri of semua_juri) {
        // PERBAIKAN: Cek apakah penilaian sudah ada berdasarkan id_formulir, id_profile, dan tahapan
        let existingQuery = `
          SELECT id_penilaian
          FROM tbl_penilaian
          WHERE id_formulir = ? AND id_profile = ?
        `;
        let existingParams = [form.id_formulir, juri.id_profile];

        // Handle tahapan (bisa null atau nilai)
        if (tahapan === null) {
          existingQuery += ` AND (tahapan IS NULL OR tahapan = '')`;
        } else {
          existingQuery += ` AND tahapan = ?`;
          existingParams.push(tahapan);
        }

        const existing = await helper.runSQL({
          sql: existingQuery,
          param: existingParams,
        });

        const isExisting = existing.length > 0;

        if (isExisting) {
          total_existing++;
        } else {
          total_new++;
        }

        semua_juri_processed.push({
          id_juri: juri.id_juri,
          id_profile: juri.id_profile,
          nama_juri: juri.nama_lengkap,
          is_existing: isExisting,
          existing_id: isExisting ? existing[0].id_penilaian : null,
        });
      }

      return {
        status: 'VALID',
        mode: 'semua',
        message: `Akan dibuat ${total_new} penilaian baru dan diupdate ${total_existing} penilaian yang sudah ada untuk ${semua_juri.length} juri`,
        id_formulir: form.id_formulir,
        penampilan,
        gerak_dasar,
        keserasian,
        kematangan,
        tahapan,
        semua_juri_processed,
        summary: {
          total_juri: semua_juri.length,
          total_new,
          total_existing,
        },
      };
    }
  } catch (error) {
    return {
      status: 'INVALID',
      message: `Error validasi: ${error.message}`,
    };
  }
};

PenilaianImportService.savePenilaianUntukJuriSpesifik = async data => {
  const {
    id_formulir,
    juri_spesifik,
    penampilan,
    gerak_dasar,
    keserasian,
    kematangan,
    tahapan,
    created_by,
  } = data;

  const results = {
    total_diproses: 1,
    message: '',
    detail_juri: [],
  };

  try {
    if (juri_spesifik.is_existing && juri_spesifik.existing_id) {
      // PERBAIKAN: Update existing data dengan kondisi yang lebih spesifik
      await helper.runSQL({
        sql: `
          UPDATE tbl_penilaian
          SET penampilan = ?, gerak_dasar = ?, keserasian = ?, kematangan = ?,
              tahapan = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id_penilaian = ?
        `,
        param: [
          penampilan,
          gerak_dasar,
          keserasian,
          kematangan,
          tahapan,
          created_by,
          juri_spesifik.existing_id,
        ],
      });

      results.message = `Berhasil mengupdate penilaian untuk juri ${juri_spesifik.nama_juri}`;
      results.detail_juri.push({
        id_juri: juri_spesifik.id_juri,
        nama_juri: juri_spesifik.nama_juri,
        status: 'UPDATED',
        id_penilaian: juri_spesifik.existing_id,
      });
    } else {
      // PERBAIKAN: Insert new data dengan pengecean duplikat
      // Cek sekali lagi untuk memastikan tidak ada duplikat
      let checkQuery = `
        SELECT id_penilaian
        FROM tbl_penilaian
        WHERE id_formulir = ? AND id_profile = ?
      `;
      let checkParams = [id_formulir, juri_spesifik.id_profile];

      if (tahapan === null) {
        checkQuery += ` AND (tahapan IS NULL OR tahapan = '')`;
      } else {
        checkQuery += ` AND tahapan = ?`;
        checkParams.push(tahapan);
      }

      const finalCheck = await helper.runSQL({
        sql: checkQuery,
        param: checkParams,
      });

      if (finalCheck.length > 0) {
        // Jika ternyata ada data, lakukan update
        await helper.runSQL({
          sql: `
            UPDATE tbl_penilaian
            SET penampilan = ?, gerak_dasar = ?, keserasian = ?, kematangan = ?,
                updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id_penilaian = ?
          `,
          param: [
            penampilan,
            gerak_dasar,
            keserasian,
            kematangan,
            created_by,
            finalCheck[0].id_penilaian,
          ],
        });

        results.message = `Berhasil mengupdate penilaian untuk juri ${juri_spesifik.nama_juri} (duplikat terdeteksi)`;
        results.detail_juri.push({
          id_juri: juri_spesifik.id_juri,
          nama_juri: juri_spesifik.nama_juri,
          status: 'UPDATED',
          id_penilaian: finalCheck[0].id_penilaian,
        });
      } else {
        // Insert new data
        const insertResult = await helper.runSQL({
          sql: `
            INSERT INTO tbl_penilaian
              (id_formulir, id_profile, penampilan, gerak_dasar, keserasian, kematangan, tahapan, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          param: [
            id_formulir,
            juri_spesifik.id_profile,
            penampilan,
            gerak_dasar,
            keserasian,
            kematangan,
            tahapan,
            created_by,
            created_by,
          ],
        });

        results.message = `Berhasil membuat penilaian baru untuk juri ${juri_spesifik.nama_juri}`;
        results.detail_juri.push({
          id_juri: juri_spesifik.id_juri,
          nama_juri: juri_spesifik.nama_juri,
          status: 'CREATED',
          id_penilaian: insertResult.insertId,
        });
      }
    }
  } catch (error) {
    results.message = `Gagal memproses penilaian untuk juri ${juri_spesifik.nama_juri}: ${error.message}`;
    results.detail_juri.push({
      id_juri: juri_spesifik.id_juri,
      nama_juri: juri_spesifik.nama_juri,
      status: 'FAILED',
      error: error.message,
    });
  }

  return results;
};

PenilaianImportService.savePenilaianUntukSemuaJuri = async data => {
  const {
    id_formulir,
    semua_juri,
    penampilan,
    gerak_dasar,
    keserasian,
    kematangan,
    tahapan,
    created_by,
  } = data;

  const results = {
    total_diproses: 0,
    total_success: 0,
    total_failed: 0,
    message: '',
    detail_juri: [],
  };

  for (const juri of semua_juri) {
    try {
      if (juri.is_existing && juri.existing_id) {
        // Update existing data
        await helper.runSQL({
          sql: `
            UPDATE tbl_penilaian
            SET penampilan = ?, gerak_dasar = ?, keserasian = ?, kematangan = ?,
                tahapan = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id_penilaian = ?
          `,
          param: [
            penampilan,
            gerak_dasar,
            keserasian,
            kematangan,
            tahapan,
            created_by,
            juri.existing_id,
          ],
        });

        results.detail_juri.push({
          id_juri: juri.id_juri,
          nama_juri: juri.nama_juri,
          status: 'UPDATED',
          id_penilaian: juri.existing_id,
        });
      } else {
        // PERBAIKAN: Cek sekali lagi untuk memastikan tidak ada duplikat sebelum insert
        let checkQuery = `
          SELECT id_penilaian
          FROM tbl_penilaian
          WHERE id_formulir = ? AND id_profile = ?
        `;
        let checkParams = [id_formulir, juri.id_profile];

        if (tahapan === null) {
          checkQuery += ` AND (tahapan IS NULL OR tahapan = '')`;
        } else {
          checkQuery += ` AND tahapan = ?`;
          checkParams.push(tahapan);
        }

        const finalCheck = await helper.runSQL({
          sql: checkQuery,
          param: checkParams,
        });

        if (finalCheck.length > 0) {
          // Jika ternyata ada data, lakukan update
          await helper.runSQL({
            sql: `
              UPDATE tbl_penilaian
              SET penampilan = ?, gerak_dasar = ?, keserasian = ?, kematangan = ?,
                  updated_by = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id_penilaian = ?
            `,
            param: [
              penampilan,
              gerak_dasar,
              keserasian,
              kematangan,
              created_by,
              finalCheck[0].id_penilaian,
            ],
          });

          results.detail_juri.push({
            id_juri: juri.id_juri,
            nama_juri: juri.nama_juri,
            status: 'UPDATED',
            id_penilaian: finalCheck[0].id_penilaian,
          });
        } else {
          // Insert new data
          const insertResult = await helper.runSQL({
            sql: `
              INSERT INTO tbl_penilaian
                (id_formulir, id_profile, penampilan, gerak_dasar, keserasian, kematangan, tahapan, created_by, updated_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            param: [
              id_formulir,
              juri.id_profile,
              penampilan,
              gerak_dasar,
              keserasian,
              kematangan,
              tahapan,
              created_by,
              created_by,
            ],
          });

          results.detail_juri.push({
            id_juri: juri.id_juri,
            nama_juri: juri.nama_juri,
            status: 'CREATED',
            id_penilaian: insertResult.insertId,
          });
        }
      }

      results.total_success++;
      results.total_diproses++;
    } catch (error) {
      results.total_failed++;
      results.total_diproses++;
      results.detail_juri.push({
        id_juri: juri.id_juri,
        nama_juri: juri.nama_juri,
        status: 'FAILED',
        error: error.message,
      });
    }
  }

  results.message = `Berhasil memproses ${results.total_success} penilaian dari ${results.total_diproses} juri (${results.total_failed} gagal)`;

  return results;
};

module.exports = PenilaianImportService;

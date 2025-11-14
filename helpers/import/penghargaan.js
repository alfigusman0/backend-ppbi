/* Libraries */
const XLSX = require('xlsx');
const fs = require('fs');
const Validator = require('validator');
/* Helpers */
const helper = require('../helper');
const isEmpty = require('../../validation/is-empty');

const PenghargaanImportService = {};

PenghargaanImportService.preview = async req => {
  try {
    const { id_juara } = req.body;

    // Validasi menggunakan Validator
    if (isEmpty(id_juara) || !Validator.isInt(String(id_juara), { min: 1 })) {
      throw {
        code: 400,
        message: 'ID Juara harus dipilih dan berupa angka positif',
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

    // Dapatkan informasi juara termasuk id_event
    const juaraInfo = await helper.runSQL({
      sql: `
        SELECT j.*, e.nama_acara
        FROM tbl_juara j
        INNER JOIN tbl_event e ON j.id_event = e.id_event
        WHERE j.id_juara = ?
      `,
      param: [id_juara],
    });

    if (juaraInfo.length === 0) {
      throw {
        code: 400,
        message: 'Juara tidak ditemukan',
      };
    }

    const juara = juaraInfo[0];
    const id_event_juara = juara.id_event;

    const results = {
      total_data: data.length,
      valid_data: 0,
      invalid_data: 0,
      data: [],
      id_juara: id_juara,
      juara_info: {
        nama_juara: juara.nama_juara,
        nama_acara: juara.nama_acara,
        id_event: juara.id_event,
      },
    };

    // Validasi setiap baris data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const no_juri = row['no_juri'] || row['nomor_juri'] || '';

      const validationResult = await PenghargaanImportService.validateRow({
        no_juri,
        id_juara,
        id_event_juara,
      });

      results.data.push({
        row_number: i + 2,
        no_juri,
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

PenghargaanImportService.process = async req => {
  try {
    const { id_juara } = req.body;

    // Validasi menggunakan Validator
    if (isEmpty(id_juara) || !Validator.isInt(String(id_juara), { min: 1 })) {
      throw {
        code: 400,
        message: 'ID Juara harus dipilih dan berupa angka positif',
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

    // Dapatkan informasi juara termasuk id_event
    const juaraInfo = await helper.runSQL({
      sql: `
        SELECT j.*, e.nama_acara
        FROM tbl_juara j
        INNER JOIN tbl_event e ON j.id_event = e.id_event
        WHERE j.id_juara = ?
      `,
      param: [id_juara],
    });

    if (juaraInfo.length === 0) {
      throw {
        code: 400,
        message: 'Juara tidak ditemukan',
      };
    }

    const juara = juaraInfo[0];
    const id_event_juara = juara.id_event;

    const results = {
      total_data: data.length,
      success_data: 0,
      failed_data: 0,
      details: [],
      id_juara: id_juara,
      juara_info: {
        nama_juara: juara.nama_juara,
        nama_acara: juara.nama_acara,
        id_event: juara.id_event,
      },
    };

    // Proses setiap baris data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const no_juri = row['no_juri'] || row['nomor_juri'] || '';

      try {
        const validationResult = await PenghargaanImportService.validateRow({
          no_juri,
          id_juara,
          id_event_juara,
        });

        if (validationResult.status === 'VALID') {
          // Simpan data penghargaan
          await PenghargaanImportService.savePenghargaan({
            id_formulir: validationResult.id_formulir,
            id_juara: id_juara,
            created_by: req.authIdUser,
          });

          results.success_data++;
          results.details.push({
            row_number: i + 2,
            no_juri,
            status: 'SUCCESS',
            message: 'Data berhasil diimport',
            id_formulir: validationResult.id_formulir,
          });
        } else {
          results.failed_data++;
          results.details.push({
            row_number: i + 2,
            no_juri,
            status: 'FAILED',
            message: validationResult.message,
          });
        }
      } catch (error) {
        results.failed_data++;
        results.details.push({
          row_number: i + 2,
          no_juri,
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

PenghargaanImportService.validateRow = async data => {
  const { no_juri, id_juara, id_event_juara } = data;

  // Validasi no_juri wajib menggunakan Validator
  if (isEmpty(no_juri)) {
    return {
      status: 'INVALID',
      message: 'No Registrasi wajib diisi',
    };
  }

  if (!Validator.isLength(no_juri, { min: 1, max: 20 })) {
    return {
      status: 'INVALID',
      message: 'No Registrasi harus antara 1-20 karakter',
    };
  }

  try {
    // Cari formulir berdasarkan no_juri DAN id_event yang sesuai dengan juara
    const formulir = await helper.runSQL({
      sql: `
        SELECT
          f.id_formulir,
          f.no_juri,
          f.id_event,
          e.nama_acara
        FROM tbl_formulir f
        INNER JOIN tbl_event e ON f.id_event = e.id_event
        WHERE f.no_juri = ? AND f.id_event = ?
      `,
      param: [no_juri, id_event_juara],
    });

    if (formulir.length === 0) {
      // Coba cari di event lain untuk memberikan informasi yang lebih jelas
      const formulirLain = await helper.runSQL({
        sql: `
          SELECT f.id_event, e.nama_acara
          FROM tbl_formulir f
          INNER JOIN tbl_event e ON f.id_event = e.id_event
          WHERE f.no_juri = ?
        `,
        param: [no_juri],
      });

      if (formulirLain.length > 0) {
        const eventLain = formulirLain.map(f => f.nama_acara).join(', ');
        return {
          status: 'INVALID',
          message: `Formulir dengan no registrasi ${no_juri} ditemukan di event lain: ${eventLain}. Pastikan memilih juara yang sesuai dengan event.`,
        };
      } else {
        return {
          status: 'INVALID',
          message: `Formulir dengan no registrasi ${no_juri} tidak ditemukan`,
        };
      }
    }

    const form = formulir[0];

    // Cek apakah penghargaan sudah ada
    const existing = await helper.runSQL({
      sql: `
        SELECT id_penghargaan
        FROM tbl_penghargaan
        WHERE id_formulir = ? AND id_juara = ?
      `,
      param: [form.id_formulir, id_juara],
    });

    if (existing.length > 0) {
      return {
        status: 'INVALID',
        message: 'Penghargaan sudah ada untuk formulir ini',
        id_formulir: form.id_formulir,
      };
    }

    return {
      status: 'VALID',
      message: 'Data valid',
      id_formulir: form.id_formulir,
      nama_acara: form.nama_acara,
    };
  } catch (error) {
    return {
      status: 'INVALID',
      message: `Error validasi: ${error.message}`,
    };
  }
};

PenghargaanImportService.savePenghargaan = async data => {
  const { id_formulir, id_juara, created_by } = data;

  return await helper.runSQL({
    sql: `
      INSERT INTO tbl_penghargaan
        (id_formulir, id_juara, created_by)
      VALUES (?, ?, ?)
    `,
    param: [id_formulir, id_juara, created_by],
  });
};

module.exports = PenghargaanImportService;

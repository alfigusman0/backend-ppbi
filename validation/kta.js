/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  // Normalisasi data - konversi ke string kosong jika undefined/null
  data.no_kta = !isEmpty(data.no_kta) ? data.no_kta : '';
  data.kta_lama = !isEmpty(data.kta_lama) ? data.kta_lama : '';
  data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
  data.masa_berlaku = !isEmpty(data.masa_berlaku) ? data.masa_berlaku : '';
  data.ids_cabang = !isEmpty(data.ids_cabang) ? data.ids_cabang : '';
  data.bukti_bayar = !isEmpty(data.bukti_bayar) ? data.bukti_bayar : '';
  data.status = !isEmpty(data.status) ? data.status : '';
  data.kartu = !isEmpty(data.kartu) ? data.kartu : '';

  // Validasi untuk method POST (Create)
  if (method === 'POST') {
    // Validasi field no_kta (opsional, tapi jika diisi harus max 50 karakter)
    if (!Validator.isEmpty(data.no_kta)) {
      if (
        !Validator.isLength(data.no_kta, {
          min: 1,
          max: 50,
        })
      ) {
        errors.no_kta = 'nomor kta maksimal 50 karakter.';
      }
    }

    // Validasi field ids_cabang (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.ids_cabang)) {
      errors.ids_cabang = 'ids cabang tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.ids_cabang)) {
        errors.ids_cabang = 'ids cabang tidak valid.';
      }
    }

    // Validasi field kta_lama (opsional, tapi jika diisi harus max 50 karakter)
    if (!Validator.isEmpty(data.kta_lama)) {
      if (
        !Validator.isLength(data.kta_lama, {
          min: 1,
          max: 50,
        })
      ) {
        errors.kta_lama = 'kta lama maksimal 50 karakter.';
      }
    }

    // Validasi field id_profile (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.id_profile)) {
      errors.id_profile = 'id profile tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.id_profile)) {
        errors.id_profile = 'id profile tidak valid.';
      }
    }

    // Validasi field masa_berlaku (wajib diisi dan harus format date YYYY-MM-DD)
    if (!Validator.isEmpty(data.masa_berlaku)) {
      if (!Validator.isISO8601(data.masa_berlaku)) {
        errors.masa_berlaku = 'masa berlaku harus format tanggal YYYY-MM-DD.';
      }
    }

    // Validasi field bukti_bayar (opsional, tapi jika diisi harus URL atau #)
    if (!Validator.isEmpty(data.bukti_bayar)) {
      if (data.bukti_bayar !== '#') {
        if (
          !Validator.isURL(data.bukti_bayar, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.bukti_bayar = 'bukti bayar harus berupa URL (http/https) atau #.';
        }
      }
    }

    // Validasi field status (wajib diisi dan harus enum)
    if (Validator.isEmpty(data.status)) {
      errors.status = 'status tidak boleh kosong.';
    } else {
      const validStatus = ['MENUNGGU', 'DIAJUKAN', 'TIDAK DISETUJUI', 'DISETUJUI', 'KEDALUARSA'];
      if (!Validator.isIn(data.status, validStatus)) {
        errors.status = `status tidak valid. harus salah satu dari: ${validStatus.join(', ')}.`;
      }
    }

    // Validasi field kartu (wajib diisi dan harus URL atau #)
    if (Validator.isEmpty(data.kartu)) {
      errors.kartu = 'kartu tidak boleh kosong.';
    } else {
      if (data.kartu !== '#') {
        if (
          !Validator.isURL(data.kartu, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.kartu = 'kartu harus berupa URL (http/https) atau #.';
        }
      }
    }
  } else {
    // Validasi untuk method lain (PUT/PATCH untuk Update)
    // Field bersifat opsional, tapi jika diisi harus valid

    // Validasi no_kta jika diisi
    if (!Validator.isEmpty(data.no_kta)) {
      if (
        !Validator.isLength(data.no_kta, {
          min: 1,
          max: 50,
        })
      ) {
        errors.no_kta = 'nomor kta maksimal 50 karakter.';
      }
    }

    // Validasi ids_cabang jika diisi
    if (!Validator.isEmpty(data.ids_cabang)) {
      if (!Validator.isInt(data.ids_cabang)) {
        errors.ids_cabang = 'ids cabang tidak valid.';
      }
    }

    // Validasi kta_lama jika diisi
    if (!Validator.isEmpty(data.kta_lama)) {
      if (
        !Validator.isLength(data.kta_lama, {
          min: 1,
          max: 50,
        })
      ) {
        errors.kta_lama = 'kta lama maksimal 50 karakter.';
      }
    }

    // Validasi id_profile jika diisi
    if (!Validator.isEmpty(data.id_profile)) {
      if (!Validator.isInt(data.id_profile)) {
        errors.id_profile = 'id profile tidak valid.';
      }
    }

    // Validasi masa_berlaku jika diisi
    if (!Validator.isEmpty(data.masa_berlaku)) {
      if (!Validator.isISO8601(data.masa_berlaku)) {
        errors.masa_berlaku = 'masa berlaku harus format tanggal YYYY-MM-DD.';
      }
    }

    // Validasi bukti_bayar jika diisi (harus URL atau #)
    if (!Validator.isEmpty(data.bukti_bayar)) {
      if (data.bukti_bayar !== '#') {
        if (
          !Validator.isURL(data.bukti_bayar, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.bukti_bayar = 'bukti bayar harus berupa URL (http/https) atau #.';
        }
      }
    }

    // Validasi status jika diisi
    if (!Validator.isEmpty(data.status)) {
      const validStatus = ['MENUNGGU', 'DIAJUKAN', 'TIDAK DISETUJUI', 'DISETUJUI', 'KEDALUARSA'];
      if (!Validator.isIn(data.status, validStatus)) {
        errors.status = `status tidak valid. harus salah satu dari: ${validStatus.join(', ')}.`;
      }
    }

    // Validasi kartu jika diisi
    if (!Validator.isEmpty(data.kartu)) {
      if (data.kartu !== '#') {
        if (
          !Validator.isURL(data.kartu, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.kartu = 'kartu harus berupa URL (http/https) atau #.';
        }
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

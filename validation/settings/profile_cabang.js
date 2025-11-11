/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  // Normalisasi data - konversi ke string kosong jika undefined/null
  data.ids_cabang = !isEmpty(data.ids_cabang) ? data.ids_cabang : '';
  data.ketua = !isEmpty(data.ketua) ? data.ketua : '';
  data.sekertaris = !isEmpty(data.sekertaris) ? data.sekertaris : '';
  data.bendahara = !isEmpty(data.bendahara) ? data.bendahara : '';
  data.profile = !isEmpty(data.profile) ? data.profile : '';
  data.visi = !isEmpty(data.visi) ? data.visi : '';
  data.misi = !isEmpty(data.misi) ? data.misi : '';
  data.program = !isEmpty(data.program) ? data.program : '';
  data.nomor_sk = !isEmpty(data.nomor_sk) ? data.nomor_sk : '';
  data.masa_aktif = !isEmpty(data.masa_aktif) ? data.masa_aktif : '';
  data.file_sk = !isEmpty(data.file_sk) ? data.file_sk : '';

  // Validasi untuk method POST (Create)
  if (method === 'POST') {
    // Validasi field ids_cabang (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.ids_cabang)) {
      errors.ids_cabang = 'ids cabang tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.ids_cabang)) {
        errors.ids_cabang = 'ids cabang tidak valid.';
      }
    }

    // Validasi field ketua (opsional, tapi jika diisi harus integer)
    if (!Validator.isEmpty(data.ketua)) {
      if (!Validator.isInt(data.ketua)) {
        errors.ketua = 'ids ketua tidak valid.';
      }
    }

    // Validasi field sekertaris (opsional, tapi jika diisi harus integer)
    if (!Validator.isEmpty(data.sekertaris)) {
      if (!Validator.isInt(data.sekertaris)) {
        errors.sekertaris = 'ids sekertaris tidak valid.';
      }
    }

    // Validasi field bendahara (opsional, tapi jika diisi harus integer)
    if (!Validator.isEmpty(data.bendahara)) {
      if (!Validator.isInt(data.bendahara)) {
        errors.bendahara = 'ids bendahara tidak valid.';
      }
    }

    // Validasi field profile (wajib diisi)
    if (Validator.isEmpty(data.profile)) {
      errors.profile = 'profile tidak boleh kosong.';
    }

    // Validasi field visi (wajib diisi)
    if (Validator.isEmpty(data.visi)) {
      errors.visi = 'visi tidak boleh kosong.';
    }

    // Validasi field misi (wajib diisi)
    if (Validator.isEmpty(data.misi)) {
      errors.misi = 'misi tidak boleh kosong.';
    }

    // Validasi field program (wajib diisi)
    if (Validator.isEmpty(data.program)) {
      errors.program = 'program tidak boleh kosong.';
    }

    // Validasi field nomor_sk (wajib diisi dan max 255 karakter)
    if (Validator.isEmpty(data.nomor_sk)) {
      errors.nomor_sk = 'nomor sk tidak boleh kosong.';
    } else {
      if (
        !Validator.isLength(data.nomor_sk, {
          min: 1,
          max: 255,
        })
      ) {
        errors.nomor_sk = 'nomor sk maksimal 255 karakter.';
      }
    }

    // Validasi field masa_aktif (wajib diisi dan harus format date YYYY-MM-DD)
    if (Validator.isEmpty(data.masa_aktif)) {
      errors.masa_aktif = 'masa aktif tidak boleh kosong.';
    } else {
      if (!Validator.isISO8601(data.masa_aktif)) {
        errors.masa_aktif = 'masa aktif harus format tanggal YYYY-MM-DD.';
      }
    }

    // Validasi field file_sk (wajib diisi dan harus URL atau #)
    if (Validator.isEmpty(data.file_sk)) {
      errors.file_sk = 'file sk tidak boleh kosong.';
    } else {
      if (data.file_sk !== '#') {
        if (
          !Validator.isURL(data.file_sk, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.file_sk = 'file sk harus berupa URL (http/https) atau #.';
        }
      }
    }
  } else {
    // Validasi untuk method lain (PUT/PATCH untuk Update)
    // Field bersifat opsional, tapi jika diisi harus valid

    // Validasi ids_cabang jika diisi
    if (!Validator.isEmpty(data.ids_cabang)) {
      if (!Validator.isInt(data.ids_cabang)) {
        errors.ids_cabang = 'ids cabang tidak valid.';
      }
    }

    // Validasi ketua jika diisi
    if (!Validator.isEmpty(data.ketua)) {
      if (!Validator.isInt(data.ketua)) {
        errors.ketua = 'ids ketua tidak valid.';
      }
    }

    // Validasi sekertaris jika diisi
    if (!Validator.isEmpty(data.sekertaris)) {
      if (!Validator.isInt(data.sekertaris)) {
        errors.sekertaris = 'ids sekertaris tidak valid.';
      }
    }

    // Validasi bendahara jika diisi
    if (!Validator.isEmpty(data.bendahara)) {
      if (!Validator.isInt(data.bendahara)) {
        errors.bendahara = 'ids bendahara tidak valid.';
      }
    }

    // Validasi nomor_sk jika diisi
    if (!Validator.isEmpty(data.nomor_sk)) {
      if (
        !Validator.isLength(data.nomor_sk, {
          min: 1,
          max: 255,
        })
      ) {
        errors.nomor_sk = 'nomor sk maksimal 255 karakter.';
      }
    }

    // Validasi masa_aktif jika diisi
    if (!Validator.isEmpty(data.masa_aktif)) {
      if (!Validator.isISO8601(data.masa_aktif)) {
        errors.masa_aktif = 'masa aktif harus format tanggal YYYY-MM-DD.';
      }
    }

    // Validasi file_sk jika diisi (harus URL atau #)
    if (!Validator.isEmpty(data.file_sk)) {
      if (data.file_sk !== '#') {
        if (
          !Validator.isURL(data.file_sk, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.file_sk = 'file sk harus berupa URL (http/https) atau #.';
        }
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

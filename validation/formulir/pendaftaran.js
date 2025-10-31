/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  console.log(data.id_event);

  // Normalisasi data - konversi ke string kosong jika undefined/null
  data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
  data.nomor_sertifikat = !isEmpty(data.nomor_sertifikat) ? data.nomor_sertifikat : '';
  data.no_registrasi = !isEmpty(data.no_registrasi) ? data.no_registrasi : '';
  data.no_juri = !isEmpty(data.no_juri) ? data.no_juri : '';
  data.id_pohon = !isEmpty(data.id_pohon) ? data.id_pohon : '';
  data.id_suiseki = !isEmpty(data.id_suiseki) ? data.id_suiseki : '';
  data.id_kategori = !isEmpty(data.id_kategori) ? data.id_kategori : '';
  data.ukuran = !isEmpty(data.ukuran) ? data.ukuran : '';
  data.bukti_bayar = !isEmpty(data.bukti_bayar) ? data.bukti_bayar : '';
  data.bayar = !isEmpty(data.bayar) ? data.bayar : '';
  data.cetak = !isEmpty(data.cetak) ? data.cetak : '';
  data.arena = !isEmpty(data.arena) ? data.arena : '';
  data.meja = !isEmpty(data.meja) ? data.meja : '';
  data.foto = !isEmpty(data.foto) ? data.foto : '';
  data.id_pengantar = !isEmpty(data.id_pengantar) ? data.id_pengantar : '';
  data.total = !isEmpty(data.total) ? data.total : '';
  data.kriteria = !isEmpty(data.kriteria) ? data.kriteria : '';
  data.keterangan = !isEmpty(data.keterangan) ? data.keterangan : '';

  const validateScore = (value, fieldName) => {
    if (Validator.isEmpty(value)) {
      return `${fieldName} tidak boleh kosong.`;
    }

    if (!Validator.isFloat(value)) {
      return `${fieldName} harus berupa angka desimal.`;
    }

    const floatValue = parseFloat(value);
    if (floatValue < 0 || floatValue > 100) {
      return `${fieldName} harus antara 0 hingga 100.`;
    }

    return null; // Valid
  };

  // Validasi untuk method POST (Create)
  if (method === 'POST') {
    // Validasi field id_event (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.id_event)) {
      errors.id_event = 'id event tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.id_event)) {
        errors.id_event = 'id event tidak valid.';
      }
    }

    // Validasi field id_kategori (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.id_kategori)) {
      errors.id_kategori = 'id kategori tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.id_kategori)) {
        errors.id_kategori = 'id kategori tidak valid.';
      }
    }

    // Validasi field ukuran (wajib diisi dan harus numeric/decimal)
    if (Validator.isEmpty(data.ukuran)) {
      errors.ukuran = 'ukuran tidak boleh kosong.';
    } else {
      if (!Validator.isDecimal(data.ukuran)) {
        errors.ukuran = 'ukuran harus berupa angka desimal.';
      }
    }

    // Validasi field foto (opsional, tapi jika diisi harus URL atau #)
    if (!Validator.isEmpty(data.foto)) {
      if (data.foto !== '#') {
        if (
          !Validator.isURL(data.foto, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.foto = 'foto harus berupa URL (http/https) atau #.';
        }
      }
    }

    // Validasi field id_pohon atau id_suiseki (minimal satu harus diisi)
    if (Validator.isEmpty(data.id_pohon) && Validator.isEmpty(data.id_suiseki)) {
      errors.id_pohon = 'id pohon atau id suiseki harus diisi minimal satu.';
    } else {
      // Jika id_pohon diisi, harus integer
      if (!Validator.isEmpty(data.id_pohon)) {
        if (!Validator.isInt(data.id_pohon)) {
          errors.id_pohon = 'id pohon tidak valid.';
        }
      }
      // Jika id_suiseki diisi, harus integer
      if (!Validator.isEmpty(data.id_suiseki)) {
        if (!Validator.isInt(data.id_suiseki)) {
          errors.id_suiseki = 'id suiseki tidak valid.';
        }
      }
    }

    // Validasi field bayar (wajib diisi dan harus enum)
    if (Validator.isEmpty(data.bayar)) {
      errors.bayar = 'bayar tidak boleh kosong.';
    } else {
      if (!Validator.isIn(data.bayar, ['BELUM', 'SUDAH'])) {
        errors.bayar = 'bayar tidak valid. harus BELUM atau SUDAH.';
      }
    }

    // Validasi field cetak (wajib diisi dan harus enum)
    if (Validator.isEmpty(data.cetak)) {
      errors.cetak = 'cetak tidak boleh kosong.';
    } else {
      if (!Validator.isIn(data.cetak, ['BELUM', 'SUDAH'])) {
        errors.cetak = 'cetak tidak valid. harus BELUM atau SUDAH.';
      }
    }

    // Validasi field arena (wajib diisi dan harus enum 'TIDAK' atau 'IYA')
    if (Validator.isEmpty(data.arena)) {
      errors.arena = 'arena tidak boleh kosong.';
    } else {
      if (!Validator.isIn(data.arena, ['TIDAK', 'IYA'])) {
        errors.arena = 'arena tidak valid. harus TIDAK atau IYA.';
      }
    }

    // Validasi field meja (wajib diisi dan harus enum)
    if (Validator.isEmpty(data.meja)) {
      errors.meja = 'meja tidak boleh kosong.';
    } else {
      if (!Validator.isIn(data.meja, ['TIDAK', 'IYA', 'DIAMBIL'])) {
        errors.meja = 'meja tidak valid. harus TIDAK, IYA, atau DIAMBIL.';
      }
    }

    // Validasi field id_pengantar (opsional, tapi jika diisi harus integer)
    if (!Validator.isEmpty(data.id_pengantar)) {
      if (!Validator.isInt(data.id_pengantar)) {
        errors.id_pengantar = 'id pengantar tidak valid.';
      }
    }

    // Validasi total jika diisi
    if (!Validator.isEmpty(data.total)) {
      const totalError = validateScore(data.total, 'total');
      if (totalError) {
        errors.total = totalError;
      }
    }

    if (!Validator.isEmpty(data.kriteria)) {
      if (!Validator.isIn(data.kriteria, ['A', 'B', 'C', 'D'])) {
        errors.kriteria = 'kriteria tidak valid. harus A, B, C, atau D.';
      }
    }
  } else {
    // Validasi untuk method lain (PUT/PATCH untuk Update)
    // Field bersifat opsional, tapi jika diisi harus valid

    // Validasi id_event jika diisi
    if (!Validator.isEmpty(data.id_event)) {
      if (!Validator.isInt(data.id_event)) {
        errors.id_event = 'id event tidak valid.';
      }
    }

    // Validasi nomor_sertifikat jika diisi (max 100 karakter, harus unik di DB)
    if (!Validator.isEmpty(data.nomor_sertifikat)) {
      if (
        !Validator.isLength(data.nomor_sertifikat, {
          min: 1,
          max: 100,
        })
      ) {
        errors.nomor_sertifikat = 'nomor sertifikat maksimal 100 karakter.';
      }
    }

    // Validasi no_registrasi jika diisi (max 20 karakter)
    if (!Validator.isEmpty(data.no_registrasi)) {
      if (
        !Validator.isLength(data.no_registrasi, {
          min: 1,
          max: 20,
        })
      ) {
        errors.no_registrasi = 'no registrasi maksimal 20 karakter.';
      }
    }

    // Validasi no_juri jika diisi (max 20 karakter)
    if (!Validator.isEmpty(data.no_juri)) {
      if (
        !Validator.isLength(data.no_juri, {
          min: 1,
          max: 20,
        })
      ) {
        errors.no_juri = 'no juri maksimal 20 karakter.';
      }
    }

    // Validasi id_kategori jika diisi
    if (!Validator.isEmpty(data.id_kategori)) {
      if (!Validator.isInt(data.id_kategori)) {
        errors.id_kategori = 'id kategori tidak valid.';
      }
    }

    // Validasi ukuran jika diisi
    if (!Validator.isEmpty(data.ukuran)) {
      if (!Validator.isDecimal(data.ukuran)) {
        errors.ukuran = 'ukuran harus berupa angka desimal.';
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

    // Validasi foto jika diisi
    if (!Validator.isEmpty(data.foto)) {
      if (data.foto !== '#') {
        if (
          !Validator.isURL(data.foto, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.foto = 'foto harus berupa URL (http/https) atau #.';
        }
      }
    }

    // Validasi id_pohon jika diisi
    if (!Validator.isEmpty(data.id_pohon)) {
      if (!Validator.isInt(data.id_pohon)) {
        errors.id_pohon = 'id pohon tidak valid.';
      }
    }

    // Validasi id_suiseki jika diisi
    if (!Validator.isEmpty(data.id_suiseki)) {
      if (!Validator.isInt(data.id_suiseki)) {
        errors.id_suiseki = 'id suiseki tidak valid.';
      }
    }

    // Validasi bayar jika diisi
    if (!Validator.isEmpty(data.bayar)) {
      if (!Validator.isIn(data.bayar, ['BELUM', 'SUDAH'])) {
        errors.bayar = 'bayar tidak valid. harus BELUM atau SUDAH.';
      }
    }

    // Validasi cetak jika diisi
    if (!Validator.isEmpty(data.cetak)) {
      if (!Validator.isIn(data.cetak, ['BELUM', 'SUDAH'])) {
        errors.cetak = 'cetak tidak valid. harus BELUM atau SUDAH.';
      }
    }

    // Validasi arena jika diisi
    if (!Validator.isEmpty(data.arena)) {
      if (!Validator.isIn(data.arena, ['TIDAK', 'IYA'])) {
        errors.arena = 'arena tidak valid. harus TIDAK atau IYA.';
      }
    }

    // Validasi meja jika diisi
    if (!Validator.isEmpty(data.meja)) {
      if (!Validator.isIn(data.meja, ['TIDAK', 'IYA', 'DIAMBIL'])) {
        errors.meja = 'meja tidak valid. harus TIDAK, IYA, atau DIAMBIL.';
      }
    }

    // Validasi field id_pengantar (opsional, tapi jika diisi harus integer)
    if (!Validator.isEmpty(data.id_pengantar)) {
      if (!Validator.isInt(data.id_pengantar)) {
        errors.id_pengantar = 'id pengantar tidak valid.';
      }
    }

    // Validasi total jika diisi
    if (!Validator.isEmpty(data.total)) {
      const totalError = validateScore(data.total, 'total');
      if (totalError) {
        errors.total = totalError;
      }
    }

    if (!Validator.isEmpty(data.kriteria)) {
      if (!Validator.isIn(data.kriteria, ['A', 'B', 'C', 'D'])) {
        errors.kriteria = 'kriteria tidak valid. harus A, B, C, atau D.';
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

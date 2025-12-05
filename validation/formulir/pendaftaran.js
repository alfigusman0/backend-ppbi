/* Libraries */
const Validator = require('validator');
const isEmpty = require('../is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  // Normalisasi data - konversi ke string kosong jika undefined/null
  data.id_event = !isEmpty(data.id_event) ? data.id_event : '';
  data.no_registrasi = !isEmpty(data.no_registrasi) ? data.no_registrasi : '';
  data.no_juri = !isEmpty(data.no_juri) ? data.no_juri : '';
  data.id_pohon = !isEmpty(data.id_pohon) ? data.id_pohon : '';
  data.id_suiseki = !isEmpty(data.id_suiseki) ? data.id_suiseki : '';
  data.id_kategori = !isEmpty(data.id_kategori) ? data.id_kategori : '';
  data.ukuran = !isEmpty(data.ukuran) ? data.ukuran : '';
  data.diskon = !isEmpty(data.diskon) ? data.diskon : '';
  data.bukti_bayar = !isEmpty(data.bukti_bayar) ? data.bukti_bayar : '';
  data.bayar = !isEmpty(data.bayar) ? data.bayar : '';
  data.cetak = !isEmpty(data.cetak) ? data.cetak : '';
  data.arena = !isEmpty(data.arena) ? data.arena : '';
  data.meja = !isEmpty(data.meja) ? data.meja : '';
  data.foto = !isEmpty(data.foto) ? data.foto : '';
  data.id_pengantar = !isEmpty(data.id_pengantar) ? data.id_pengantar : '';
  data.penampilan = !isEmpty(data.penampilan) ? data.penampilan : '';
  data.gerak_dasar = !isEmpty(data.gerak_dasar) ? data.gerak_dasar : '';
  data.keserasian = !isEmpty(data.keserasian) ? data.keserasian : '';
  data.kematangan = !isEmpty(data.kematangan) ? data.kematangan : '';
  data.kriteria = !isEmpty(data.kriteria) ? data.kriteria : '';
  data.keterangan = !isEmpty(data.keterangan) ? data.keterangan : '';
  data.sync = !isEmpty(data.sync) ? data.sync : '';
  data.id_juri = !isEmpty(data.id_juri) ? data.id_juri : '';
  data.kwitansi = !isEmpty(data.kwitansi) ? data.kwitansi : '';
  data.sertifikat = !isEmpty(data.sertifikat) ? data.sertifikat : '';

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

    // Validasi field ukuran (wajib diisi dan harus numeric/decimal)
    if (Validator.isEmpty(data.ukuran)) {
      errors.ukuran = 'ukuran tidak boleh kosong.';
    } else {
      if (!Validator.isDecimal(data.ukuran)) {
        errors.ukuran = 'ukuran harus berupa angka desimal.';
      }
    }

    // Validasi field diskon (wajib diisi dan harus numeric)
    if (!Validator.isEmpty(data.diskon)) {
      if (!Validator.isFloat(data.diskon) || parseFloat(data.diskon) < 0) {
        errors.diskon = 'diskon harus berupa angka positif.';
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

    // Validasi field keterangan (opsional, tapi jika diisi max 500 karakter)
    if (!Validator.isEmpty(data.keterangan)) {
      if (!Validator.isLength(data.keterangan, { min: 1, max: 500 })) {
        errors.keterangan = 'keterangan maksimal 500 karakter.';
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

    // Validasi diskon jika diisi
    if (!Validator.isEmpty(data.diskon)) {
      if (!Validator.isFloat(data.diskon) || parseFloat(data.diskon) < 0) {
        errors.diskon = 'diskon harus berupa angka positif.';
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

    // Validasi field id_pengantar (opsional, tapi jika diisi harus integer)
    if (!Validator.isEmpty(data.id_pengantar)) {
      if (!Validator.isInt(data.id_pengantar)) {
        errors.id_pengantar = 'id pengantar tidak valid.';
      }
    }

    // Validasi nilai penampilan jika diisi nilai desimal dan lebih dari 0
    if (!isEmpty(data.penampilan)) {
      if (!Validator.isFloat(data.penampilan)) {
        errors.penampilan = 'penampilan harus berupa angka desimal.';
      } else if (parseFloat(data.penampilan) < 0) {
        errors.penampilan = 'penampilan harus lebih dari atau sama dengan 0.';
      }
    }

    // Validasi nilai gerak_dasar jika diisi nilai desimal dan lebih dari 0
    if (!isEmpty(data.gerak_dasar)) {
      if (!Validator.isFloat(data.gerak_dasar)) {
        errors.gerak_dasar = 'gerak dasar harus berupa angka desimal.';
      } else if (parseFloat(data.gerak_dasar) < 0) {
        errors.gerak_dasar = 'gerak dasar harus lebih dari atau sama dengan 0.';
      }
    }

    // Validasi nilai keserasian jika diisi nilai desimal dan lebih dari 0
    if (!isEmpty(data.keserasian)) {
      if (!Validator.isFloat(data.keserasian)) {
        errors.keserasian = 'keserasian harus berupa angka desimal.';
      } else if (parseFloat(data.keserasian) < 0) {
        errors.keserasian = 'keserasian harus lebih dari atau sama dengan 0.';
      }
    }

    // Validasi nilai kematangan jika diisi nilai desimal dan lebih dari 0
    if (!isEmpty(data.kematangan)) {
      if (!Validator.isFloat(data.kematangan)) {
        errors.kematangan = 'kematangan harus berupa angka desimal.';
      } else if (parseFloat(data.kematangan) < 0) {
        errors.kematangan = 'kematangan harus lebih dari atau sama dengan 0.';
      }
    }

    // Validasi kriteria jika diisi
    // Validasi kriteria jika diisi
    if (!Validator.isEmpty(data.kriteria)) {
      const validKriteria = [
        'A',
        'B',
        'C',
        'D',
        'A,A',
        'A,B',
        'A,C',
        'B,A',
        'B,B',
        'B,C',
        'C,A',
        'C,B',
        'C,C',
        'A,A,A',
        'A,A,B',
        'A,A,C',
        'A,B,A',
        'A,B,B',
        'A,B,C',
        'A,C,A',
        'A,C,B',
        'A,C,C',
        'B,A,A',
        'B,A,B',
        'B,A,C',
        'B,B,A',
        'B,B,B',
        'B,B,C',
        'B,C,A',
        'B,C,B',
        'B,C,C',
        'C,A,A',
        'C,A,B',
        'C,A,C',
        'C,B,A',
        'C,B,B',
        'C,B,C',
        'C,C,A',
        'C,C,B',
        'C,C,C',
      ];

      if (!Validator.isIn(data.kriteria, validKriteria)) {
        errors.kriteria =
          'Kriteria tidak valid. Harus sesuai dengan daftar nilai yang diperbolehkan.';
      }
    }

    // Validasi keterangan jika diisi (max 500 karakter)
    if (!Validator.isEmpty(data.keterangan)) {
      if (!Validator.isLength(data.keterangan, { min: 1, max: 500 })) {
        errors.keterangan = 'keterangan maksimal 500 karakter.';
      }
    }

    // Validasi id_juri jika diisi
    if (!Validator.isEmpty(data.id_juri)) {
      if (!Validator.isInt(data.id_juri)) {
        errors.id_juri = 'id juri tidak valid.';
      }
    }

    // Validasi kwitansi jika diisi (harus URL atau #)
    if (!Validator.isEmpty(data.kwitansi)) {
      if (data.kwitansi !== '#') {
        if (
          !Validator.isURL(data.kwitansi, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.kwitansi = 'kwitansi harus berupa URL (http/https) atau #.';
        }
      }
    }

    // Validasi sertifikat jika diisi (harus URL atau #)
    if (!Validator.isEmpty(data.sertifikat)) {
      if (data.sertifikat !== '#') {
        if (
          !Validator.isURL(data.sertifikat, {
            protocols: ['http', 'https'],
            require_protocol: true,
          })
        ) {
          errors.sertifikat = 'sertifikat harus berupa URL (http/https) atau #.';
        }
      }
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

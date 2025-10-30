/* Libraries */
const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateInput(method, path, data) {
  let errors = {};

  // Normalisasi data - konversi ke string kosong jika undefined/null
  data.id_profile = !isEmpty(data.id_profile) ? data.id_profile : '';
  data.ids_jenis_bonsai = !isEmpty(data.ids_jenis_bonsai) ? data.ids_jenis_bonsai : '';
  data.ids_kelas = !isEmpty(data.ids_kelas) ? data.ids_kelas : '';
  data.ukuran = !isEmpty(data.ukuran) ? data.ukuran : '';
  data.panjang = !isEmpty(data.panjang) ? data.panjang : '';
  data.lebar = !isEmpty(data.lebar) ? data.lebar : '';
  data.tinggi = !isEmpty(data.tinggi) ? data.tinggi : '';
  data.foto = !isEmpty(data.foto) ? data.foto : '';

  // Helper function untuk validasi bilangan positif (>= 0)
  const validatePositiveDecimal = (value, fieldName) => {
    if (Validator.isEmpty(value)) {
      return null; // Opsional, boleh kosong
    }

    if (!Validator.isDecimal(value)) {
      return `${fieldName} harus berupa angka desimal.`;
    }

    const decimalValue = parseFloat(value);
    if (decimalValue < 0) {
      return `${fieldName} harus bilangan positif (>= 0).`;
    }

    return null; // Valid
  };

  // Validasi untuk method POST (Create)
  if (method === 'POST') {
    // Validasi field id_profile (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.id_profile)) {
      errors.id_profile = 'id profile tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.id_profile)) {
        errors.id_profile = 'id profile tidak valid.';
      }
    }

    // Validasi field ids_jenis_bonsai (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.ids_jenis_bonsai)) {
      errors.ids_jenis_bonsai = 'ids jenis bonsai tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.ids_jenis_bonsai)) {
        errors.ids_jenis_bonsai = 'ids jenis bonsai tidak valid.';
      }
    }

    // Validasi field ids_kelas (wajib diisi dan harus integer)
    if (Validator.isEmpty(data.ids_kelas)) {
      errors.ids_kelas = 'ids kelas tidak boleh kosong.';
    } else {
      if (!Validator.isInt(data.ids_kelas)) {
        errors.ids_kelas = 'ids kelas tidak valid.';
      }
    }

    // Validasi field ukuran (opsional, bilangan positif)
    const ukuranError = validatePositiveDecimal(data.ukuran, 'ukuran');
    if (ukuranError) {
      errors.ukuran = ukuranError;
    }

    // Validasi field panjang (opsional, bilangan positif)
    const panjangError = validatePositiveDecimal(data.panjang, 'panjang');
    if (panjangError) {
      errors.panjang = panjangError;
    }

    // Validasi field lebar (opsional, bilangan positif)
    const lebarError = validatePositiveDecimal(data.lebar, 'lebar');
    if (lebarError) {
      errors.lebar = lebarError;
    }

    // Validasi field tinggi (opsional, bilangan positif)
    const tinggiError = validatePositiveDecimal(data.tinggi, 'tinggi');
    if (tinggiError) {
      errors.tinggi = tinggiError;
    }

    // Validasi field foto (wajib diisi dan harus URL atau #)
    if (Validator.isEmpty(data.foto)) {
      errors.foto = 'foto tidak boleh kosong.';
    } else {
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
  } else {
    // Validasi untuk method lain (PUT/PATCH untuk Update)
    // Field bersifat opsional, tapi jika diisi harus valid

    // Validasi id_profile jika diisi
    if (!Validator.isEmpty(data.id_profile)) {
      if (!Validator.isInt(data.id_profile)) {
        errors.id_profile = 'id profile tidak valid.';
      }
    }

    // Validasi ids_jenis_bonsai jika diisi
    if (!Validator.isEmpty(data.ids_jenis_bonsai)) {
      if (!Validator.isInt(data.ids_jenis_bonsai)) {
        errors.ids_jenis_bonsai = 'ids jenis bonsai tidak valid.';
      }
    }

    // Validasi ids_kelas jika diisi
    if (!Validator.isEmpty(data.ids_kelas)) {
      if (!Validator.isInt(data.ids_kelas)) {
        errors.ids_kelas = 'ids kelas tidak valid.';
      }
    }

    // Validasi ukuran jika diisi (bilangan positif)
    const ukuranError = validatePositiveDecimal(data.ukuran, 'ukuran');
    if (ukuranError) {
      errors.ukuran = ukuranError;
    }

    // Validasi panjang jika diisi (bilangan positif)
    const panjangError = validatePositiveDecimal(data.panjang, 'panjang');
    if (panjangError) {
      errors.panjang = panjangError;
    }

    // Validasi lebar jika diisi (bilangan positif)
    const lebarError = validatePositiveDecimal(data.lebar, 'lebar');
    if (lebarError) {
      errors.lebar = lebarError;
    }

    // Validasi tinggi jika diisi (bilangan positif)
    const tinggiError = validatePositiveDecimal(data.tinggi, 'tinggi');
    if (tinggiError) {
      errors.tinggi = tinggiError;
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
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

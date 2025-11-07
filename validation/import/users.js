/* Libraries */
const isEmpty = require('../is-empty');

module.exports = function validateImportExcelData(rows) {
  let errors = [];
  let validatedData = [];

  // Mapping kolom yang fleksibel (case-insensitive)
  const requiredColumns = {
    username: ['username', 'user_name', 'nama_pengguna', 'user'],
    password: ['password', 'kata_sandi', 'pwd'],
    nama_lengkap: ['nama_lengkap', 'nama', 'nama lengkap', 'nama_user'],
    jenis_kelamin: ['jenis_kelamin', 'jk', 'gender', 'sex', 'kelamin'],
    ids_grup: ['ids_grup', 'grup_id', 'group_id', 'id_grup', 'grup'],
    ids_kelurahan: ['ids_kelurahan', 'kelurahan_id', 'id_kelurahan', 'kelurahan'],
    rw: ['rw'],
    rt: ['rt'],
    nmr_tlpn: ['nmr_tlpn', 'no_telepon', 'telepon', 'nomor_telepon', 'no_hp', 'hp'],
    alamat: ['alamat', 'alamat_lengkap', 'address'],
    no_kta: ['no_kta', 'nomor kta', 'no. kta'],
    kta_lama: ['kta_lama', 'kta lama'],
    masa_berlaku: ['masa_berlaku', 'ktaberlaku', 'masa berlaku'],
    ids_cabang: ['ids_cabang', 'id_cabang', 'cabang'],
    bukti_bayar: ['bukti_bayar', 'bukti bayar'],
    status_kta: ['status_kta', 'status kta'],
  };

  const columnMapping = {};
  const headerRow = rows[0];

  // Validasi header
  if (!headerRow || headerRow.every(cell => isEmpty(cell))) {
    errors.push('Baris header tidak ditemukan dalam file Excel');
    return { isValid: false, errors, validatedData: [], columnMapping: {} };
  }

  console.log('Raw header row:', headerRow); // Debug

  // Normalisasi header: hapus spasi extra, convert ke lowercase
  const normalizedHeader = headerRow.map((h, idx) => {
    if (isEmpty(h)) return null;
    const normalized = h.toString().trim().toLowerCase();
    console.log(`Column ${idx}: "${h}" => "${normalized}`); // Debug
    return normalized;
  });

  // Lakukan mapping kolom dengan lebih akurat
  Object.keys(requiredColumns).forEach(dbColumn => {
    const excelColumns = requiredColumns[dbColumn];

    // Cari kolom yang cocok
    for (let i = 0; i < normalizedHeader.length; i++) {
      const headerValue = normalizedHeader[i];

      // Skip empty headers
      if (!headerValue) continue;

      // Check exact match
      if (excelColumns.includes(headerValue)) {
        columnMapping[dbColumn] = i;
        console.log(`Mapped "${dbColumn}" to column ${i} (${headerValue})`); // Debug
        break;
      }

      // Check partial match (untuk kolom dengan spasi)
      for (const col of excelColumns) {
        if (headerValue.includes(col) || col.includes(headerValue)) {
          columnMapping[dbColumn] = i;
          console.log(`Mapped "${dbColumn}" to column ${i} (partial match: ${headerValue})`); // Debug
          break;
        }
      }
    }
  });

  console.log('Final column mapping:', columnMapping); // Debug

  // Validasi kolom wajib ada
  const requiredFields = ['username', 'password', 'nama_lengkap', 'jenis_kelamin'];
  const missingColumns = requiredFields.filter(field => columnMapping[field] === undefined);

  if (missingColumns.length > 0) {
    errors.push(`Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}`);
    return {
      isValid: false,
      errors,
      validatedData: [],
      columnMapping,
      debug: {
        headerRow: headerRow,
        normalizedHeader: normalizedHeader,
        columnMapping: columnMapping,
      },
    };
  }

  // Validasi data baris (mulai dari baris 1, karena baris 0 adalah header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors = [];

    // Skip baris kosong
    if (!row || row.every(cell => isEmpty(cell))) {
      continue;
    }

    const rowData = {
      row_number: i + 1,
      username: row[columnMapping['username']]?.toString().trim() || '',
      password: row[columnMapping['password']]?.toString().trim() || '',
      nama_lengkap: row[columnMapping['nama_lengkap']]?.toString().trim() || '',
      jenis_kelamin: row[columnMapping['jenis_kelamin']]?.toString().toUpperCase().trim() || '',
      ids_grup: row[columnMapping['ids_grup']] ? parseInt(row[columnMapping['ids_grup']]) : null,
      ids_kelurahan: row[columnMapping['ids_kelurahan']]
        ? parseInt(row[columnMapping['ids_kelurahan']])
        : null,
      rw: row[columnMapping['rw']]?.toString().trim() || null,
      rt: row[columnMapping['rt']]?.toString().trim() || null,
      nmr_tlpn: row[columnMapping['nmr_tlpn']]?.toString().trim() || null,
      alamat: row[columnMapping['alamat']]?.toString().trim() || null,
      no_kta: row[columnMapping.no_kta]?.toString().trim() || null,
      kta_lama: row[columnMapping.kta_lama]?.toString().trim() || null,
      masa_berlaku: row[columnMapping.masa_berlaku]?.toString().trim() || null,
      ids_cabang:
        columnMapping.ids_cabang !== undefined ? parseInt(row[columnMapping.ids_cabang]) : null,
      bukti_bayar: row[columnMapping.bukti_bayar]?.toString().trim() || null,
      status_kta: row[columnMapping.status_kta]?.toString().trim().toUpperCase() || 'MENUNGGU',
    };

    // Validasi username
    if (isEmpty(rowData.username)) {
      rowErrors.push('Username tidak boleh kosong');
    } else if (rowData.username.length < 5) {
      rowErrors.push('Username minimal 5 karakter');
    } else if (rowData.username.length > 50) {
      rowErrors.push('Username maksimal 50 karakter');
    } else if (!/^[a-zA-Z0-9_.@]+$/.test(rowData.username)) {
      rowErrors.push('Username hanya boleh mengandung huruf, angka, underscore, titik, dan @');
    }

    // Validasi password
    if (isEmpty(rowData.password)) {
      rowErrors.push('Password tidak boleh kosong');
    } else if (rowData.password.length < 8) {
      rowErrors.push('Password minimal 8 karakter');
    } else if (rowData.password.length > 255) {
      rowErrors.push('Password terlalu panjang');
    }

    // Validasi nama lengkap
    if (isEmpty(rowData.nama_lengkap)) {
      rowErrors.push('Nama lengkap tidak boleh kosong');
    } else if (rowData.nama_lengkap.length < 3) {
      rowErrors.push('Nama lengkap minimal 3 karakter');
    } else if (rowData.nama_lengkap.length > 255) {
      rowErrors.push('Nama lengkap maksimal 255 karakter');
    }

    // Validasi jenis kelamin
    if (isEmpty(rowData.jenis_kelamin)) {
      rowErrors.push('Jenis kelamin tidak boleh kosong');
    } else if (!['LAKI-LAKI', 'PEREMPUAN'].includes(rowData.jenis_kelamin)) {
      rowErrors.push(
        `Jenis kelamin harus "LAKI-LAKI" atau "PEREMPUAN", diterima: "${rowData.jenis_kelamin}"`
      );
    }

    // Validasi ids_grup (opsional tapi jika ada harus angka)
    if (rowData.ids_grup !== null) {
      if (isNaN(rowData.ids_grup) || rowData.ids_grup <= 0) {
        rowErrors.push('ID Grup harus berupa angka positif');
      }
    }

    // Validasi ids_kelurahan (opsional tapi jika ada harus angka)
    if (rowData.ids_kelurahan !== null) {
      if (isNaN(rowData.ids_kelurahan) || rowData.ids_kelurahan <= 0) {
        rowErrors.push('ID Kelurahan harus berupa angka positif');
      }
    }

    // Validasi RW (opsional, max 5 karakter)
    if (rowData.rw !== null && rowData.rw.length > 5) {
      rowErrors.push('RW maksimal 5 karakter');
    }

    // Validasi RT (opsional, max 5 karakter)
    if (rowData.rt !== null && rowData.rt.length > 5) {
      rowErrors.push('RT maksimal 5 karakter');
    }

    // Validasi nomor telepon (opsional)
    if (rowData.nmr_tlpn !== null && rowData.nmr_tlpn.length > 0) {
      if (rowData.nmr_tlpn.length > 20) {
        rowErrors.push('Nomor telepon maksimal 20 karakter');
      } else {
        const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
        const cleanPhone = rowData.nmr_tlpn.replace(/[- ]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          rowErrors.push('Format nomor telepon tidak valid');
        }
      }
    }

    // Validasi alamat (opsional)
    if (rowData.alamat !== null && rowData.alamat.length > 0) {
      if (rowData.alamat.length > 65535) {
        rowErrors.push('Alamat terlalu panjang');
      }
    }

    if (rowErrors.length > 0) {
      errors.push(`Baris ${i + 1}: ${rowErrors.join('; ')}`);
    }

    if (rowErrors.length === 0) {
      validatedData.push(rowData);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedData,
    columnMapping,
    headerRow: headerRow,
    detectedHeaders: normalizedHeader.filter(h => h !== null),
  };
};

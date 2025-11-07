// load env
require('dotenv').config();

// import libraries
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// initialize
const app = express();
const router = express.Router();

// ============================================
// HELMET SECURITY CONFIGURATION
// ============================================

/**
 * Konfigurasi Helmet dengan CSP yang allow external script
 * Untuk development, allow CDN. Untuk production, buat lebih strict.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Untuk inline script di swagger.html
          "'unsafe-eval'", // Diperlukan untuk Swagger UI
          'https://cdn.jsdelivr.net',
          'https://unpkg.com', // Untuk Swagger UI
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
          'https://unpkg.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// morgan
app.use(morgan('dev'));

// body parser
app.use(bodyParser.text());
app.use(
  bodyParser.urlencoded({
    limit: '500mb',
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(
  bodyParser.json({
    limit: '500mb',
    extended: true,
    parameterLimit: 50000,
  })
);

// Parse form-urlencoded
app.use(
  express.json({
    limit: '500mb',
  })
);
app.use(
  express.urlencoded({
    limit: '500mb',
    extended: true,
  })
);

// cors middleware
app.use(cors());

// compression
app.use(compression());

// ============================================
// DOKUMENTASI API - SWAGGER UI
// ============================================

/**
 * Middleware untuk serve dokumentasi statik dari folder /docs
 */
app.use(
  '/docs',
  express.static(path.join(__dirname, 'docs'), {
    index: 'swagger.html',
    dotfiles: 'deny',
    maxAge: '1h',
    etag: false,
  })
);

/**
 * Route untuk serve OpenAPI specification
 */
app.get('/api-spec', (req, res) => {
  try {
    const yamlPath = path.join(__dirname, 'docs', 'openapi.yaml');

    if (!fs.existsSync(yamlPath)) {
      console.error(`[ERROR] File openapi.yaml tidak ditemukan: ${yamlPath}`);
      return res.status(404).json({
        code: 404,
        status: 'error',
        message: 'File spesifikasi OpenAPI tidak ditemukan di folder docs/',
      });
    }

    res.header('Content-Type', 'application/yaml; charset=utf-8');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cache-Control', 'public, max-age=3600');

    console.log(`[INFO] OpenAPI spec diakses dari IP: ${req.ip}`);
    res.sendFile(yamlPath);
  } catch (error) {
    console.error(`[ERROR] Gagal melayani OpenAPI spec:`, error.message);
    res.status(500).json({
      code: 500,
      status: 'error',
      message: 'Terjadi kesalahan saat melayani spesifikasi OpenAPI',
    });
  }
});

/**
 * Health check route untuk dokumentasi
 */
app.get('/docs-health', (req, res) => {
  try {
    const swaggerPath = path.join(__dirname, 'docs', 'swagger.html');
    const yamlPath = path.join(__dirname, 'docs', 'openapi.yaml');

    const swaggerExists = fs.existsSync(swaggerPath);
    const yamlExists = fs.existsSync(yamlPath);

    const swaggerStats = swaggerExists ? fs.statSync(swaggerPath) : null;
    const yamlStats = yamlExists ? fs.statSync(yamlPath) : null;

    const docsStatus = {
      status: swaggerExists && yamlExists ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 5000,
      documentation: {
        swagger_html: {
          status: swaggerExists ? '✓ Available' : '✗ Missing',
          size: swaggerStats ? `${(swaggerStats.size / 1024).toFixed(2)} KB` : 'N/A',
          file: 'swagger.html',
        },
        openapi_yaml: {
          status: yamlExists ? '✓ Available' : '✗ Missing',
          size: yamlStats ? `${(yamlStats.size / 1024).toFixed(2)} KB` : 'N/A',
          file: 'openapi.yaml',
        },
      },
      access_urls: {
        docs: `http://localhost:${process.env.PORT || 5000}/docs`,
        api_spec: `http://localhost:${process.env.PORT || 5000}/api-spec`,
        health_check: `http://localhost:${process.env.PORT || 5000}/docs-health`,
      },
    };

    const httpCode = swaggerExists && yamlExists ? 200 : 503;
    res.status(httpCode).json(docsStatus);
  } catch (error) {
    console.error(`[ERROR] Gagal mengecek dokumentasi health:`, error.message);
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
    });
  }
});

// ============================================
// ROOT ENDPOINT - INFORMASI DOKUMENTASI
// ============================================

/**
 * Root endpoint untuk informasi API
 */
app.get('/', (req, res) => {
  const port = process.env.PORT || 5000;
  res.status(200).json({
    status: 'success',
    message: 'API PPBI - Persatuan Penggemar Bonsai Indonesia',
    version: '1.2.3',
    documentation: {
      url: `http://localhost:${port}/docs`,
      description:
        'Buka URL di atas untuk melihat dokumentasi API interaktif menggunakan Swagger UI',
      type: 'Swagger UI',
    },
    endpoints: {
      docs: `http://localhost:${port}/docs`,
      api_spec: `http://localhost:${port}/api-spec`,
      health_check: `http://localhost:${port}/docs-health`,
      api_base: `http://localhost:${port}/api`,
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// IP WHITELIST (PRODUCTION)
// ============================================

if (process.env.NODE_ENV === 'production') {
  // whitelist ip address for production
  app.use('/api', (req, res, next) => {
    try {
      // allowed ips by env
      const allowedIps = process.env.ALLOWED_IPS?.split(',') || [];
      const clientIp = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip)
        .split(',')[0]
        .trim();

      if (allowedIps.length === 0 || allowedIps.includes(clientIp)) {
        next();
      } else {
        console.warn(`[WARN] IP tidak diizinkan: ${clientIp}`);
        res.status(403).json({
          code: 403,
          status: 'error',
          message: `IP tidak diizinkan mengakses resource ini. IP Anda: ${clientIp}`,
        });
      }
    } catch (error) {
      console.error(`[ERROR] Terjadi kesalahan pada IP whitelist:`, error.message);
      res.status(500).json({
        code: 500,
        status: 'error',
        message: 'Terjadi kesalahan validasi akses',
      });
    }
  });
}

// ============================================
// ROUTES IMPORT
// ============================================

const authRoutes = require('./routes/auth');
const awsRoutes = require('./routes/aws');
const cronejobRoutes = require('./routes/cronejob');
const ktaRoutes = require('./routes/kta');
const notifRoutes = require('./routes/notif');
const pengantarRoutes = require('./routes/pengantar');
const pohonRoutes = require('./routes/pohon');
const profileRoutes = require('./routes/profile');
const suisekiRoutes = require('./routes/suiseki');
const usersRoutes = require('./routes/users');

/* Event Setting */
const eacaraRoutes = require('./routes/event/acara');
const ejuaraRoutes = require('./routes/event/juara');
const ejuriRoutes = require('./routes/event/juri');
const ekategoriRoutes = require('./routes/event/kategori');
const esettingsRoutes = require('./routes/event/settings');

/* Formulir */
const fPendaftaranRoutes = require('./routes/formulir/pendaftaran');
const fPenghargaanRoutes = require('./routes/formulir/penghargaan');
const fPenilaianRoutes = require('./routes/formulir/penilaian');

/* Notification */
const notificationRoutes = require('./routes/notification/index');
const whatsappRoutes = require('./routes/notification/whatsapp');

/* Settings */
const sCabangRoutes = require('./routes/settings/cabang');
const sGrupRoutes = require('./routes/settings/grup');
const sHakAksesRoutes = require('./routes/settings/hak_akses');
const sJenisBonsaiRoutes = require('./routes/settings/jenis_bonsai');
const sKabKotaRoutes = require('./routes/settings/kab_kota');
const sKecamatanRoutes = require('./routes/settings/kecamatan');
const sKelasRoutes = require('./routes/settings/kelas');
const sKelurahanRoutes = require('./routes/settings/kelurahan');
const sLevelRoutes = require('./routes/settings/level');
const sModulRoutes = require('./routes/settings/modul');
const sProfileCabangRoutes = require('./routes/settings/profile_cabang');
const sProvinsiRoutes = require('./routes/settings/provinsi');

// ============================================
// ROUTES REGISTRATION
// ============================================

// use routes
router.use('/auth', authRoutes);
router.use('/aws', awsRoutes);
router.use('/cronejob', cronejobRoutes);
router.use('/kta', ktaRoutes);
router.use('/notif', notifRoutes);
router.use('/pengantar', pengantarRoutes);
router.use('/pohon', pohonRoutes);
router.use('/profile', profileRoutes);
router.use('/suiseki', suisekiRoutes);
router.use('/users', usersRoutes);

/* Event Setting */
router.use('/event/acara', eacaraRoutes);
router.use('/event/juara', ejuaraRoutes);
router.use('/event/juri', ejuriRoutes);
router.use('/event/kategori', ekategoriRoutes);
router.use('/event/settings', esettingsRoutes);

/* Formulir */
router.use('/formulir/pendaftaran', fPendaftaranRoutes);
router.use('/formulir/penghargaan', fPenghargaanRoutes);
router.use('/formulir/penilaian', fPenilaianRoutes);

/* Notification Routes */
router.use('/notification', notificationRoutes);
router.use('/notification/whatsapp', whatsappRoutes);

/* Settings */
router.use('/settings/cabang', sCabangRoutes);
router.use('/settings/grup', sGrupRoutes);
router.use('/settings/hak-akses', sHakAksesRoutes);
router.use('/settings/jenis-bonsai', sJenisBonsaiRoutes);
router.use('/settings/kab-kota', sKabKotaRoutes);
router.use('/settings/kecamatan', sKecamatanRoutes);
router.use('/settings/kelas', sKelasRoutes);
router.use('/settings/kelurahan', sKelurahanRoutes);
router.use('/settings/level', sLevelRoutes);
router.use('/settings/modul', sModulRoutes);
router.use('/settings/profile-cabang', sProfileCabangRoutes);
router.use('/settings/provinsi', sProvinsiRoutes);

app.use('/api', router);

// ============================================
// DEFAULT API ENDPOINT
// ============================================

app.use('/api', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API PPBI is healthy',
    timestamp: new Date().toISOString(),
    documentation: `http://localhost:${process.env.PORT || 5000}/docs`,
  });
});

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Handle 404 - Route not found
 */
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    status: 'error',
    message: 'Route tidak ditemukan',
    path: req.path,
    method: req.method,
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(err.status || 500).json({
    code: err.status || 500,
    status: 'error',
    message: err.message || 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           🌳 API PPBI - Server Running                 ║
╚════════════════════════════════════════════════════════╝

📍 Informasi Server
   Base URL      : http://localhost:${PORT}
   API Endpoint  : http://localhost:${PORT}/api

📚 Dokumentasi API
   Swagger UI    : http://localhost:${PORT}/docs
   OpenAPI Spec  : http://localhost:${PORT}/api-spec
   Health Check  : http://localhost:${PORT}/docs-health

🗂️  File Lokasi
   Swagger HTML  : ./docs/swagger.html
   OpenAPI YAML  : ./docs/openapi.yaml

⚙️  Environment
   Node Env      : ${process.env.NODE_ENV || 'development'}
   Timestamp     : ${new Date().toISOString()}

════════════════════════════════════════════════════════
  `);
});

module.exports = app;

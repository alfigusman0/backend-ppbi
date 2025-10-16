// load env
require('dotenv').config();

// import libraries
const express = require('express');
const cors = require('cors');
const helmet = require("helmet");
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require("compression");

// initialize
const app = express()
const router = express.Router();

// helmet
app.use(helmet());

// morgan
app.use(morgan('dev'));

// body parser
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 50000
}))
app.use(bodyParser.json({
    limit: "500mb",
    extended: true,
    parameterLimit: 50000
}))

// Parse form-urlencoded
app.use(express.json({
    limit: "500mb"
}));
app.use(express.urlencoded({
    limit: "500mb",
    extended: true
}));

// cros middleware
app.use(cors());

// compression
app.use(compression());

if (process.env.NODE_ENV === 'production') {
    // whitelist ip address for production
    app.use((req, res, next) => {
        // allowed ips by env
        const allowedIps = process.env.ALLOWED_IPS.split(',');
        const clientIp = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip).split(',')[0].trim();
        if (allowedIps.includes(clientIp)) {
            next();
        } else {
            console.log('Forbidden, your ip is not allowed to access this resource. your ip is ' + clientIp);
            res.status(403).send('Forbidden, your ip is not allowed to access this resource. your ip is ' + clientIp);
        }
    });
}

const authRoutes = require('./routes/auth');
/* const awsRoutes = require('./routes/aws');*/
const cronejobRoutes = require('./routes/cronejob');
const ktaRoutes = require('./routes/kta');
const notifRoutes = require('./routes/notif');
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
const fBonsaiRoutes = require('./routes/formulir/bonsai');
const fPengantarRoutes = require('./routes/formulir/pengantar');
const fPenghargaanRoutes = require('./routes/formulir/penghargaan');
const fPenilaianRoutes = require('./routes/formulir/penilaian');

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

// use routes
router.use('/auth', authRoutes);
/* router.use('/aws', awsRoutes);*/
router.use('/cronejob', cronejobRoutes);
router.use('/kta', ktaRoutes);
router.use('/notif', notifRoutes);
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
router.use('/formulir/bonsai', fBonsaiRoutes);
router.use('/formulir/pengantar', fPengantarRoutes);
router.use('/formulir/penghargaan', fPenghargaanRoutes);
router.use('/formulir/penilaian', fPenilaianRoutes);

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
app.use('/api', (req, res, next) => {
    res.status(200).json({
        status: "OK",
        message: "Server is healthy",
        timestamp: Date.now(),
    });
})

app.listen(process.env.PORT, () => {
    console.log(`Example app listening at http://localhost:${process.env.PORT}`)
})
/* Libraries */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
/* Helpers */
const helper = require('../helpers/helper');
const response = require('../helpers/response');
/* Logger */
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.json()
    ),
    handleExceptions: true,
    handleRejections: true,
    transports: [
        new winston.transports.Console({}),
        new DailyRotateFile({
            filename: "./logs/log-%DATE%.log",
            zippedArchive: true,
            maxSize: "100m",
            maxFiles: "14d"
        }),
    ]
});

const Controller = {};


const handleError = (error, res) => {
    logger.error(error);
    return response.sc500('An error occurred in the system, please try again.', {}, res);
};

/* Create Hak Akses */
Controller.cj1 = async (req, res) => {
    try {
        let count_create = 0;
        let count_update = 0;
        const insertValues = [];
        const updateCases = [];
        const updateParams = [];

        // Get all levels and modules in one go
        const [getDataLevel, getDataModul] = await Promise.all([
            helper.runSQL({
                sql: "SELECT * FROM tbs_level",
                param: []
            }),
            helper.runSQL({
                sql: "SELECT * FROM tbs_modul",
                param: []
            })
        ]);

        // Collect all existing hak akses in one query
        const existingAccess = await helper.runSQL({
            sql: "SELECT ids_level, ids_modul FROM tbs_hak_akses",
            param: []
        });

        // Create a Set for quick lookup of existing access
        const existingAccessSet = new Set(
            existingAccess.map(row => `${row.ids_level}-${row.ids_modul}`)
        );

        // Process all combinations and prepare bulk operations
        for (const level of getDataLevel) {
            for (const modul of getDataModul) {
                const key = `${level.ids_level}-${modul.ids_modul}`;

                if (!existingAccessSet.has(key)) {
                    // Prepare for bulk insert
                    insertValues.push([
                        level.ids_level,
                        modul.ids_modul,
                        level.tingkat <= 4 ? modul.aksi : 'read,single',
                        1, // created_by
                    ]);
                    count_create++;
                } else if (level.tingkat <= 3) {
                    // Prepare for bulk update
                    updateCases.push(`WHEN ids_level = ? AND ids_modul = ? THEN ?`);
                    updateParams.push(level.ids_level, modul.ids_modul, modul.aksi);
                    count_update++;
                }
            }
        }

        // Execute bulk insert if there are records to insert
        if (insertValues.length > 0) {
            const placeholders = insertValues.map(() => "(?, ?, ?, ?)").join(",");
            await helper.runSQL({
                sql: `INSERT INTO tbs_hak_akses (ids_level, ids_modul, permission, created_by) VALUES ${placeholders}`,
                param: insertValues.flat()
            }).catch(error => {
                console.error("Error during bulk insert:", error);
                throw error;
            });
        }

        // Execute bulk update if there are records to update
        if (updateCases.length > 0) {
            const caseStatement = updateCases.join(" ");
            await helper.runSQL({
                sql: `UPDATE tbs_hak_akses SET permission = CASE ${caseStatement} END WHERE (ids_level, ids_modul) IN (${updateCases.map(() => "(?, ?)").join(", ")})`,
                param: [...updateParams, ...updateParams.filter((_, i) => i % 3 < 2)]
            }).catch(error => {
                console.error("Error during bulk update:", error);
                throw error;
            });
        }

        const message = 'Auto create default hak akses successfully.';
        const json = {
            created: count_create,
            updated: count_update
        };
        return response.sc200(message, json, res);
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
};

/* Create Event Settings */
Controller.cj2 = async (req, res) => {
    try {
        let count_create = 0;
        const insertValues = [];

        // Default settings
        const defaultSettings = {
            'Whatsapp': 'token-fonnte',
            'Metode Pembayaran': 'Masukkan metode pembayaran di sini',
            'Tanggal Awal Akses': '2025-01-01',
            'Tanggal Akhir Akses': '2025-12-31',
            'Tanggal Awal Pendaftaran': '2025-01-01',
            'Tanggal Akhir Pendaftaran': '2025-12-31',
            'Tanggal Awal Penilaian': '2025-01-01',
            'Tanggal Akhir Penilaian': '2025-12-31'
        };

        // Ambil semua event dengan status DITERIMA
        const eventList = await helper.runSQL({
            sql: "SELECT id_event FROM tbl_event WHERE status = 'DITERIMA'",
            param: []
        });

        if (eventList.length === 0) {
            return response.sc200(
                'No events with DITERIMA status found.', {
                    created: 0
                },
                res
            );
        }

        // Ambil semua setting yang sudah ada untuk event DITERIMA
        const existingSettings = await helper.runSQL({
            sql: `SELECT id_event, nama_setting FROM tbl_setting WHERE id_event IN (${eventList.map(() => '?').join(',')})`,
            param: eventList.map(e => e.id_event)
        });

        // Buat Set untuk lookup cepat
        const settingsMap = new Set(
            existingSettings.map(row => `${row.id_event}-${row.nama_setting}`)
        );

        // Proses setiap event dan setting default
        for (const event of eventList) {
            for (const [nama_setting, setting_value] of Object.entries(defaultSettings)) {
                const key = `${event.id_event}-${nama_setting}`;

                // Hanya INSERT jika belum ada
                if (!settingsMap.has(key)) {
                    insertValues.push([
                        event.id_event,
                        nama_setting,
                        setting_value,
                        1,
                    ]);
                    count_create++;
                }
            }
        }

        // Proses Bulk Insert jika ada data yang perlu diinsert
        if (insertValues.length > 0) {
            const placeholders = insertValues.map(() => "(?, ?, ?, ?)").join(",");
            await helper.runSQL({
                sql: `INSERT INTO tbl_setting (id_event, nama_setting, setting, created_by) VALUES ${placeholders}`,
                param: insertValues.flat()
            }).catch(error => {
                console.error("Error during bulk insert:", error);
                throw error;
            });
        }

        return response.sc200(
            'Auto create default settings successfully.', {
                created: count_create
            },
            res
        );
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
};

/* Create Event - Penjurian */
Controller.cj3 = async (req, res) => {
    try {
        let count_create = 0;
        let count_update = 0;
        const insertValues = [];

        // Ambil semua data juri dan formulir dengan JOIN untuk mendapatkan pasangan yang perlu diproses
        const juriFormulirPairs = await helper.runSQL({
            sql: `SELECT DISTINCT j.id_juri, j.id_profile, j.id_event, f.id_formulir FROM tbl_juri j INNER JOIN tbl_formulir f ON j.id_event = f.id_event WHERE j.penilaian = 'BELUM' ORDER BY j.id_juri, f.id_formulir`,
            param: []
        });

        if (juriFormulirPairs.length === 0) {
            return response.sc200(
                'No pending jury assessments found.', {
                    created: 0,
                    updated: 0
                },
                res
            );
        }

        // Ambil semua penilaian yang sudah ada untuk menghindari duplikasi
        const existingPenilaian = await helper.runSQL({
            sql: `SELECT id_formulir, id_profile FROM tbl_penilaian`,
            param: []
        });

        // Buat Set untuk lookup cepat penilaian yang sudah ada
        const existingPenilaianSet = new Set(
            existingPenilaian.map(row => `${row.id_formulir}-${row.id_profile}`)
        );

        // Kumpulkan id_juri yang unik untuk diupdate statusnya nanti
        const uniqueJuriIds = new Set();

        // Proses setiap pasangan juri-formulir
        for (const pair of juriFormulirPairs) {
            const key = `${pair.id_formulir}-${pair.id_profile}`;

            // Hanya INSERT jika belum ada penilaian untuk kombinasi formulir-juri ini
            if (!existingPenilaianSet.has(key)) {
                insertValues.push([
                    pair.id_formulir, // id_formulir
                    pair.id_profile, // id_profile (juri)
                    0.0, // penampilan (default 0)
                    0.0, // gerak_dasar (default 0)
                    0.0, // keserasian (default 0)
                    0.0, // kematangan (default 0)
                    0.0, // total (default 0)
                    1 // created_by
                ]);
                count_create++;

                // Kumpulkan id_juri untuk update status
                uniqueJuriIds.add(pair.id_juri);
            }
        }

        // Proses Bulk Insert jika ada data yang perlu diinsert
        if (insertValues.length > 0) {
            const placeholders = insertValues.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(",");
            await helper.runSQL({
                sql: `INSERT INTO tbl_penilaian (id_formulir, id_profile, penampilan, gerak_dasar, keserasian, kematangan, total, created_by) VALUES ${placeholders}`,
                param: insertValues.flat()
            }).catch(error => {
                console.error("Error during bulk insert:", error);
                throw error;
            });

            // Update status penilaian juri menjadi 'SUDAH' untuk juri yang sudah dibuatkan form penilaiannya
            if (uniqueJuriIds.size > 0) {
                const juriIdsArray = Array.from(uniqueJuriIds);
                const juriPlaceholders = juriIdsArray.map(() => '?').join(',');

                const updateResult = await helper.runSQL({
                    sql: `UPDATE tbl_juri SET penilaian = 'SUDAH', updated_by = 1, updated_at = NOW() WHERE id_juri IN (${juriPlaceholders})`,
                    param: juriIdsArray
                }).catch(error => {
                    console.error("Error during juri status update:", error);
                    throw error;
                });

                count_update = updateResult.affectedRows || juriIdsArray.length;
            }
        }

        return response.sc200(
            'Auto create default penjurian successfully.', {
                created: count_create,
                updated: count_update,
                message: `${count_create} penilaian forms created, ${count_update} jury status updated`
            },
            res
        );
    } catch (error) {
        console.log(error);
        return handleError(error, res);
    }
};


module.exports = Controller;
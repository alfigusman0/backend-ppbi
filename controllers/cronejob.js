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
                        level.tingkat <= 1 ? modul.aksi : 'read,single',
                        1, // created_by
                    ]);
                    count_create++;
                } else if (level.tingkat <= 1) {
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

module.exports = Controller;
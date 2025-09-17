const fs = require("fs");
const Redis = require("ioredis");

let redis = null;

if (process.env.REDIS_ACTIVE === "ON") {
    // Ambil konfigurasi dari environment
    const redisHosts = process.env.REDIS_HOST.split(",");
    const useTls = process.env.REDIS_USE_TLS === "true";
    const useCluster = process.env.REDIS_CLUSTER === "true";
    const caCertPath = process.env.REDIS_CA_CERT_PATH;

    // TLS options (jika ada)
    let tlsOptions = null;
    if (useTls) {
        tlsOptions = {
            rejectUnauthorized: true
        };

        if (caCertPath && fs.existsSync(caCertPath)) {
            tlsOptions.ca = fs.readFileSync(caCertPath);
            console.log(`✅ Using CA certificate at: ${caCertPath}`);
        } else {
            console.log(`⚠️ TLS enabled but CA cert not provided or not found at: ${caCertPath}`);
        }
    }

    if (useCluster) {
        // Redis Cluster Mode
        const clusterNodes = redisHosts.map((host) => ({
            host: host.trim(),
            port: parseInt(process.env.REDIS_PORT, 10),
            ...(useTls ? {
                tls: tlsOptions
            } : {}),
        }));

        console.log(`Connecting to Redis Cluster with ${useTls ? "TLS" : "TCP"}, nodes:`, clusterNodes);

        redis = new Redis.Cluster(clusterNodes, {
            slotsRefreshTimeout: 100000,
            scaleReads: "slave",
            redisOptions: {
                password: process.env.REDIS_PASS,
                db: parseInt(process.env.REDIS_DB || "0", 10),
                ...(useTls ? {
                    tls: tlsOptions
                } : {}),
                // ❌ Hapus keyPrefix: Tidak digunakan lagi
            },
        });
    } else {
        // Redis Standalone Mode
        const config = {
            host: redisHosts[0].trim(),
            port: parseInt(process.env.REDIS_PORT, 10),
            password: process.env.REDIS_PASS,
            db: parseInt(process.env.REDIS_DB || "0", 10),
            ...(useTls ? {
                tls: tlsOptions
            } : {}),
            // ❌ Hapus keyPrefix: Tidak digunakan lagi
        };

        console.log(`Connecting to single Redis instance with ${useTls ? "TLS" : "TCP"}:`, config);

        redis = new Redis(config);
    }

    // Event handler
    redis.on("connect", () => {
        console.log(`✅ Redis connected successfully (${useTls ? "TLS" : "TCP"})`);
    });

    redis.on("error", (err) => {
        console.error("❌ Redis error:", err.message);
        console.error("Error details:", {
            command: err.command,
            node: err.node || "unknown",
        });
    });
} else {
    console.log("⚠️ Redis is not active (REDIS_ACTIVE is not ON)");
}
module.exports = redis;
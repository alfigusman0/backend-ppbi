module.exports = {
    apps: [{
        name: "backend-ppbi",
        watch: true,
        watch_delay: 1000,
        script: "./server.js",
        ignore_watch: ["node_modules", "uploads", ".git", "package-lock.json", "logs"],
        instances: "max",
        exec_mode: "cluster",
        node_args: "--max-old-space-size=4096",
        max_memory_restart: '2G',
        autorestart: true,
    }]
}
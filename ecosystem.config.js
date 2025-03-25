module.exports = {
  apps: [
    {
      name: "server",
      script: "./server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      kill_timeout: 5000,
      max_memory_restart: "2048M",
    },
  ],
};

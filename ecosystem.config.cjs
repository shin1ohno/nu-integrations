module.exports = {
  apps: [
    {
      script: "./dist/index.js",
      watch: ".",
    }
  ],

  deploy: {
    production: {
      user: "admin",
      host: "node-red.home.local",
      ref: "origin/main",
      repo: "https://github.com/shin1ohno/nu-integrations.git",
      path: "/home/admin/nu-integrations",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.cjs --env production",
    },
  },
};

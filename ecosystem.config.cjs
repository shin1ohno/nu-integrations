module.exports = {
  apps: [
    {
      script: "./dist/index.js",
      watch: ".",
      name: "nu-integrations",
      env_production: {
        NODE_ENV: "production"
      },
      env_development: {
        NODE_ENV: "development"
      }
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
        "\. $HOME/.nvm/nvm.sh && npm install && pm2 reload ecosystem.config.cjs --env production",
    },
  },
};

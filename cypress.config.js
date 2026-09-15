const { defineConfig } = require("cypress");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

function ensureCaptchaServer() {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:5000/", (res) => {
      if (res.statusCode === 200) {
        console.log("Captcha server is already running on port 5000");
        return resolve();
      }
      startServer();
    });
    req.on("error", () => {
      startServer();
    });

    function startServer() {
      console.log("Starting captcha solver server on port 5000...");
      let pyCmd = "python3";
      const venvPy = path.join(__dirname, ".venv", "bin", "python");
      if (fs.existsSync(venvPy)) {
        pyCmd = venvPy;
      } else if (process.env.VIRTUAL_ENV) {
        pyCmd = path.join(process.env.VIRTUAL_ENV, "bin", "python");
      }

      const server = spawn(pyCmd, ["irctc-captcha-solver/app-server.py", "--host", "0.0.0.0", "--port", "5000"], {
        detached: true,
        stdio: "ignore"
      });
      server.unref();

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const checkReq = http.get("http://localhost:5000/", (res) => {
          if (res.statusCode === 200) {
            clearInterval(interval);
            console.log("Captcha server started successfully!");
            resolve();
          }
        });
        checkReq.on("error", () => {
          if (attempts > 30) {
            clearInterval(interval);
            console.error("Failed to start captcha server within 30s");
            resolve();
          }
        });
      }, 1000);
    }
  });
}

module.exports = defineConfig({
  projectId: '7afdkj',

  defaultCommandTimeout: 120000,
  // video: true,

  e2e: {
    async setupNodeEvents(on, config) {
      await ensureCaptchaServer();

      on('task', {
        log(message) {
          console.log(message + '\n\n');
          return null;
        },
      });
      return config;
    },
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true
  },
});

// update-app-config.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 1) Giữ logic cũ: đọc appName từ argv
const appName = process.argv[2];
if (!appName) {
  console.error('❌ Usage: node update-app-config.js <appName>');
  process.exit(1);
}

const rootDir = process.cwd();
const angularJsonPath = path.join(rootDir, 'angular.json');

// 2) Resolve distPath (ưu tiên đọc outputPath trong angular.json)
function resolveDistPath(appName) {
  // A) thử đọc outputPath từ angular.json
  if (fs.existsSync(angularJsonPath)) {
    try {
      const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf-8'));
      const project = angularJson.projects?.[appName] || angularJson.projects?.[angularJson.defaultProject];

      const outputPath = project?.architect?.build?.options?.outputPath;
      if (outputPath) {
        // outputPath có thể là string
        if (typeof outputPath === 'string') {
          return path.isAbsolute(outputPath) ? outputPath : path.join(rootDir, outputPath);
        }
        // hiếm gặp: outputPath không phải string -> fallback
      }
    } catch (e) {
      console.warn('⚠️ Không đọc được angular.json để lấy outputPath, sẽ fallback dist/<appName>.');
    }
  }

  // B) fallback kiểu cũ
  const legacy = path.join(rootDir, 'dist', appName);
  if (fs.existsSync(legacy)) return legacy;

  // C) fallback dist (workspace đơn giản)
  return path.join(rootDir, 'dist');
}

// 3) Đường dẫn config/env theo mô hình mới
const distPath = resolveDistPath(appName);

// baseConfigPath: bây giờ nằm ở root
const baseConfigPath = path.join(rootDir, 'app-config.json');

// env: chỉ còn root env (+ local override nếu cần)
const rootEnvPath = path.join(rootDir, '.env');
const localEnvPath = path.join(rootDir, '.env.local'); // optional

// output config vẫn ở ROOT (giữ logic cũ)
const outputCfgPath = path.join(rootDir, 'app-config.json');

// 4) Kiểm tra thư mục build
if (!fs.existsSync(distPath)) {
  console.error(`❌ Không tìm thấy folder build: ${distPath}`);
  console.error('👉 Hãy build trước: ng build');
  process.exit(1);
}

// 5) Đọc base config ở root hoặc dùng mặc định
let baseAppConfig = {};
if (fs.existsSync(baseConfigPath)) {
  baseAppConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf-8'));
} else {
  console.warn(`⚠️ Không tìm thấy file config tại ${baseConfigPath}, dùng giá trị mặc định`);
  baseAppConfig = {
    title: appName,
    headerColor: "#000000",
    headerTitle: appName,
    textColor: "white",
    leftButton: "back",
    statusBar: "normal"
  };
}

// 6) Quét dist để lấy list file (giữ logic cũ)
const files = fs.readdirSync(distPath);

// (Một số Angular build có thể output vào dist/<app>/browser => distPath bạn resolve đã đúng.
// Nếu distPath trỏ vào folder có browser/ thì bạn có thể nâng cấp thêm (mình để dưới phần note).)

const runtimeFiles   = files.filter(f => /^runtime.*\.js$/.test(f));
const polyfillsFiles = files.filter(f => /^polyfills.*\.js$/.test(f));
const vendorFiles    = files.filter(f => /^vendor.*\.js$/.test(f)); // có thể rỗng ở Angular mới
const mainFiles      = files.filter(f => /^main.*\.js$/.test(f));
const cssFiles       = files.filter(f => /^styles.*\.css$/.test(f));

const allJsFiles  = files.filter(f => /\.js$/.test(f));
const syncJsFiles = [...runtimeFiles, ...polyfillsFiles, ...vendorFiles, ...mainFiles];
const asyncJsFiles = allJsFiles.filter(f => !syncJsFiles.includes(f));

// 7) Kết hợp thành app-config và ghi ra ROOT (giữ đúng yêu cầu)
const appConfig = {
  app: { ...(baseAppConfig.app ?? baseAppConfig) },
  listCSS: cssFiles,
  listSyncJS: syncJsFiles,
  listAsyncJS: asyncJsFiles
};

fs.writeFileSync(outputCfgPath, JSON.stringify(appConfig, null, 2));
console.log('✅ Đã update app-config.json tại ROOT:', outputCfgPath);

// 8) Đọc env root
let envVars = {};
if (fs.existsSync(rootEnvPath)) {
  envVars = dotenv.parse(fs.readFileSync(rootEnvPath, 'utf-8'));
}

// 9) Override env bằng .env.local (thay cho apps/<appName>/.env)
if (fs.existsSync(localEnvPath)) {
  const localVars = dotenv.parse(fs.readFileSync(localEnvPath, 'utf-8'));
  envVars = { ...envVars, ...localVars };
}

// 10) Bổ sung biến động
envVars.APP_NAME = appName;

// 11) Ghi lại .env ở project root
const outputEnv = Object.entries(envVars)
  .map(([key, val]) => `${key}=${val}`)
  .join('\n') + '\n';

fs.writeFileSync(rootEnvPath, outputEnv);
console.log('✅ Đã cập nhật .env ở project root (APP_NAME=' + appName + ')');

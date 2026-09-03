// pull-config.js
//
// Kéo config build của mini app từ hcc-admin-api thay vì chép tay vào environment.
//
//   npm run pull-config                          -> chọn doanh nghiệp từ danh sách
//   npm run pull-config -- --business=xa-long-hung --yes   -> không hỏi (CI)
//   npm run pull-config -- --env=dev             -> ghi environment.ts thay vì .prod
//
// Thứ DUY NHẤT thực sự cần lấy về là `zaloAppId`: nó vừa là khoá resolve tenant của mọi API
// public, vừa là thành phần của `zaloBaseHref`. Trước đây appId phải gõ tay ở 3 chỗ (.env,
// apiConfig.appId, zaloBaseHref) — lệch một ký tự ở zaloBaseHref là app trắng màn hình.
//
// KHÔNG kéo ZMP_TOKEN: đó là token deploy gắn với tài khoản Zalo của từng người, không thuộc
// doanh nghiệp. Nó nằm ở .env và lệnh này không bao giờ động vào.

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = __dirname;

/**
 * apiUrl vừa là nơi lệnh này gọi tới, vừa là giá trị ghi vào file environment — cùng một hằng số,
 * nên không thể lệch nhau. Đây cũng là lý do apiUrl KHÔNG lấy từ BE: muốn hỏi BE thì đã phải biết
 * địa chỉ BE rồi.
 */
const ENV_PRESETS = {
  prod: {
    apiUrl: 'https://api.zalo.hungyen.vn',
    production: true,
    target: 'src/environments/environment.prod.ts',
    // Mini app chạy trong Zalo được phục vụ dưới /zapps/<appId>/ — base href phải khớp,
    // nếu không mọi asset và route đều 404.
    baseHref: (appId) => `/zapps/${appId}/`,
  },
  dev: {
    apiUrl: 'http://127.0.0.1:8001',
    production: false,
    target: 'src/environments/environment.ts',
    baseHref: () => '',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tham số dòng lệnh
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { env: 'prod', business: null, yes: false, apiUrl: null, token: null };

  for (const raw of argv) {
    const [key, ...rest] = raw.replace(/^--/, '').split('=');
    const value = rest.join('=');

    switch (key) {
      case 'env': args.env = value; break;
      case 'business': args.business = value; break;
      case 'api-url': args.apiUrl = value; break;
      case 'token': args.token = value; break;
      case 'yes': case 'y': args.yes = true; break;
      case 'help': case 'h': usage(); process.exit(0);
      default:
        fail(`Tham số không hiểu: --${key}`, ['Chạy `npm run pull-config -- --help` để xem cách dùng.']);
    }
  }

  if (!ENV_PRESETS[args.env]) {
    fail(`--env không hợp lệ: ${args.env}`, [`Chọn một trong: ${Object.keys(ENV_PRESETS).join(', ')}`]);
  }

  return args;
}

function usage() {
  console.log(`
Kéo config doanh nghiệp từ hcc-admin-api và ghi vào file environment.

  npm run pull-config                              chọn doanh nghiệp từ danh sách
  npm run pull-config -- --business=<code> --yes   không hỏi (dùng cho CI)
  npm run pull-config -- --env=dev                 ghi environment.ts (mặc định: prod)

Tuỳ chọn:
  --env=prod|dev     môi trường build (mặc định prod)
  --business=<code>  mã doanh nghiệp, bỏ qua bước chọn
  --yes, -y          không hỏi xác nhận trước khi ghi đè
  --api-url=<url>    trỏ sang BE khác (mặc định theo --env)
  --token=<token>    token build, thay cho biến môi trường

Token: đặt BUILD_CONFIG_TOKEN trong .env.local (đã gitignore) hoặc biến môi trường.
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Đọc token
// ─────────────────────────────────────────────────────────────────────────────

/** Parse .env tối giản — đủ cho KEY=value, bỏ qua comment và dòng trống. */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf-8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;

    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function resolveToken(args) {
  // .env.local trước .env: token build là thứ của từng máy, không nên nằm trong .env vốn đang
  // được commit. Biến môi trường thắng tất cả để CI truyền qua secret.
  const fromFiles = {
    ...parseEnvFile(path.join(ROOT, '.env')),
    ...parseEnvFile(path.join(ROOT, '.env.local')),
  };

  const token = args.token || process.env.BUILD_CONFIG_TOKEN || fromFiles.BUILD_CONFIG_TOKEN;

  if (!token) {
    fail('Thiếu BUILD_CONFIG_TOKEN', [
      'Tạo file .env.local ở thư mục gốc mini app với nội dung:',
      '',
      '    BUILD_CONFIG_TOKEN=<token do người quản trị BE cấp>',
      '',
      'Token này khớp với BUILD_CONFIG_TOKEN trong .env của hcc-admin-api.',
    ]);
  }

  return token;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gọi API
// ─────────────────────────────────────────────────────────────────────────────

async function callApi(apiUrl, endpoint, body, token) {
  const url = `${apiUrl.replace(/\/+$/, '')}/api/v1/build-config/${endpoint}`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Build-Token': token,
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (err) {
    fail(`Không kết nối được tới ${url}`, [String(err.message || err)]);
  }

  const text = await res.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // BE trả HTML = gọi nhầm host (vd trỏ vào Admin FE thay vì subdomain api.), rất dễ mắc.
    fail(`Phản hồi không phải JSON từ ${url} (HTTP ${res.status})`, [
      'Kiểm tra --api-url có trỏ đúng host API không.',
      text.slice(0, 200),
    ]);
  }

  if (json.code !== 1) {
    fail(`API báo lỗi (HTTP ${res.status}, ${json.errorCode || 'UNKNOWN'})`, json.messages || []);
  }

  return json.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chọn doanh nghiệp
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_LABEL = { xa: 'Xã/Phường', truong: 'Trường học' };

function printBusinessTable(list) {
  const width = (arr, min) => Math.max(min, ...arr.map((s) => [...s].length));
  const codes = list.map((b) => b.code);
  const names = list.map((b) => b.name);

  const wIdx = String(list.length).length;
  const wCode = width(codes, 4);
  const wName = width(names, 8);

  console.log('');
  console.log(
    `  ${'#'.padEnd(wIdx)}  ${'Mã'.padEnd(wCode)}  ${'Tên'.padEnd(wName)}  Loại`
  );
  console.log(`  ${'─'.repeat(wIdx)}  ${'─'.repeat(wCode)}  ${'─'.repeat(wName)}  ────────────`);

  list.forEach((b, i) => {
    // Đánh dấu ngay dòng nào không build được, để người dùng không chọn rồi mới báo lỗi.
    const warn = b.hasZaloAppId ? '' : '   ⚠ chưa có Zalo App ID';
    console.log(
      `  ${String(i + 1).padEnd(wIdx)}  ${b.code.padEnd(wCode)}  ${b.name.padEnd(wName)}  ` +
      `${(TYPE_LABEL[b.type] || b.type).padEnd(12)}${warn}`
    );
  });
  console.log('');
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function chooseBusiness(list) {
  if (!process.stdin.isTTY) {
    fail('Không có terminal tương tác để chọn doanh nghiệp', [
      'Truyền thẳng mã: npm run pull-config -- --business=<code> --yes',
    ]);
  }

  printBusinessTable(list);

  while (true) {
    const answer = await ask(`Chọn doanh nghiệp cần build [1-${list.length}], Enter để huỷ: `);
    if (!answer) fail('Đã huỷ.', []);

    const index = Number(answer);
    if (Number.isInteger(index) && index >= 1 && index <= list.length) {
      return list[index - 1];
    }

    console.log(`  ✗ Nhập số từ 1 đến ${list.length}.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sinh file
// ─────────────────────────────────────────────────────────────────────────────

/** Chuỗi vào literal TS — chặn nháy đơn/backslash trong tên đơn vị làm hỏng file sinh ra. */
function tsString(value) {
  return `'${String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function renderEnvironmentFile(config, preset, envName) {
  const appId = config.zaloAppId;

  // `features` là ảnh chụp lúc build, dùng bởi ApiInterceptor trước khi BusinessConfigService kịp
  // tải. Mặc định bật, cờ từ BE đè lên — thiếu cờ không được hiểu là tắt.
  const features = { authEnabled: true, feedbackSubmit: true, ...(config.featureFlags || {}) };
  const featureLines = Object.entries(features)
    .map(([key, value]) => `    ${key}: ${value === false ? 'false' : 'true'}`)
    .join(',\n');

  return `// ⚠ FILE TỰ SINH — ĐỪNG SỬA TAY.
// Sinh bởi: npm run pull-config -- --env=${envName}
// Doanh nghiệp: ${config.businessName} (${config.businessCode})
// Thời điểm: ${new Date().toISOString()}
//
// Sửa giá trị ở Admin (Super Admin > Doanh nghiệp) rồi chạy lại lệnh trên.
import {envbase} from './env.const';

export const environment = {
  ...envbase,
  production: ${preset.production},
  zaloBaseHref: ${tsString(preset.baseHref(appId))},
  apiUrl: ${tsString(preset.apiUrl)},
  apiPrefix: '/api/v1',
  apiConfig: {
    appId: ${tsString(appId)}
  },
  features: {
${featureLines}
  },
  OAId: ${tsString(config.zaloOaId || '')}
};
`;
}

/**
 * Ghi APP_ID vào .env theo kiểu MERGE THEO DÒNG — giữ nguyên mọi khoá khác, đặc biệt là
 * ZMP_TOKEN. Ghi đè cả file sẽ thổi bay token deploy của người đang dùng máy.
 */
function writeAppIdToEnv(appId) {
  const envPath = path.join(ROOT, '.env');
  const lines = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)
    : [];

  let replaced = false;
  const next = lines.map((line) => {
    if (!/^\s*APP_ID\s*=/.test(line)) return line;
    replaced = true;
    return `APP_ID=${appId}`;
  });

  if (!replaced) {
    // Chèn lên đầu cho khớp thứ tự sẵn có của file.
    next.unshift(`APP_ID=${appId}`);
  }

  // Bảo đảm đúng một dòng trống cuối file.
  while (next.length && next[next.length - 1].trim() === '') next.pop();
  fs.writeFileSync(envPath, next.join('\n') + '\n');

  return replaced;
}

function fail(title, details = []) {
  console.error(`\n✗ ${title}`);
  for (const line of details) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const preset = ENV_PRESETS[args.env];
  const apiUrl = args.apiUrl || preset.apiUrl;
  const token = resolveToken(args);

  console.log(`\n→ Lấy danh sách doanh nghiệp từ ${apiUrl} ...`);
  const list = await callApi(apiUrl, 'businesses', {}, token);

  if (!Array.isArray(list) || list.length === 0) {
    fail('BE không trả về doanh nghiệp nào đang hoạt động.', []);
  }

  let code = args.business;
  if (code) {
    const found = list.find((b) => b.code === code);
    if (!found) {
      printBusinessTable(list);
      fail(`Không có doanh nghiệp nào mã "${code}"`, ['Chọn một mã trong bảng trên.']);
    }
  } else {
    code = (await chooseBusiness(list)).code;
  }

  const config = await callApi(apiUrl, 'resolve', { code }, token);
  const targetPath = path.join(ROOT, preset.target);

  console.log('');
  console.log(`  Doanh nghiệp   ${config.businessName} (${config.businessCode})`);
  console.log(`  App ID         ${config.zaloAppId}`);
  console.log(`  OA ID          ${config.zaloOaId || '(chưa cấu hình)'}`);
  console.log(`  zaloBaseHref   ${preset.baseHref(config.zaloAppId) || '(rỗng)'}`);
  console.log(`  apiUrl         ${preset.apiUrl}`);
  console.log('');

  if (!config.zaloOaId) {
    console.log('  ⚠ Chưa có OA ID — nút "Quan tâm OA" và mở chat sẽ không hoạt động.\n');
  }

  if (!args.yes) {
    const answer = await ask(`Ghi đè ${preset.target} và .env (APP_ID)? [y/N] `);
    if (!/^y(es)?$/i.test(answer)) fail('Đã huỷ, không ghi gì.', []);
  }

  fs.writeFileSync(targetPath, renderEnvironmentFile(config, preset, args.env));
  console.log(`\n✓ ${preset.target}`);

  const replaced = writeAppIdToEnv(config.zaloAppId);
  console.log(`✓ .env — ${replaced ? 'cập nhật' : 'thêm'} APP_ID, giữ nguyên ZMP_TOKEN`);

  fs.writeFileSync(
    path.join(ROOT, '.build-target.json'),
    JSON.stringify({
      businessCode: config.businessCode,
      businessName: config.businessName,
      zaloAppId: config.zaloAppId,
      env: args.env,
      pulledAt: new Date().toISOString(),
    }, null, 2) + '\n',
  );
  console.log('✓ .build-target.json');

  // `zmp login` tự làm mới ZMP_TOKEN và ghi lại vào .env (kèm APP_ID lấy từ JWT) — không cần
  // truyền token bằng tay. Nhưng chính vì nó cũng ghi APP_ID: đăng nhập nhầm app sẽ lặng lẽ đè
  // APP_ID vừa lấy ở trên, nên nhắc đối chiếu trước khi deploy.
  console.log(`
Tiếp theo:
  npm run build && npm run update-config
  zmp login                     # quét QR, tự làm mới ZMP_TOKEN trong .env
  zmp deploy -o dist/zma-app    # thêm -t để đẩy bản testing

⚠ Chạy zmp từ đúng thư mục này (nó đọc .env theo cwd), và sau khi login kiểm tra
  APP_ID trong .env vẫn là ${config.zaloAppId} — login nhầm app sẽ đè giá trị này.
`);
}

main();

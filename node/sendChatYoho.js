require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ======================================================================
// ゆびすいWEB（サイト修正依頼 / WEB診断結果）レコード作成通知
//   バッチ実行されると、対象アプリ（1881 / 1884）に新規作成されたレコードを検知し、
//   Chatworkの共通ルームへ toAll で通知する。引数は不要。
//   （DataSpider 側は「このスクリプトを定期バッチ実行する」だけでよい）
//
//   新規判定：前回処理した最大レコード番号($id)を state ファイルに保存し、差分を通知。
//   初回実行：現在の最大レコード番号を基準として保存するだけ（既存分は通知しない）。
// ======================================================================

// ---- 共通設定 ----
const KINTONE_DOMAIN = 'https://yubisui.cybozu.com';
const GUEST_SPACE_ID = 72; // ゲストスペースID（apps 1881 / 1884 が所属）

// Chatwork APIトークン（環境変数があれば優先。なければ下の '' に直書きしてください）
const CHATWORK_API_TOKEN = process.env.CHATWORK_TOKEN || '9d9621343ed56f2e187c9ca92e840b6f';

// 1件送信ごとの待機ミリ秒（Chatwork APIレート制限対策）
const SEND_INTERVAL_MS = 1000;
// 1回のバッチで処理する新規レコードの上限（超過分は次回以降に処理）
const MAX_PER_RUN = 100;

// ---- アプリ別設定 ----
// apiToken：レコード取得に使用（環境変数があれば優先、なければ下の '' に直書き）
const APP_CONFIG = {
  1881: {
    apiToken: process.env.KINTONE_TOKEN_1881 || 'I2qFELxceAYipOgecfEhJawBLXSp9bhIJepwzY2u',
    roomId: '444137269', // 送信先チャット: https://www.chatwork.com/#!rid444137269
    companyField: '顧客名', // レコードから法人名を取り出すフィールドコード
    title: '★サイト修正依頼が作成されました★',
    lead: '新規のWEBサイト修正依頼が作成されました。下記より確認お願いします。',
    companyLabel: '顧客名',
    // 顧客名の下に追加で表示する行（label：フィールド値。空欄時は empty を表示）
    extraLines: [{ label: '更新希望日', field: '更新希望日', empty: 'なし' }],
  },
  1884: {
    apiToken: process.env.KINTONE_TOKEN_1884 || 'PgqVZhe0bKEJ3PBM0xiQcQyqNwTOird3FoSqoUfp',
    roomId: '384819858', // 送信先チャット: https://www.chatwork.com/#!rid384819858
    companyField: '法人名',
    title: '☆WEB診断結果が作成されました☆',
    lead: '新規のWEB診断結果が作成されました。下記より確認お願いします。',
    companyLabel: '法人名・園名',
  },
};

// ---- 状態ファイル（前回処理した最大レコード番号を保持）----
const STATE_DIR = path.join(__dirname, 'state');
const STATE_FILE = path.join(STATE_DIR, 'sendChatYoho_state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {}; // 初回など、ファイルが無ければ空
  }
}

function saveState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ---- ログ ----
const now = new Date();
const logFileName = `sendChatYoho_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.txt`;
const logFilePath = path.join(__dirname, 'log', logFileName);
const logBuffer = [];

function writeLog(line) {
  const ts = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  logBuffer.push(`[${ts}] ${line}`);
  console.log(line);
}

function flushLog() {
  fs.mkdirSync(path.join(__dirname, 'log'), { recursive: true });
  fs.writeFileSync(logFilePath, logBuffer.join('\n') + '\n', 'utf8');
}

// kintone（ゲストスペース）: 現在の最大レコード番号を取得（初回基準用）
async function getMaxRecordId(appId, apiToken) {
  const res = await axios.get(`${KINTONE_DOMAIN}/k/guest/${GUEST_SPACE_ID}/v1/records.json`, {
    headers: { 'X-Cybozu-API-Token': apiToken },
    params: { app: appId, query: 'order by $id desc limit 1' },
  });
  const rec = res.data.records[0];
  return rec ? Number(rec.$id.value) : 0;
}

// kintone（ゲストスペース）: lastId より新しいレコードを昇順で取得
async function getNewRecords(appId, apiToken, lastId) {
  const res = await axios.get(`${KINTONE_DOMAIN}/k/guest/${GUEST_SPACE_ID}/v1/records.json`, {
    headers: { 'X-Cybozu-API-Token': apiToken },
    params: {
      app: appId,
      query: `$id > ${lastId} order by $id asc limit ${MAX_PER_RUN}`,
    },
  });
  return res.data.records;
}

// Chatworkの指定ルームへメッセージ送信
async function sendToChatwork(roomId, message) {
  await axios.post(
    `https://api.chatwork.com/v2/rooms/${roomId}/messages`,
    new URLSearchParams({ body: message }),
    {
      headers: {
        'X-ChatWorkToken': CHATWORK_API_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
}

// 1レコード分の通知メッセージを組み立て
function buildMessage(appId, cfg, record) {
  const recordId = Number(record.$id.value);
  const companyName = record[cfg.companyField]?.value || '';
  const recordUrl = `${KINTONE_DOMAIN}/k/guest/${GUEST_SPACE_ID}/${appId}/show#record=${recordId}`;

  // アプリ固有の追加行（例：1881 は「更新希望日」）を顧客名の下に挿入
  let extra = '';
  for (const ex of cfg.extraLines || []) {
    const val = record[ex.field]?.value || ex.empty || '';
    extra += `${ex.label}：${val}\n`;
  }

  return (
    '[toall]\n' +
    `[info][title]${cfg.title}[/title]${cfg.lead}\n` +
    `${cfg.companyLabel}：${companyName}\n` +
    extra +
    `${recordUrl}\n` +
    '[/info]'
  );
}

// 1アプリ分の処理（新規レコードを通知し、state を更新）
async function processApp(appId, cfg, state) {
  if (!cfg.apiToken) {
    writeLog(`⚠️ [${appId}] kintone APIトークン未設定のためスキップ`);
    return;
  }

  // 初回（stateに記録が無い）は現在の最大IDを基準値にするだけ（既存分は通知しない）
  if (state[appId] == null) {
    const maxId = await getMaxRecordId(appId, cfg.apiToken);
    state[appId] = maxId;
    saveState(state);
    writeLog(`ℹ️ [${appId}] 初回のため基準値を設定（lastId=${maxId}）。既存レコードは通知しません。`);
    return;
  }

  const lastId = Number(state[appId]) || 0;
  const records = await getNewRecords(appId, cfg.apiToken, lastId);

  if (records.length === 0) {
    writeLog(`… [${appId}] 新規レコードなし（lastId=${lastId}）`);
    return;
  }

  writeLog(`📦 [${appId}] 新規レコード ${records.length} 件（lastId=${lastId}）`);

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const recordId = Number(record.$id.value);
    const companyName = record[cfg.companyField]?.value || '';
    const message = buildMessage(appId, cfg, record);

    try {
      await sendToChatwork(cfg.roomId, message);
      writeLog(`✅ [${appId}] 送信成功 roomId=${cfg.roomId} recordId=${recordId} ${cfg.companyLabel}:${companyName}`);
      // 成功した分だけ lastId を進めて保存（途中失敗時の取りこぼし防止）
      state[appId] = recordId;
      saveState(state);
    } catch (err) {
      // 送信失敗：ここで中断し、この recordId は次回リトライ（lastId は進めない）
      writeLog(`❌ [${appId}] 送信失敗 recordId=${recordId} エラー:${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
      writeLog(`↩️ [${appId}] recordId=${recordId} 以降は次回実行で再試行します`);
      return;
    }

    if (i < records.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));
    }
  }
}

async function main() {
  writeLog('===== 処理開始 =====');

  if (!CHATWORK_API_TOKEN) {
    writeLog('❌ Chatwork APIトークンが未設定です');
    return;
  }

  const state = loadState();

  for (const appId of Object.keys(APP_CONFIG)) {
    try {
      await processApp(appId, APP_CONFIG[appId], state);
    } catch (err) {
      writeLog(`❌ [${appId}] 処理中エラー:${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  }
}

(async () => {
  // 実行のたびに、ログ/状態ファイルの絶対パスを標準出力に表示（DataSpiderの実行ログでも確認可能）
  console.log('[sendChatYoho] script    =', __filename);
  console.log('[sendChatYoho] logFile   =', logFilePath);
  console.log('[sendChatYoho] stateFile =', STATE_FILE);
  try {
    await main();
  } catch (err) {
    writeLog(`❌ 想定外のエラー: ${err.message}`);
  } finally {
    writeLog('===== 処理完了 =====');
    flushLog();
  }
  // DataSpiderの「外部アプリケーション起動」は非ゼロ終了をエラー扱いにするため、常に正常終了(0)で返す
  process.exit(0);
})();

/**
 * app356 -> guest space app1899 daily sync
 *
 * npm install @kintone/rest-api-client
 */

const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

const DOMAIN = 'yubisui.cybozu.com';

const SOURCE_APP_ID = 356;
const DEST_APP_ID = 1899;
const DEST_GUEST_SPACE_ID = 72;

const SOURCE_API_TOKEN = 'dq8oog56t2Qbipa1JUxwauCD9Th1DFELiu5LhlN4'; // app356: 閲覧権限
const DEST_API_TOKEN = 'qrHExE93R5BPkyXKhuF5bTps08X2IsacmyG0kfiP';   // app1899: 閲覧・追加・編集権限

const KEY_FIELD = '顧客先コード';

// app1899側にのみ存在する、app356のレコード番号格納用フィールド
const SOURCE_RECORD_NO_FIELD = 'app356レコード番号';

// app1899側にのみ存在する、app356の該当レコードへのリンク格納用フィールド
const LINK_FIELD = 'リンク';

// app356レコード番号を元に、app356の該当レコードへ遷移するURLを生成する
function buildSourceRecordUrl(recordNo) {
  if (!recordNo) {
    return '';
  }
  return `https://${DOMAIN}/k/${SOURCE_APP_ID}/show#record=${recordNo}`;
}

const SYNC_FIELDS = [
  '文字列_表示顧問先名',
  '顧客先コード',
  '文字列_個人法人',
  '電話番号',
  '郵便番号_法人登記',
  '都道府県_法人登記',
  '市区町村_法人登記',
  '住所_法人登記',
  '郵便番号_個人',
  '都道府県_個人',
  '市区町村_個人',
  '住所_個人'
];

const sourceClient = new KintoneRestAPIClient({
  baseUrl: `https://${DOMAIN}`,
  auth: {
    apiToken: SOURCE_API_TOKEN
  }
});

const destClient = new KintoneRestAPIClient({
  baseUrl: `https://${DOMAIN}`,
  auth: {
    apiToken: DEST_API_TOKEN
  },
  guestSpaceId: DEST_GUEST_SPACE_ID
});

function toKintoneRecord(src) {
  const record = {};

  for (const field of SYNC_FIELDS) {
    record[field] = {
      value: src[field]?.value || ''
    };
  }

  const sourceRecordNo = src.$id?.value || '';

  record[SOURCE_RECORD_NO_FIELD] = {
    value: sourceRecordNo
  };

  record[LINK_FIELD] = {
    value: buildSourceRecordUrl(sourceRecordNo)
  };

  return record;
}

function isSameRecord(src, dest) {
  const isSameSyncFields = SYNC_FIELDS.every((field) => {
    const srcValue = src[field]?.value || '';
    const destValue = dest[field]?.value || '';
    return srcValue === destValue;
  });

  if (!isSameSyncFields) {
    return false;
  }

  const srcRecordNo = src.$id?.value || '';
  const destSourceRecordNo = dest[SOURCE_RECORD_NO_FIELD]?.value || '';

  if (srcRecordNo !== destSourceRecordNo) {
    return false;
  }

  const srcLink = buildSourceRecordUrl(srcRecordNo);
  const destLink = dest[LINK_FIELD]?.value || '';

  return srcLink === destLink;
}

async function getAllSourceRecords() {
  return sourceClient.record.getAllRecords({
    app: SOURCE_APP_ID,
    fields: ['$id', ...SYNC_FIELDS],
    condition: `${KEY_FIELD} != ""`,
    orderBy: `${KEY_FIELD} asc`
  });
}

async function getAllDestRecords() {
  return destClient.record.getAllRecords({
    app: DEST_APP_ID,
    fields: ['$id', SOURCE_RECORD_NO_FIELD, LINK_FIELD, ...SYNC_FIELDS],
    condition: `${KEY_FIELD} != ""`,
    orderBy: `${KEY_FIELD} asc`
  });
}

async function main() {
  console.log('=== sync start ===');

  if (!SOURCE_API_TOKEN || !DEST_API_TOKEN) {
    throw new Error('SOURCE_API_TOKEN または DEST_API_TOKEN が未設定です。');
  }

  const sourceRecords = await getAllSourceRecords();
  const destRecords = await getAllDestRecords();

  const destMap = new Map();

  for (const dest of destRecords) {
    const code = dest[KEY_FIELD]?.value;
    if (code) {
      destMap.set(code, dest);
    }
  }

  const addRecords = [];
  const updateRecords = [];
  let skipCount = 0;

  for (const src of sourceRecords) {
    const code = src[KEY_FIELD]?.value;

    if (!code) {
      skipCount++;
      continue;
    }

    const dest = destMap.get(code);

    if (!dest) {
      addRecords.push(toKintoneRecord(src));
      continue;
    }

    if (!isSameRecord(src, dest)) {
      updateRecords.push({
        id: dest.$id.value,
        record: toKintoneRecord(src)
      });
    }
  }

  if (addRecords.length > 0) {
    await destClient.record.addAllRecords({
      app: DEST_APP_ID,
      records: addRecords
    });
  }

  if (updateRecords.length > 0) {
    await destClient.record.updateAllRecords({
      app: DEST_APP_ID,
      records: updateRecords
    });
  }

  console.log(`source count : ${sourceRecords.length}`);
  console.log(`dest count   : ${destRecords.length}`);
  console.log(`add count    : ${addRecords.length}`);
  console.log(`update count : ${updateRecords.length}`);
  console.log(`skip count   : ${skipCount}`);

  console.log('=== sync end ===');
}

main().catch((error) => {
  console.error('=== sync error ===');
  console.error(error);
  process.exit(1);
});
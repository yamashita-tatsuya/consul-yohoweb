const { KintoneRestAPIClient } = require('@kintone/rest-api-client')

// 診断結果アプリ（https://yubisui.cybozu.com/k/guest/72/1884/）
const APP_ID = 1884
const GUEST_SPACE_ID = 72

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// 結果詳細（複数行文字列）を組み立てる
// セクションごとに空行区切りで、全項目を ○/× 付きで並べる
function buildDetails(sections) {
  return sections
    .map((s) => {
      const lines = [s.title || '']
      if (Array.isArray(s.items) && s.items.length > 0) {
        // 全項目：対応済み=○、未対応=×
        s.items.forEach((it) => lines.push(`${it.checked ? '○' : '×'}${it.text}`))
      } else if (Array.isArray(s.undone) && s.undone.length > 0) {
        // 後方互換：undone（未対応のみ）が来た場合は × のみ
        s.undone.forEach((text) => lines.push(`×${text}`))
      } else {
        lines.push('（項目がありません）')
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const {
      companyName = '',
      email = '',
      score = 0,
      sections = [],
    } = body

    // フロントで整形済みの詳細文字列があればそれを優先、なければ sections から組み立て
    const details =
      typeof body.details === 'string' && body.details.length > 0
        ? body.details
        : buildDetails(sections)

    const client = new KintoneRestAPIClient({
      baseUrl: `https://${process.env.KINTONE_DOMAIN}`,
      auth: {
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
      },
      guestSpaceId: GUEST_SPACE_ID,
    })

    const { id } = await client.record.addRecord({
      app: APP_ID,
      record: {
        法人名: { value: companyName },
        メールアドレス: { value: email },
        結果スコア: { value: String(score) },
        結果詳細: { value: details },
      },
    })

    console.info(`kintone result record created: id=${id}`)

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        recordId: id,
      }),
    }
  } catch (e) {
    console.error('saveKintoneResult error:', e)

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: e.message || 'Internal Server Error',
      }),
    }
  }
}

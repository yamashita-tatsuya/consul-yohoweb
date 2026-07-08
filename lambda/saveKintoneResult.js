const { KintoneRestAPIClient } = require('@kintone/rest-api-client')
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')

// 診断結果アプリ（https://yubisui.cybozu.com/k/guest/72/1884/）
const APP_ID = 1884
const GUEST_SPACE_ID = 72

// 自動返信メールの送信元アドレス（SESで検証済み）
const MAIL_FROM = process.env.MAIL_FROM || 'hiraguri-moe@yubisui.co.jp'

// SESクライアント（リージョンはLambdaの実行リージョンを既定に）
const sesClient = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION || 'ap-northeast-1',
})

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
      const lines = [`${s.title || ''}--------------------`]
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

// JST基準の YYYY/M/D（ゼロ埋めなし）を返す
function jstDate() {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date())
}

// 診断結果メールの本文を組み立てる
function buildResultMailBody({ companyName, date, score, advice, details }) {
  const lines = []
  lines.push(`${companyName || ''} ご担当者様`)
  lines.push('')
  lines.push('園のWEB活用診断をご利用いただきありがとうございます。')
  lines.push(`${date}の診断結果をお送りします。`)
  lines.push('')
  lines.push('──────────────────────')
  lines.push('【診断結果】')
  lines.push('')
  lines.push(`----------${score}％${advice && advice.title ? `（${advice.title}）` : ''}----------`)
  if (advice && advice.body) lines.push(advice.body)
  lines.push('')
  lines.push('【診断詳細】')
  lines.push(details)
  lines.push('')
  lines.push('──────────────────────')
  lines.push('')
  lines.push('診断結果に基づいて、改善点を確認しましょう。')
  lines.push('WEB運営の改善のお困りごとは、ゆびすいまでお気軽にご相談ください。')
  lines.push('https://yubisui.site/contact/')
  lines.push('')
  lines.push('※このメールは自動送信です。ご返信いただいても対応できませんのでご了承ください。')
  lines.push('')
  lines.push('株式会社ゆびすいコンサルティング')
  return lines.join('\n')
}

// 診断者へ結果メールを送信する（SES）
async function sendResultMail({ to, companyName, date, score, advice, details }) {
  const command = new SendEmailCommand({
    Source: MAIL_FROM,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: {
        Data: '【ゆびすい】園のWEB活用診断結果をお送りします',
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: buildResultMailBody({ companyName, date, score, advice, details }),
          Charset: 'UTF-8',
        },
      },
    },
  })
  await sesClient.send(command)
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
      advice = null,
    } = body

    // メール本文に表示する日付（フロントから来ればそれを、なければJST当日）
    const date =
      typeof body.date === 'string' && body.date.length > 0 ? body.date : jstDate()

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

    // 診断者へ結果メールを送信（レコードは保存済みのため、メール失敗でも処理は成功扱い）
    let mailSent = false
    if (email) {
      try {
        await sendResultMail({ to: email, companyName, date, score, advice, details })
        mailSent = true
        console.info(`result mail sent to ${email}`)
      } catch (mailErr) {
        console.error('sendResultMail error:', mailErr)
      }
    } else {
      console.warn('email is empty; skip result mail')
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        recordId: id,
        mailSent,
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

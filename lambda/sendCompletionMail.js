const { KintoneRestAPIClient } = require('@kintone/rest-api-client')
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')

// サイト修正依頼アプリ（https://yubisui.cybozu.com/k/guest/72/1881/）
const APP_ID = 1881
const GUEST_SPACE_ID = 72

// 完了メールの送信元アドレス（SESで検証済み・saveKintone.js と共通）
const MAIL_FROM = process.env.MAIL_FROM || 'hp-support@yubisui.co.jp'

const sesClient = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION || 'ap-northeast-1',
})

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// 送信対象の抽出条件（クエリ部分）：「ステータス確認」に「完了」チェックがあるレコード。
// ※ 日時フィールドはクエリで is empty が使えないため、
//   「完了メール送信日時が空」の判定はコード側で行う（下の handler 参照）。
const TARGET_CONDITION = 'ステータス確認 in ("完了")'

// 完了メールの本文を組み立てる
function buildMailBody({ contactName, companyName, requestNo, items, desiredDate, note }) {
  const lines = []
  lines.push(`${companyName || ''}`)
  lines.push(`${contactName || 'ご担当者'} 様`)
  lines.push('')
  lines.push('ご依頼いただいたWEB修正依頼について、対応が完了いたしました。')
  lines.push('ご確認お願いいたします。')
  lines.push('')
  lines.push(`依頼No：${requestNo}`)
  lines.push('')
  lines.push('──────────────────────')
  lines.push('【ご依頼内容】')
  ;(items || []).forEach((item, i) => {
    lines.push('')
    lines.push(`●修正内容${i + 1}`)
    lines.push('')
    lines.push('対象ページのURL：')
    lines.push(`${item.siteUrl || ''}`)
    lines.push('')
    lines.push('修正箇所・変更内容：')
    lines.push(`${item.description || ''}`)
    const fileNames = (item.files || []).map((f) => f.name).filter(Boolean)
    if (fileNames.length > 0) {
      lines.push('')
      lines.push('添付資料：')
      lines.push(`${fileNames.join('、')}`)
    }
  })
  lines.push('')
  lines.push(`更新希望日：${desiredDate || 'なし'}`)
  if (note) {
    lines.push('')
    lines.push('備考：')
    lines.push(`${note}`)
  }
  lines.push('──────────────────────')
  lines.push('')
  lines.push('新規の修正依頼はこちらからご連絡ください。')
  lines.push('https://consul-web.yubisui-portal.net/update-request')
  lines.push('※このメールは自動送信です。ご返信いただいても対応できませんのでご了承ください。')
  lines.push('')
  lines.push('株式会社ゆびすいコンサルティング')
  return lines.join('\n')
}

// 完了メールを送信する（SES）
async function sendCompletionMail({ to, contactName, companyName, requestNo, items, desiredDate, note }) {
  const command = new SendEmailCommand({
    Source: MAIL_FROM,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: {
        Data: `【ゆびすい】WEB修正依頼の作業が完了しました（依頼No：${requestNo}）`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: buildMailBody({ contactName, companyName, requestNo, items, desiredDate, note }),
          Charset: 'UTF-8',
        },
      },
    },
  })
  await sesClient.send(command)
}

// kintoneレコード（サブテーブル含む）から buildMailBody 用のデータを組み立てる
function toMailData(record) {
  const items = (record.詳細?.value || []).map((row) => ({
    siteUrl: row.value.修正対象URL?.value || '',
    description: row.value.修正内容?.value || '',
    files: (row.value.添付ファイル?.value || []).map((f) => ({ name: f.name })),
  }))
  return {
    email: record.メールアドレス?.value || '',
    contactName: record.担当者名?.value || '',
    companyName: record.顧客名?.value || '',
    requestNo: record.依頼No?.value || '',
    desiredDate: record.更新希望日?.value || '',
    note: record.備考?.value || '',
    items,
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  const client = new KintoneRestAPIClient({
    baseUrl: `https://${process.env.KINTONE_DOMAIN}`,
    auth: {
      username: process.env.KINTONE_USERNAME,
      password: process.env.KINTONE_PASSWORD,
    },
    guestSpaceId: GUEST_SPACE_ID,
  })

  let sent = 0
  let failed = 0
  let skipped = 0

  try {
    // 「完了」チェックのレコードを全件取得（自動ページング）し、
    // 「完了メール送信日時」が空のものだけを送信対象にする
    const allCompleted = await client.record.getAllRecords({ app: APP_ID, condition: TARGET_CONDITION })
    const records = allCompleted.filter((r) => !r.完了メール送信日時?.value)
    console.info(`sendCompletionMail: 完了 ${allCompleted.length} 件中、未送信 ${records.length} 件`)

    for (const record of records) {
      const id = record.$id.value
      const data = toMailData(record)

      if (!data.email) {
        console.warn(`recordId=${id}: メールアドレスが空のためスキップ`)
        skipped++
        continue
      }

      try {
        await sendCompletionMail({ to: data.email, ...data })

        // 送信成功後に「完了メール送信日時」を記録（重複送信防止）
        await client.record.updateRecord({
          app: APP_ID,
          id,
          record: { 完了メール送信日時: { value: new Date().toISOString() } },
        })

        console.info(`recordId=${id}: 完了メール送信 → ${data.email}`)
        sent++
      } catch (mailErr) {
        // 送信失敗：送信日時は更新しない（次回実行で再試行される）
        console.error(`recordId=${id}: 完了メール送信失敗:`, mailErr)
        failed++
      }
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, sent, failed, skipped }),
    }
  } catch (e) {
    console.error('sendCompletionMail error:', e)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: e.message || 'Internal Server Error', sent, failed, skipped }),
    }
  }
}

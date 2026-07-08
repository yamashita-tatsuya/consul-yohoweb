const { KintoneRestAPIClient } = require('@kintone/rest-api-client')
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')

const APP_ID = 1881

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

async function uploadFile(client, file) {
  const buffer = Buffer.from(file.data, 'base64')
  const { fileKey } = await client.file.uploadFile({
    file: {
      name: file.name,
      data: buffer,
      type: file.type || 'application/octet-stream',
    },
  })
  return { fileKey }
}

// 依頼No採番：YYYYMMDD001 ～ YYYYMMDD999
async function createRequestNo(client) {
  const now = new Date()

  // JST基準で YYYYMMDD を作成
  const yyyymmdd = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .replaceAll('/', '')

  const resp = await client.record.getRecords({
    app: APP_ID,
    query: 'order by $id desc limit 500',
    fields: ['依頼No'],
  })

  const seqList = resp.records
    .map((r) => String(r.依頼No.value || ''))
    .filter((no) => no.startsWith(yyyymmdd))
    .map((no) => Number(no.slice(-3)))
    .filter((seq) => !Number.isNaN(seq))

  const nextSeq = seqList.length > 0 ? Math.max(...seqList) + 1 : 1

  if (nextSeq > 999) {
    throw new Error('本日の依頼Noが999件を超えました。')
  }

  return `${yyyymmdd}${String(nextSeq).padStart(3, '0')}`
}

// 自動返信メールの本文を組み立てる
function buildMailBody({ contactName, companyName, requestNo, items, desiredDate, note }) {
  const lines = []
  lines.push(`${companyName || ''}`)
  lines.push(`${contactName || 'ご担当者'} 様`)
  lines.push('')
  lines.push('WEB修正依頼をお送りいただき、誠にありがとうございます。')
  lines.push('以下の内容で受け付けいたしました。')
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
  if (desiredDate) {
    lines.push('')
    lines.push(`更新希望日：${desiredDate}`)
  }
  if (note) {
    lines.push('')
    lines.push('備考：')
    lines.push(`${note}`)
  }
  lines.push('──────────────────────')
  lines.push('')
  lines.push('内容を確認の上、順次対応・連絡いたします。')
  lines.push('※このメールは自動送信です。ご返信いただいても対応できませんのでご了承ください。')
  lines.push('')
  lines.push('株式会社ゆびすいコンサルティング')
  return lines.join('\n')
}

// 依頼者へ自動返信メールを送信する（SES）
async function sendConfirmationMail({ to, contactName, companyName, requestNo, items, desiredDate, note }) {
  const command = new SendEmailCommand({
    Source: MAIL_FROM,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: {
        Data: `【ゆびすい】WEB修正依頼を受け付けました（依頼No：${requestNo}）`,
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
      contactName = '',
      email = '',
      phone = '',
      desiredDate = null,
      note = '',
      items = [],
    } = body

    const client = new KintoneRestAPIClient({
      baseUrl: `https://${process.env.KINTONE_DOMAIN}`,
      auth: {
        username: process.env.KINTONE_USERNAME,
        password: process.env.KINTONE_PASSWORD,
      },
      guestSpaceId: 72,
    })

    // サブテーブル行を組み立て（ファイルは先にアップロード）
    const subtableRows = await Promise.all(
      items.map(async (item) => {
        const fileKeys = await Promise.all(
          (item.files || []).map((f) => uploadFile(client, f))
        )

        return {
          value: {
            修正対象URL: { value: item.siteUrl || '' },
            修正内容: { value: item.description || '' },
            添付ファイル: { value: fileKeys },
          },
        }
      })
    )

    // 依頼Noを採番
    const requestNo = await createRequestNo(client)

    const { id } = await client.record.addRecord({
      app: APP_ID,
      record: {
        依頼No: { value: requestNo },
        顧客名: { value: companyName },
        担当者名: { value: contactName },
        メールアドレス: { value: email },
        電話番号: { value: phone },
        更新希望日: { value: desiredDate || null },
        備考: { value: note },
        詳細: { value: subtableRows },
      },
    })

    console.info(`kintone record created: id=${id}, requestNo=${requestNo}`)

    // 依頼者へ自動返信メールを送信（レコードは保存済みのため、メール失敗でも処理は成功扱い）
    let mailSent = false
    if (email) {
      try {
        await sendConfirmationMail({
          to: email,
          contactName,
          companyName,
          requestNo,
          items,
          desiredDate,
          note,
        })
        mailSent = true
        console.info(`confirmation mail sent to ${email}`)
      } catch (mailErr) {
        console.error('sendConfirmationMail error:', mailErr)
      }
    } else {
      console.warn('email is empty; skip confirmation mail')
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        recordId: id,
        requestNo,
        mailSent,
      }),
    }
  } catch (e) {
    console.error('saveKintone error:', e)

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: e.message || 'Internal Server Error',
      }),
    }
  }
}
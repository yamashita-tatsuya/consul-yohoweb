const { KintoneRestAPIClient } = require('@kintone/rest-api-client')

const APP_ID = 1881

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

exports.handler = async (event) => {
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
            修正内容:   { value: item.description || '' },
            添付ファイル: { value: fileKeys },
          },
        }
      })
    )

    const { id } = await client.record.addRecord({
      app: APP_ID,
      record: {
        顧客名:         { value: companyName },
        担当者名:       { value: contactName },
        メールアドレス: { value: email },
        電話番号:       { value: phone },
        更新希望日:     { value: desiredDate || null },
        備考:           { value: note },
        詳細:           { value: subtableRows },
      },
    })

    console.info(`kintone record created: id=${id}`)
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, recordId: id }),
    }
  } catch (e) {
    console.error('saveKintone error:', e)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: e.message || 'Internal Server Error' }),
    }
  }
}

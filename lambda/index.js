require('dotenv').config()
const saveKintone = require('./saveKintone')
const saveKintoneResult = require('./saveKintoneResult')
const sendCompletionMail = require('./sendCompletionMail')
const createUploadUrl = require('./createUploadUrl')

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  const path = event.rawPath || '/'

  // 添付ファイルのS3アップロード用の署名付きURLを発行
  if (path === '/createUploadUrl') {
    return createUploadUrl.handler(event)
  }

  if (path === '/saveKintone') {
    return saveKintone.handler(event)
  }

  if (path === '/saveKintoneResult') {
    return saveKintoneResult.handler(event)
  }

  // 完了メール送信（DataSpider等から定期的に呼び出す想定。入力不要）
  if (path === '/sendCompletionMail') {
    return sendCompletionMail.handler(event)
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: `Not Found: ${path}` }),
  }
}

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

// 添付ファイルの一時アップロード先S3バケット（環境変数で指定）
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET
const KEY_PREFIX = process.env.UPLOAD_KEY_PREFIX || 'uploads/'
const URL_EXPIRES_SEC = 300 // 署名付きURLの有効期限（5分）

const s3Client = new S3Client({
  region: process.env.S3_REGION || process.env.AWS_REGION || 'ap-northeast-1',
})

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// 一意なS3キーを生成（ファイル本体はキーで管理し、元のファイル名は payload で別途保持）
function buildKey() {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${KEY_PREFIX}${Date.now()}-${rand}`
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  try {
    if (!UPLOAD_BUCKET) {
      throw new Error('UPLOAD_BUCKET（アップロード先S3バケット）が未設定です')
    }

    const key = buildKey()

    // ContentType は署名に含めない（ブラウザ側のヘッダー差異で署名不一致になるのを避ける）。
    // 実ファイルの種類は saveKintone 側へ payload で渡す name/type を使用する。
    const command = new PutObjectCommand({ Bucket: UPLOAD_BUCKET, Key: key })
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: URL_EXPIRES_SEC })

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ uploadUrl, key }),
    }
  } catch (e) {
    console.error('createUploadUrl error:', e)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: e.message || 'Internal Server Error' }),
    }
  }
}

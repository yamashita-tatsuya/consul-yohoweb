// メールアドレス形式チェック（HTML5準拠の実用的なパターン）
// ローカル部 / ドメイン部にラベル単位の妥当性を要求し、TLDを必須とする
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export const isValidEmail = (value) => EMAIL_REGEX.test((value || '').trim())

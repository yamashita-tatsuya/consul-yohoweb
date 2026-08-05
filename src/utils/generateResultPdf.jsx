/* eslint-disable react-refresh/only-export-components */
import { Document, Page, Text, View, Image, StyleSheet, Font, pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'

// お問い合わせページ（QRコードのリンク先）
const CONTACT_URL =
  'https://yubisui.site/contact/?utm_source=web-check&utm_medium=report_qr&utm_campaign=web-check_inquiry'

// 日本語フォント（Noto Sans JP / 英数字も収録）を登録。
// public/fonts 配下に同梱しており、PDF生成時にのみ読み込まれる。
Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: '/fonts/NotoSansJP-Regular.otf', fontWeight: 'normal' },
    { src: '/fonts/NotoSansJP-Bold.otf', fontWeight: 'bold' },
  ],
})

// 折り返し制御：
//  - 長いASCIIトークン（URL等）は任意位置で折り返せるよう1文字ずつに分割（QRへの重なり・見切れ防止）
//  - それ以外（日本語など）はそのまま（不要なハイフネーションを避ける）
Font.registerHyphenationCallback((word) => {
  if (word.length > 20 && /^[\x00-\x7F]+$/.test(word)) {
    return word.split('')
  }
  return [word]
})

const TEAL = '#41a3a1'
const RED = '#d32f2f'
const GREEN = '#2e9e5b'
const GREY = '#666666'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    color: '#2f2725',
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 40,
    lineHeight: 1.5,
  },
  headerDate: { textAlign: 'right', fontSize: 9, color: GREY, marginBottom: 4 },
  title: { fontSize: 23, fontWeight: 'bold', textAlign: 'center', color: TEAL },
  metaBox: { marginTop: 26, marginBottom: 16 },
  metaRow: { flexDirection: 'row', marginBottom: 2 },
  metaLabel: { width: 90, color: GREY },
  metaValue: { flex: 1 },
  overallBox: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: TEAL,
    padding: 12,
    marginBottom: 18,
    alignItems: 'center',
  },
  overallScore: { fontSize: 16, fontWeight: 'bold' },
  adviceTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 10 },
  adviceBody: { fontSize: 9, color: GREY, textAlign: 'center', marginTop: 8 },
  section: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: TEAL,
    color: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  sectionTitle: { fontSize: 11, fontWeight: 'bold' },
  sectionScore: { fontSize: 11, fontWeight: 'bold' },
  sectionBody: {
    border: `1pt solid #cccccc`,
    borderTop: 'none',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  undoneLabel: { color: RED, fontWeight: 'bold', marginBottom: 3 },
  undoneRow: { flexDirection: 'row', marginBottom: 2 },
  undoneMark: { width: 12, color: RED },
  undoneText: { flex: 1 },
  doneText: { color: GREEN },
  contactBox: {
    border: `1pt solid ${TEAL}`,
    borderRadius: 4,
    padding: 12,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: { flex: 1, paddingRight: 12 },
  contactTitle: { fontSize: 12, fontWeight: 'bold', color: TEAL, marginBottom: 4 },
  contactBody: { fontSize: 9, color: GREY },
  contactUrl: { fontSize: 9, color: TEAL, marginTop: 4 },
  qrImage: { width: 84, height: 84 },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: GREY,
  },
})

function ResultDocument({ data }) {
  const { companyName, email, date, overall, advice, pages, qrDataUrl } = data
  return (
    <Document title="園のWEB活用診断結果" author="株式会社ゆびすいコンサルティング">
      <Page size="A4" style={styles.page}>
        <Text style={styles.headerDate}>診断日：{date}</Text>
        <Text style={styles.title}>園のWEB活用診断結果</Text>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>法人名・園名</Text>
            <Text style={styles.metaValue}>{companyName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>メールアドレス</Text>
            <Text style={styles.metaValue}>{email}</Text>
          </View>
        </View>

        <View style={[styles.overallBox, { borderColor: overall.color }]}>
          <Text style={styles.overallScore}>
            総合スコア {overall.done} / {overall.total} 項目（{overall.pct}%）
          </Text>
          <Text style={[styles.adviceTitle, { color: overall.color }]}>{advice.title}</Text>
          <Text style={styles.adviceBody}>{advice.body}</Text>
        </View>

        {pages.map((p, i) => (
          <View key={i} style={styles.section} wrap={false}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{p.title}</Text>
              {p.total > 0 && (
                <Text style={styles.sectionScore}>
                  {p.done} / {p.total}（{p.pct}%）
                </Text>
              )}
            </View>
            <View style={styles.sectionBody}>
              {p.total === 0 ? (
                <Text style={{ color: GREY }}>（項目を準備中です）</Text>
              ) : p.undone.length > 0 ? (
                <>
                  <Text style={styles.undoneLabel}>未対応の項目</Text>
                  {p.undone.map((text, j) => (
                    <View key={j} style={styles.undoneRow}>
                      <Text style={styles.undoneMark}>×</Text>
                      <Text style={styles.undoneText}>{text}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.doneText}>すべての項目に対応されています。</Text>
              )}
            </View>
          </View>
        ))}

        {qrDataUrl && (
          <View style={styles.contactBox} wrap={false}>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>WEB集客のご相談・お問い合わせ（無料）</Text>
              <Text style={styles.contactBody}>
                WEBサイト制作・改修／Googleマップ整備／SNS導線設計など、園児募集に{'\n'}
                向けた改善はゆびすいにご相談ください。{'\n'}
                ※QRコードよりお問い合わせいただけます。
              </Text>
              <Text style={styles.contactUrl}>{CONTACT_URL}</Text>
            </View>
            <Image style={styles.qrImage} src={qrDataUrl} />
          </View>
        )}

        <Text style={styles.footer} fixed>
          © {new Date().getFullYear()} 株式会社ゆびすいコンサルティング
        </Text>
      </Page>
    </Document>
  )
}

export async function generateResultPdfBlob(data) {
  // 固定URLからQRコード（PNG dataURL）を生成して埋め込む
  const qrDataUrl = await QRCode.toDataURL(CONTACT_URL, { margin: 1, width: 240 })
  return pdf(<ResultDocument data={{ ...data, qrDataUrl }} />).toBlob()
}

// 診断結果の「5段階評価」に関するロジックと文言を集約するモジュール。
// 判定ロジック（パーセンテージ→レベル）と表示用の文言・色をここに一元管理し、
// 画面（CheckListResult）・PDF（generateResultPdf）の両方から同じ内容を利用する。

// パーセンテージ → 評価レベル（1〜5）。★の数・色・コメントの選択に共通で使う
export function levelForPct(pct) {
  if (pct <= 19) return 1
  if (pct <= 39) return 2
  if (pct <= 59) return 3
  if (pct <= 79) return 4
  return 5
}

// 分野別★の「色を埋める数」（1〜5）。コメント判定(levelForPct)とは別のしきい値。
//   〜20%:1 / 〜40%:2 / 〜60%:3 / 〜80%:4 / 81〜100%:5
export function starsForPct(pct) {
  if (pct <= 20) return 1
  if (pct <= 40) return 2
  if (pct <= 60) return 3
  if (pct <= 80) return 4
  return 5
}

// レベル別の色（1:赤 → 5:緑）。総合スコアの★・数値・コメントタイトルに使用
export const LEVEL_COLORS = {
  1: '#d32f2f', // 未整備：赤
  2: '#f2792b', // 要改善：橙
  3: '#e0a80e', // 改善余地あり：黄
  4: '#7cb342', // 良好：黄緑
  5: '#2e9e5b', // 非常に良好：緑
}

// 総合評価コメント（レベル別）。title は【】無しで保持し、表示側で【】を付ける
export const OVERALL_ADVICE = {
  1: {
    title: '未整備',
    body: '必要な情報が十分に届けられていない状態です。まずはWeb上の基本情報を正しく整えることが重要です。',
  },
  2: {
    title: '要改善',
    body: '改善すべき項目が多く残っています。まずは基本情報の整備から着手しましょう。',
  },
  3: {
    title: '改善余地あり',
    body: 'Web活用に向けた取り組みは進められていますが、必要な情報が十分に届いていない可能性があります。優先順位を決めて段階的に整備しましょう。',
  },
  4: {
    title: '良好',
    body: 'Web上で情報を届けるための基本的な環境は、おおむね整っています。弱い分野を重点的に改善しましょう。',
  },
  5: {
    title: '非常に良好',
    body: 'Web上で選ばれるための基本的な環境が、高い水準で整っています。今後は各媒体を連動させ、継続的に成果を高める運用へ移行していきましょう。',
  },
}

// 分野別評価コメント（分野キー × レベル）。キーは checkListData の PAGE_ORDER と一致させる
export const FIELD_COMMENTS = {
  web: {
    5: 'Webサイトは必要な情報が十分に整備されています。今後は実績や利用者の声など、選ばれる理由をさらに充実させましょう。',
    4: 'Webサイトの基本情報はおおむね整っています。一部の不足情報や導線を見直しましょう。',
    3: '利用者が判断するために必要な情報が十分でない可能性があります。基本情報を優先して整えましょう。',
    2: 'Webサイトの情報が限られています。古い情報の更新と基本情報の追加から取り組みましょう。',
    1: 'Webサイトを通じた情報提供がほとんどできていません。まずは基本情報を掲載した受け皿の整備が必要です。',
  },
  google: {
    5: 'Google検索やGoogleマップ上の情報が十分に整っています。写真、最新情報、口コミ対応を継続しましょう。',
    4: 'Googleビジネスプロフィールの基本情報は整っています。写真追加や口コミ返信で信頼感を高められます。',
    3: '判断材料が不足しています。基本情報の正確性を確認し、写真や特徴を追加しましょう。',
    2: '十分に活用されていません。住所、電話番号、営業時間などを優先して整えましょう。',
    1: 'Google検索やGoogleマップ上の情報が未整備です。登録・整備を優先しましょう。',
  },
  sns: {
    5: 'SNSを活用した継続的な情報発信ができています。Webサイトや問い合わせへの導線も意識しましょう。',
    4: 'SNSでの情報発信は行われています。目的と対象者を明確にし、定期発信を続けましょう。',
    3: 'SNSアカウントはあるものの、十分に活用されていません。定期的に発信しましょう。',
    2: 'SNSでの情報発信が限定的です。媒体を絞り、継続できる頻度で投稿を始めましょう。',
    1: 'SNSを通じた情報発信が行われていません。利用者層に合った媒体を一つ選びましょう。',
  },
}

// 分野・パーセンテージから分野別コメントを取得（対象項目が無い場合は空文字）
export function fieldCommentFor(pageKey, pct, hasItems = true) {
  if (!hasItems) return ''
  const table = FIELD_COMMENTS[pageKey]
  return table ? table[levelForPct(pct)] : ''
}

// 総合結果コメント（OVERALL_ADVICE.body）に続けて表示する、3分野の組み合わせパターン別コメント
export const PATTERN_COMMENTS = {
  allEqual: '3分野は同程度の達成状況です。全体を段階的に底上げしましょう。',
  highLevel: '3分野すべてが高い水準で整っています。成果につながる発信へ発展させていく段階です。',
  fullReview: '3分野すべてに改善の余地があります。まずはWebサイトとGoogleの基本情報を整え、その後SNSへ広げましょう。',
  focused: '分野によって取り組みに大きな差があります。最も低い分野を優先して整えましょう。',
  weakness: '低い分野が情報発信全体の効果を弱めている可能性があります。弱点分野を優先的に改善しましょう。',
  balanced: '3分野は比較的バランスよく整備されています。各媒体を連動させましょう。',
}

// 3分野の達成率(%)配列から、総合パターンの追加コメントを判定する。
// 判定は「値ベース」で相互排他。上から順に最初に該当したもので確定する。
// ※ 3分野いずれかが判定不能（%が数値でない）な場合は空文字を返す
export function overallPatternComment(pcts) {
  if (!Array.isArray(pcts) || pcts.length !== 3 || pcts.some((p) => typeof p !== 'number')) {
    return ''
  }
  const max = Math.max(...pcts)
  const min = Math.min(...pcts)

  // ⓪ 3分野すべて同点（最優先の終端分岐）
  if (max === min) return PATTERN_COMMENTS.allEqual
  // ① 全分野80%以上
  if (pcts.every((p) => p >= 80)) return PATTERN_COMMENTS.highLevel
  // ② 全分野40%未満
  if (pcts.every((p) => p < 40)) return PATTERN_COMMENTS.fullReview
  // ③ 最大差40%以上
  if (max - min >= 40) return PATTERN_COMMENTS.focused
  // ④ いずれか40%未満
  if (pcts.some((p) => p < 40)) return PATTERN_COMMENTS.weakness
  // 【3】上記以外：バランス型
  return PATTERN_COMMENTS.balanced
}

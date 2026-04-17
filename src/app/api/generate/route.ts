import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// タイムアウト設定
export const maxDuration = 60;

function validateOutput(narration: string, telop: string): string[] {
  const errors: string[] = [];

  const narrationBlocks = narration.trim().split(/\n\s*\n/);
  const telopBlocks = telop.trim().split(/\n\s*\n/);

  // 1. ブロック数の完全一致
  if (narrationBlocks.length !== telopBlocks.length) {
    errors.push(`ブロック数が一致しません。ナレーションは${narrationBlocks.length}ブロックですが、テロップは${telopBlocks.length}ブロックです。`);
  }

  // 2. テロップのルールチェック
  telopBlocks.forEach((block, index) => {
    const lines = block.split('\n').map(l => l.trim());
    
    // 最大2行まで
    if (lines.length > 2) {
      errors.push(`テロップのブロック${index + 1}が${lines.length}行になっています。最大2行までにしてください。`);
    }

    lines.forEach((line, lineIndex) => {
      // 14文字以内
      if (line.length > 14) {
        errors.push(`テロップのブロック${index + 1}の${lineIndex + 1}行目が14文字を超えています（${line.length}文字: "${line}"）。`);
      }
      // 句読点（。）禁止
      if (line.includes('。')) {
        errors.push(`テロップのブロック${index + 1}の${lineIndex + 1}行目に句読点（。）が含まれています。`);
      }
    });
  });

  // 3. 全体ルール（禁止用語など）
  if (telop.toLowerCase().includes('lemon 8') || telop.toLowerCase().includes('レモン8') || telop.toLowerCase().includes('レモンエイト')) {
    errors.push(`ブランド名は「Lemon8」で統一してください（カタカナ・平仮名・空白入りは禁止）。`);
  }
  if (narration.includes('パン') && !narration.includes('フライパン') && narration.includes('料理')) {
    // 簡易チェック
    errors.push(`料理の文脈で「フライパン」を「パン」と略さないでください。`);
  }
  if (narration.includes('かも') || telop.includes('かも')) {
    errors.push(`語尾に「〜かも」等の曖昧表現を使わないでください。`);
  }

  return errors;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, baseScript, topic, details, hookDirection } = body;

    if (!apiKey || !baseScript || !topic || !details) {
      return NextResponse.json({ error: '必須項目が不足しています。' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
# 役割
数々のバズ動画を手掛けてきた「TikTok/Lemon8専門の構成作家」として、既存のベース台本を新しい題材に合わせてリメイクしてください。

# ワークフロー
1. 【情報収集】: 与えられた詳細情報に基づき、手順の正誤、固有名詞の表記、コンプライアンスを精査する。（※今回はWeb検索ツールの代わりに、あなたの知識と与えられた詳細情報で代用してください）
2. 【構造解析】: 入力された「ベース台本」のブロックごとの役割（煽り、解決策など）を特定し、その「構造」と「テンポ」を完全に維持する。
3. 【生成】: 下記の出力形式に基づき、ナレーションとテロップを生成する。

# 出力形式
あなたは必ず以下のJSONフォーマットで出力しなければなりません。マークダウンの\`\`\`jsonなどの装飾は不要です。純粋なJSON文字列のみを出力してください。
{
  "narration": "ナレーションのテキスト（空行でブロックを区切る）",
  "telop": "テロップのテキスト（空行でブロックを区切る）"
}

## 1. 【ナレーション版】 (narration)
- 30〜40秒尺。
- 自然な口語、短文、断定表現。
- 語尾に「〜かも」等の曖昧表現を使わない。
- フライパンを「パン」と略さない。

## 2. 【テロップ版】 (telop)
- ナレーションとブロック数を100%一致させる。
- 各ブロック間に空行を1行入れる。
- 1ブロック最大2行まで。
- 1行あたり14文字以内。
- 句読点（。）は使用不可。
- ブランド名は「Lemon8」で固定。

## 3. 【固定パート】（改変禁止・テロップも同一ルール適用）
台本の最後に、以下の内容を今回の題材に合わせた[ジャンル名]（例：掃除術、時短レシピ等）で補完して追加してください。
※テロップ版に追加する際も、1行14文字以内・1ブロック最大2行・句読点なしのルールを必ず守るように改行や句読点削除を調整してください。

こういう[ジャンル名]、Lemon8で見つけたんだ。
Lemon8なら[ジャンル名]のコツが動画で探しやすいし、
保存して見返せるのも便利。失敗したくない人は、
Lemon8で探してみて。
`;

    const userPrompt = `
# ベース台本
${baseScript}

# 今回の題材
${topic}

# 詳細情報
${details}

# フックの方向性
${hookDirection || 'お任せ'}
`;

    const MAX_RETRIES = 3;
    let finalNarration = '';
    let finalTelop = '';
    let attempt = 0;
    let lastErrors: string[] = [];

    // 会話履歴を保持するための配列
    let contents: any[] = [
      { role: 'user', parts: [{ text: userPrompt }] }
    ];

    while (attempt < MAX_RETRIES) {
      attempt++;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('LLMからの応答が空でした。');
      }

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        contents.push({ role: 'model', parts: [{ text: responseText }] });
        contents.push({ role: 'user', parts: [{ text: 'JSONフォーマットが不正です。正しいJSONで出力してください。' }] });
        continue;
      }

      const narration = parsed.narration || '';
      const telop = parsed.telop || '';

      const errors = validateOutput(narration, telop);

      if (errors.length === 0) {
        finalNarration = narration;
        finalTelop = telop;
        break; // 成功
      } else {
        lastErrors = errors;
        // エラーをフィードバックして自己修正させる
        contents.push({ role: 'model', parts: [{ text: responseText }] });
        contents.push({
          role: 'user',
          parts: [{ text: `以下のルール違反が見つかりました。これらのエラーを修正して、もう一度JSONで出力してください。\n\nエラー内容:\n- ${errors.join('\n- ')}` }]
        });
      }
    }

    if (finalNarration && finalTelop) {
      return NextResponse.json({ narration: finalNarration.trim(), telop: finalTelop.trim() });
    } else {
      return NextResponse.json(
        { error: `自動修正を${MAX_RETRIES}回試みましたが、ルール違反を解消できませんでした。手動で調整してください。\n\n残存エラー:\n- ${lastErrors.join('\n- ')}` },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { error: error.message || 'サーバー内部エラーが発生しました。APIキーが正しいかご確認ください。' },
      { status: 500 }
    );
  }
}

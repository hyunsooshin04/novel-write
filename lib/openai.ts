import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateWorldbuilding(title: string, genre: string, keywords: string, overview: string) {
  const keywordArray = keywords ? keywords.split(",").map((k) => k.trim()) : []

  const prompt = `
당신은 세계관 디자이너입니다. 아래 정보를 바탕으로 소설의 세계관을 구성해 주세요.

- 제목: ${title}
- 장르: ${genre}
- 키워드: ${keywordArray.join(", ")}
- 개요: ${overview}

다음 네 가지 항목에 대해 각각 작성해주세요:

background: ${genre} 장르에 맞는 세계의 기본 배경과 설정을 설명해주세요.

history: 이 세계의 주요 역사적 사건들과 시대적 흐름을 설명해주세요.

mythology: 세계의 신화, 전설, 종교적 배경을 설명해주세요.

rules: 이 세계만의 특별한 법칙, 규칙, 시스템(마법, 기술 등)을 설명해주세요.

각 항목은 2-3 문단으로 구성해주세요. 항목 이름(background, history 등)을 명확히 표시하고, 그 뒤에 내용을 작성해주세요.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 창의적인 소설 세계관을 만드는 전문가입니다. 주어진 형식을 정확히 따라 상세하고 흥미로운 세계관을 제공해주세요.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    })

    const content = completion.choices[0].message.content

    if (!content) {
      throw new Error("AI 응답을 받을 수 없습니다.")
    }

    console.log("AI Response:", content) // 디버깅용

    // 개선된 파싱 로직
    const data = parseWorldbuildingResponseImproved(content)
    console.log("Parsed data:", data) // 파싱 결과 확인
    return data
  } catch (error) {
    console.error("OpenAI API Error:", error)
    throw new Error("AI 세계관 생성 중 오류가 발생했습니다.")
  }
}

function parseWorldbuildingResponseImproved(content: string) {
  // 기본값 설정
  const data = {
    background: "",
    history: "",
    mythology: "",
    rules: "",
  }

  try {
    // 각 섹션을 찾기 위한 정규식 패턴
    const backgroundPattern = /background:?([\s\S]*?)(?=history:|mythology:|rules:|$)/i
    const historyPattern = /history:?([\s\S]*?)(?=background:|mythology:|rules:|$)/i
    const mythologyPattern = /mythology:?([\s\S]*?)(?=background:|history:|rules:|$)/i
    const rulesPattern = /rules:?([\s\S]*?)(?=background:|history:|mythology:|$)/i

    // 각 섹션 추출
    const backgroundMatch = content.match(backgroundPattern)
    const historyMatch = content.match(historyPattern)
    const mythologyMatch = content.match(mythologyPattern)
    const rulesMatch = content.match(rulesPattern)

    // 매치된 결과가 있으면 데이터에 할당
    if (backgroundMatch && backgroundMatch[1]) {
      data.background = backgroundMatch[1].trim()
    }

    if (historyMatch && historyMatch[1]) {
      data.history = historyMatch[1].trim()
    }

    if (mythologyMatch && mythologyMatch[1]) {
      data.mythology = mythologyMatch[1].trim()
    }

    if (rulesMatch && rulesMatch[1]) {
      data.rules = rulesMatch[1].trim()
    }

    // 파싱이 실패한 경우 대체 파싱 방법 시도
    if (!data.background && !data.history && !data.mythology && !data.rules) {
      // 번호로 시작하는 섹션 찾기
      const sections = content.split(/\d+\.\s*/)

      sections.forEach((section) => {
        const trimmedSection = section.trim()

        if (trimmedSection.toLowerCase().includes("background")) {
          const parts = trimmedSection.split(/background:?/i)
          if (parts.length > 1) {
            data.background = parts[1].trim()
          }
        } else if (trimmedSection.toLowerCase().includes("history")) {
          const parts = trimmedSection.split(/history:?/i)
          if (parts.length > 1) {
            data.history = parts[1].trim()
          }
        } else if (trimmedSection.toLowerCase().includes("mythology")) {
          const parts = trimmedSection.split(/mythology:?/i)
          if (parts.length > 1) {
            data.mythology = parts[1].trim()
          }
        } else if (trimmedSection.toLowerCase().includes("rules")) {
          const parts = trimmedSection.split(/rules:?/i)
          if (parts.length > 1) {
            data.rules = parts[1].trim()
          }
        }
      })
    }

    // 여전히 파싱이 실패한 경우 전체 텍스트를 분할해서 시도
    if (!data.background && !data.history && !data.mythology && !data.rules) {
      const lines = content.split("\n")
      let currentSection = ""

      lines.forEach((line) => {
        const trimmedLine = line.trim().toLowerCase()

        if (trimmedLine.includes("background")) {
          currentSection = "background"
        } else if (trimmedLine.includes("history")) {
          currentSection = "history"
        } else if (trimmedLine.includes("mythology")) {
          currentSection = "mythology"
        } else if (trimmedLine.includes("rules")) {
          currentSection = "rules"
        } else if (currentSection && line.trim()) {
          // 현재 섹션이 설정되어 있고 라인이 비어있지 않으면 해당 섹션에 추가
          data[currentSection as keyof typeof data] += line + "\n"
        }
      })
    }

    // 모든 파싱 방법이 실패한 경우 전체 텍스트를 균등하게 분배
    if (!data.background && !data.history && !data.mythology && !data.rules) {
      const paragraphs = content.split("\n\n").filter((p) => p.trim())
      const totalParagraphs = paragraphs.length

      if (totalParagraphs >= 4) {
        const quarterLength = Math.floor(totalParagraphs / 4)

        data.background = paragraphs.slice(0, quarterLength).join("\n\n")
        data.history = paragraphs.slice(quarterLength, quarterLength * 2).join("\n\n")
        data.mythology = paragraphs.slice(quarterLength * 2, quarterLength * 3).join("\n\n")
        data.rules = paragraphs.slice(quarterLength * 3).join("\n\n")
      } else {
        // 최후의 수단: 전체 내용을 background에 넣기
        data.background = content
      }
    }

    return data
  } catch (error) {
    console.error("Parsing error:", error)
    // 파싱 실패시 전체 내용을 background에 저장
    return {
      background: content,
      history: "",
      mythology: "",
      rules: "",
    }
  }
}

export async function generateCharacters(title: string, genre: string, worldbuilding: string) {
  const prompt = `
소설 제목: ${title}
장르: ${genre}
세계관 정보: ${worldbuilding}

위 정보를 바탕으로 소설의 주요 캐릭터 4명을 생성해주세요.

각 캐릭터는 다음 형식으로 작성해주세요:

캐릭터1:
이름: [캐릭터 이름]
역할: [주인공/조연/악역 등]
설명: [캐릭터의 기본 정보와 특징을 2-3문장으로]
성격: [성격적 특징을 간단히]
배경: [캐릭터의 과거나 출신을 간단히]
외모: [외모 묘사를 간단히]

캐릭터2:
이름: [캐릭터 이름]
역할: [주인공/조연/악역 등]
설명: [캐릭터의 기본 정보와 특징을 2-3문장으로]
성격: [성격적 특징을 간단히]
배경: [캐릭터의 과거나 출신을 간단히]
외모: [외모 묘사를 간단히]

캐릭터3:
이름: [캐릭터 이름]
역할: [주인공/조연/악역 등]
설명: [캐릭터의 기본 정보와 특징을 2-3문장으로]
성격: [성격적 특징을 간단히]
배경: [캐릭터의 과거나 출신을 간단히]
외모: [외모 묘사를 간단히]

캐릭터4:
이름: [캐릭터 이름]
역할: [주인공/조연/악역 등]
설명: [캐릭터의 기본 정보와 특징을 2-3문장으로]
성격: [성격적 특징을 간단히]
배경: [캐릭터의 과거나 출신을 간단히]
외모: [외모 묘사를 간단히]

주인공 1명, 조연 2명, 그리고 적대적 인물 1명을 포함해주세요.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 매력적이고 입체적인 소설 캐릭터를 만드는 전문가입니다. 주어진 형식을 정확히 따라 캐릭터를 생성해주세요.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2500,
    })

    const content = completion.choices[0].message.content

    if (!content) {
      throw new Error("AI 응답을 받을 수 없습니다.")
    }

    console.log("Characters AI Response:", content) // 디버깅용

    // **** 제거 및 정리
    const cleanedContent = cleanCharacterResponse(content)
    console.log("Cleaned Characters Response:", cleanedContent) // 정리된 응답 확인

    return cleanedContent
  } catch (error) {
    console.error("Characters generation error:", error)
    throw new Error("AI 캐릭터 생성 중 오류가 발생했습니다.")
  }
}

function cleanCharacterResponse(content: string): string {
  // **** 패턴 제거
  let cleaned = content.replace(/\*{2,}/g, "")

  // 연속된 공백 정리
  cleaned = cleaned.replace(/\s+/g, " ")

  // 연속된 줄바꿈 정리
  cleaned = cleaned.replace(/\n\s*\n/g, "\n\n")

  // 앞뒤 공백 제거
  cleaned = cleaned.trim()

  return cleaned
}

export async function generateEpisode(
  prompt: string,
  worldbuilding: string,
  characters: string,
  previousEpisodes: string,
  minWordCount: number,
) {
  // 더 상세하고 구체적인 시스템 프롬프트
  const systemPrompt = `
당신은 전문 소설가입니다. 주어진 세계관과 캐릭터 정보를 바탕으로 고품질의 소설 회차를 작성해주세요.

작성 지침:
1. 최소 ${minWordCount}자 이상으로 작성하되, 내용의 질을 우선시하세요.
2. 생생한 묘사와 감정적 몰입도를 높이는 서술을 사용하세요.
3. 캐릭터의 대화는 자연스럽고 개성이 드러나도록 작성하세요.
4. 장면 전환과 분위기 조성에 신경 써주세요.
5. 이전 회차와의 연결성을 고려하여 스토리의 일관성을 유지하세요.
6. 독자의 호기심을 자극하는 요소를 포함하세요.

세계관 정보:
${worldbuilding}

캐릭터 정보:
${characters}

이전 회차들:
${previousEpisodes}

위 정보를 참고하여 스토리의 연속성과 캐릭터의 일관성을 유지하면서 새로운 회차를 작성해주세요.
`

  const userPrompt = `
다음 프롬프트를 바탕으로 소설의 한 회차를 작성해주세요:

${prompt}

요구사항:
- 한국어로 작성
- 소설 형식 (서술과 대화의 조화)
- 생생한 묘사와 감정 표현
- 캐릭터의 개성이 드러나는 대화
- 장면의 분위기와 긴장감 조성
- 최소 ${minWordCount}자 이상
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    })

    const content = completion.choices[0].message.content

    if (!content) {
      throw new Error("AI 응답을 받을 수 없습니다.")
    }

    return content
  } catch (error) {
    console.error("Episode generation error:", error)
    throw new Error("AI 에피소드 생성 중 오류가 발생했습니다.")
  }
}

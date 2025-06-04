export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 소설 작가</h3>
            <p className="text-gray-600 mb-4">
              AI와 함께 창작하는 새로운 소설 작성 플랫폼입니다. 당신의 상상력과 AI의 창의성이 만나 놀라운 이야기를
              만들어보세요.
            </p>
            <p className="text-sm text-gray-500">© 2024 AI 소설 작가. All rights reserved.</p>
          </div>

          {/* 기능 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">기능</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>AI 세계관 생성</li>
              <li>캐릭터 자동 생성</li>
              <li>회차별 스토리 작성</li>
              <li>소설 미리보기</li>
              <li>PDF 내보내기</li>
            </ul>
          </div>

          {/* 지원 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">지원</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <span className="text-gray-400 cursor-not-allowed">사용 가이드 (준비중)</span>
              </li>
              <li>
                <span className="text-gray-400 cursor-not-allowed">자주 묻는 질문 (준비중)</span>
              </li>
              <li>
                <span className="text-gray-400 cursor-not-allowed">문의하기 (준비중)</span>
              </li>
              <li>
                <span className="text-gray-400 cursor-not-allowed">개인정보처리방침 (준비중)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

## STYLE_GUIDE.md: MathComm Frontend Standards

### 1. 디자인 원칙 (Design Principles)

* **톤 앤 매너:** 전문적이고 깔끔하며, 학습과 경쟁의 몰입감을 높이는 **미니멀리즘**을 지향합니다.
* **배경:** 밝은 **화이트 테마**를 주 배경으로 사용하여 가독성을 최우선으로 확보합니다.
* **컴포넌트:** 모든 섹션과 데이터는 둥근 모서리와 명확한 구분선을 가진 **카드(Card)** 형태로 구성하여 정보의 경계를 명확히 합니다.

---

### 2. 색상 팔레트 (Color Palette - Tailwind CSS Classes)

프로젝트는 밝은 테마를 기본으로 하며, 강조 요소에만 색상을 사용합니다.

| 용도 (Role) | Hex Code (참고) | Tailwind CSS Class | 설명 |
| :--- | :--- | :--- | :--- |
| **Main Background** | `#FFFFFF` | `bg-white` | 페이지 전체 배경색 |
| **Component Background** | `#FFFFFF` | `bg-white` | 카드 및 주요 섹션 배경색 |
| **Main Text (제목/강조)** | `#1F2937` (Dark Gray) | `text-gray-800` | 대부분의 제목, 본문 텍스트 |
| **Sub Text (보조/흐린)** | `#6B7280` (Medium Gray) | `text-gray-500` | 메뉴 아이콘, 설명 텍스트, Footer |
| **Primary Accent (경쟁/활성)** | `#1C7FE5` (Blue) | `text-blue-600`, `border-blue-600` | 활성 메뉴, 리더보드, 그래프 강조색 |
| **Border / Divider** | `#E5E7EB` (Lightest Gray) | `border-gray-200` | 카드 구분선, 입력 필드 경계 |
| **Hover / Active State** | `#F3F4F6` (Extra Light Gray) | `bg-gray-100` | 마우스 오버 시의 배경색 (버튼, 메뉴) |

---

### 3. 타이포그래피 (Typography - Font & Sizes)

모든 텍스트는 **Sans-serif (고딕 계열)** 폰트를 사용하여 높은 가독성을 확보합니다. (예: 시스템 기본 폰트 또는 Google Fonts의 Noto Sans, Inter 등)

| 요소 | Tailwind CSS Class | 설명 |
| :--- | :--- | :--- |
| **섹션 제목 (H2)** | `text-xl font-semibold text-gray-800` | 'Activity', 'Achievements' 등 카드 내부의 제목 |
| **대시보드 제목 (H1)** | `text-2xl font-bold text-gray-800` | 'MathQuest' 로고 등 메인 제목 |
| **본문 텍스트** | `text-base font-normal text-gray-800` | 카드 내 일반적인 데이터 표시 |
| **메뉴/링크** | `text-sm font-medium text-gray-500` | 사이드바 메뉴 텍스트 (활성 시 `text-gray-800`) |
| **보조 텍스트** | `text-xs text-gray-500` | 작은 통계 수치, 날짜 등 |

---

### 4. 컴포넌트 표준 (Component Standards)

| 컴포넌트 | 스타일링 (Tailwind CSS Classes) | 상세 설명 |
| :--- | :--- | :--- |
| **메인 카드 (Main Card)** | `bg-white p-6 rounded-lg shadow-sm border border-gray-200` | 'Activity', 'Mastery by Topic' 등의 컨테이너 |
| **사이드바 (Sidebar)** | `w-64 bg-white border-r border-gray-200 h-full` | 고정 너비 (`w-64`), 배경색, 오른쪽 경계선 |
| **활성 메뉴 (Active Menu)** | `bg-gray-100 text-gray-800 font-semibold p-3 rounded-lg` | 현재 선택된 사이드바 메뉴 항목 |
| **비활성 메뉴 (Inactive Menu)** | `text-gray-500 hover:bg-gray-50 p-3 rounded-lg` | 기본 사이드바 메뉴 항목 |
| **메인 버튼** | `bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700` | 'Streak 8', 'Submit' 등의 주요 액션 버튼 |
| **입력 필드 / 검색창** | `p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500` | 상단 검색창 및 답안 제출 필드 |
| **프로필 카드** | `p-4 bg-white rounded-lg border border-gray-200` | 'Your Profile' 카드 |
| **진행률 바 (Progress Bar)** | **Track:** `bg-gray-200 h-2 rounded-full` / **Fill:** `bg-blue-600 h-2 rounded-full` | 'Difficulty Ladder' 등의 진행률 표시 |

---

### 5. 레이아웃 및 간격 규칙 (Layout & Spacing)

* **최대 너비:** 데스크톱 뷰에서 콘텐츠가 너무 넓어지지 않도록 메인 콘텐츠 영역에 최대 너비(예: `max-w-7xl` 또는 `container mx-auto`)를 적용합니다.
* **간격 (Spacing):** 컴포넌트 간의 수직 및 수평 간격은 Tailwind의 `space-y-{n}` 및 `gap-{n}` 유틸리티를 사용하며, 주로 **`space-y-6` (24px)**, **`gap-6` (24px)**를 표준으로 사용합니다.

---

### 6. 코드 컨벤션 (Code Convention for AI)

AI는 코드를 생성할 때 다음 규칙을 **반드시** 준수해야 합니다.

1.  **클래스 순서:** Tailwind CSS 클래스를 선언할 때, **'레이아웃 > 크기 > 플렉스/그리드 > 간격 > 배경 > 경계선 > 텍스트/폰트 > 상호작용(Hover/Focus)'** 순서를 지켜 가독성을 확보합니다.
    * **예시:** `w-full h-full flex flex-col items-center justify-start p-6 bg-white rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50`
2.  **색상 상수:** 모든 색상과 관련된 클래스는 위 **2. 색상 팔레트** 항목을 참조해야 합니다. (예: `bg-blue-600` 대신 `bg-indigo-600` 등을 사용해서는 안 됩니다.)
3.  **단위:** `px` 단위는 Tailwind의 기본 스케일을 따르며, 하드코딩된 픽셀 값은 사용하지 않습니다.

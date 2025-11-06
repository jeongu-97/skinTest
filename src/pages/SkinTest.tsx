import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LiquidGlassShader from '../components/LiquidGlassShader';

type GlassShape = 'rectangle' | 'circle' | 'star' | 'hexagon' | 'donut';

interface ShaderParams {
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
  tintR: number;
  tintG: number;
  tintB: number;
  saturation: number;
  distortion: number;
  blur: number;
  text: string;
  iconSize: number;
  iconColorR: number;
  iconColorG: number;
  iconColorB: number;
  glassMode: 'light' | 'dark';
  shadowIntensity: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  cornerRadius: number;
  chromaticAberration: number;
  shape: GlassShape;
  donutThickness: number;
  starPoints: number;
  starInnerRadius: number;
}

interface BackgroundMedia {
  url: string;
  type: 'image' | 'video';
  blurhash?: string;
}

// 고정된 설정값 (이미지에서 확인한 값)
const FIXED_PARAMS: ShaderParams = {
  width: 380,
  height: 50,
  mouseX: 0, // 초기화 후 중앙으로 설정
  mouseY: 0, // 초기화 후 중앙으로 설정
  tintR: 1.0, // #ffffff
  tintG: 1.0, // #ffffff
  tintB: 1.0, // #ffffff
  saturation: 0.60,
  distortion: 1.6,
  blur: 3,
  text: 'Test Your Skin',
  iconSize: 0.35,
  iconColorR: 1.0, // #ffffff
  iconColorG: 1.0, // #ffffff
  iconColorB: 1.0, // #ffffff
  glassMode: 'light',
  shadowIntensity: 0.3,
  shadowOffsetX: 5,
  shadowOffsetY: 5,
  shadowBlur: 30,
  cornerRadius: 40,
  chromaticAberration: 0.4,
  shape: 'rectangle',
  donutThickness: 0.3,
  starPoints: 5,
  starInnerRadius: 0.4
};

// 물속 모래 바닥 배경 이미지 (예시 - 실제 이미지 URL로 교체 가능)
const BACKGROUND_IMAGE = {
  url: 'https://images.unsplash.com/photo-1724748860101-589aa7ee8b29?q=80&w=3174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  type: 'image' as const,
  blurhash: 'L6Adyj00_4WA?HRP%LIp4.%1x^t8'
};

// 설문 질문 데이터
const SURVEY_QUESTIONS = [
  { 
    id: 1, 
    part: 'PART A. 피부 타입 & 컨디션',
    question: '세안 후 아무것도 바르지 않았을 때 피부 느낌은?', 
    options: [
      '매우 건조하고 당긴다',
      '약간 건조할 때가 있다',
      '변화 없이 편안하다',
      '살짝 유분이 느껴진다',
      '유분이 쉽게 올라온다'
    ] 
  },
  { 
    id: 2, 
    part: 'PART A. 피부 타입 & 컨디션',
    question: '오후가 되면 얼굴의 유분 상태는?', 
    options: [
      '여전히 건조',
      '코 주변만 유분',
      'T존 위주로 유분',
      '얼굴 전체 유분',
      '유분이 많이 올라온다'
    ] 
  },
  { 
    id: 3, 
    part: 'PART A. 피부 타입 & 컨디션',
    question: '어느 부위에서 모공이 가장 눈에 띄나요?', 
    options: [
      '거의 보이지 않음',
      '코 주변만',
      'T존 중심',
      'T존 + 볼',
      '얼굴 전체'
    ] 
  },
  { 
    id: 4, 
    part: 'PART A. 피부 타입 & 컨디션',
    question: '환절기/온도 변화 시 피부는?', 
    options: [
      '크게 민감·건조해짐',
      '자주 변화함',
      '가끔만 영향 있음',
      '거의 변화 없음',
      '전혀 없음'
    ] 
  },
  { 
    id: 5, 
    part: 'PART A. 피부 타입 & 컨디션',
    question: '피부가 붉어지거나 따가운 적이 있나요? (민감도)', 
    options: [
      '매우 자주',
      '자주',
      '가끔',
      '거의 없음',
      '전혀 없음'
    ] 
  },
  { 
    id: 6, 
    part: 'PART B. 생활 환경 & 루틴 습관',
    question: '하루 중 주로 머무르는 환경은?', 
    options: [
      '건조한 실내 (사무실/독서실 등)',
      '다양한 실내 이동 (카페 등)',
      '야외·외근이 많은 편',
      '운동 시설 사용 잦음',
      '하루 여러 환경을 이동'
    ] 
  },
  { 
    id: 7, 
    part: 'PART B. 생활 환경 & 루틴 습관',
    question: '하루 평균 물 섭취량은?', 
    options: [
      '300ml 이하',
      '~500ml',
      '~1L',
      '1.5~2L',
      '2L 이상 꾸준히'
    ] 
  },
  { 
    id: 8, 
    part: 'PART B. 생활 환경 & 루틴 습관',
    question: '일상 스트레스 정도는?', 
    options: [
      '거의 없음',
      '가끔',
      '종종',
      '자주',
      '거의 매일 강하게'
    ] 
  },
  { 
    id: 9, 
    part: 'PART C. 제품 사용 태도',
    question: '평소 스킨케어 루틴 정도는?', 
    options: [
      '거의 하지 않음',
      '토너/크림 정도',
      '토너 + 크림 + 세럼',
      '여러 단계 루틴 꾸준히',
      '적극적으로 관리함'
    ] 
  },
  { 
    id: 10, 
    part: 'PART C. 제품 사용 태도',
    question: '새 제품 사용 시 피부 반응은?', 
    options: [
      '거의 항상 반응 생김',
      '종종 예민함',
      '가끔',
      '거의 없음',
      '전혀 없음'
    ] 
  },
];

export default function SkinTest() {
  const navigate = useNavigate();
  const [backgroundMedia] = useState<BackgroundMedia>(BACKGROUND_IMAGE);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useState<ShaderParams>(FIXED_PARAMS);
  
  // 설문 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Glass를 화면 중앙 상단에 배치 (반응형 너비 포함)
  const centerGlass = useCallback(() => {
    if (canvasRef.current && isCanvasReady) {
      const rect = canvasRef.current.getBoundingClientRect();
      // 좌우 각각 80px 여백을 확보 (총 160px 여백)
      const minMargin = 80;
      // 화면 너비에서 여백을 뺀 값과 화면 너비의 45% 중 작은 값 선택, 최대 800px 제한
      const responsiveWidth = Math.min(
        rect.width - minMargin * 2, // 최소 여백 확보
        Math.min(rect.width * 0.45, 800) // 화면 너비의 45% 또는 최대 800px
      );
      setParams(prev => ({
        ...prev,
        width: Math.max(responsiveWidth, 10), // 최소 너비 10px 보장
        mouseX: rect.width / 2,
        mouseY: rect.height * 0.15 // 상단 15% 지점
      }));
    }
  }, [isCanvasReady]);

  useEffect(() => {
    centerGlass();
  }, [centerGlass]);

  // 윈도우 리사이즈 시 중앙 유지 및 반응형 너비 업데이트
  useEffect(() => {
    const handleResize = () => {
      centerGlass();
      // 본문 유리도 함께 업데이트
      if (canvasRef.current && isCanvasReady) {
        const rect = canvasRef.current.getBoundingClientRect();
        const titleY = rect.height * 0.15;
        const titleHeight = params.height;
        const contentHeight = 250;
        const contentY = titleY + titleHeight / 2 + 200 + contentHeight / 2;
        
        const minMargin = 80;
        const responsiveWidth = Math.min(
          rect.width - minMargin * 2,
          Math.min(rect.width * 0.45, 800)
        );
        
        setContentGlassParams(prev => ({
          ...prev,
          width: Math.max(responsiveWidth, 10),
          mouseX: rect.width / 2,
          mouseY: Math.min(contentY, rect.height - contentHeight / 2 - 20)
        }));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerGlass, isCanvasReady, params.height]);

  const handleCanvasReady = useCallback(() => {
    setIsCanvasReady(true);
    setTimeout(() => {
      setIsTextVisible(true);
    }, 400);
  }, []);

  // Memoize shader uniforms
  const shaderUniforms = useMemo(() => ({
    time: 0,
    ...params
  }), [params]);

  // 본문 유리 요소 설정 (제목과 동일한 효과)
  const [contentGlassParams, setContentGlassParams] = useState<ShaderParams>(() => ({
    ...FIXED_PARAMS,
    width: FIXED_PARAMS.width, // 제목과 동일한 너비
    height: 250, // 원래 높이
    mouseX: 0, // 초기화 후 중앙 아래로 설정
    mouseY: 0, // 초기화 후 중앙 아래로 설정
    text: '', // 본문은 텍스트 없음
    cornerRadius: 50,
    saturation: 0.60,
    distortion: 1.6,
    blur: 1.6,
    chromaticAberration: 0.4,
    tintR: 1.0,
    tintG: 1.0,
    tintB: 1.0,
    iconColorR: 1.0,
    iconColorG: 1.0,
    iconColorB: 1.0
  }));

  // 본문 유리 위치 및 반응형 너비 설정 (제목 아래, 화면 중앙 아래쪽)
  useEffect(() => {
    if (canvasRef.current && isCanvasReady) {
      const rect = canvasRef.current.getBoundingClientRect();
      // 제목 유리 위치 계산
      const titleY = rect.height * 0.15;
      const titleHeight = params.height;
      // 제목 아래 여백(200px로 증가) + 본문 유리 높이의 절반
      const contentHeight = 250; // 고정 높이
      const contentY = titleY + titleHeight / 2 + 200 + contentHeight / 2;
      
      // 본문 유리도 제목과 동일한 반응형 너비 적용
      const minMargin = 80;
      const responsiveWidth = Math.min(
        rect.width - minMargin * 2, // 최소 여백 확보
        Math.min(rect.width * 0.45, 800) // 화면 너비의 45% 또는 최대 800px
      );
      
      setContentGlassParams(prev => ({
        ...prev,
        width: Math.max(responsiveWidth, 10), // 최소 너비 10px 보장
        mouseX: rect.width / 2,
        mouseY: Math.min(contentY, rect.height - contentHeight / 2 - 20) // 화면 밖으로 나가지 않도록
      }));
    }
  }, [isCanvasReady, params.height, params.width]);

  // 본문 유리 shader uniforms
  const contentGlassUniforms = useMemo(() => ({
    time: 0,
    ...contentGlassParams
  }), [contentGlassParams]);

  // Text overlay style
  const textOverlayStyle = useMemo(() => ({
    left: params.mouseX,
    top: params.mouseY,
    transform: 'translate(-50%, -50%)',
    fontFamily: '"Chiron Sung HK", "Noto Serif KR", "Noto Serif Korean", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontSize: Math.min(params.width, params.height) * 0.35,
    fontWeight: 400,
    textShadow: params.glassMode === 'dark' 
      ? '0 2px 4px rgba(0,0,0,0.6), 0 0 8px rgba(255,255,255,0.1)' 
      : '0 1px 3px rgba(0,0,0,0.3)',
    zIndex: 10,
    color: `rgb(${Math.round(params.iconColorR * 255)}, ${Math.round(params.iconColorG * 255)}, ${Math.round(params.iconColorB * 255)})`,
    transitionDelay: isTextVisible ? '0ms' : '0ms',
    whiteSpace: 'pre-wrap',
    textAlign: 'center',
    wordBreak: 'break-word',
    maxWidth: params.width * 0.9
  }), [params, isTextVisible]);

  const currentQuestion = SURVEY_QUESTIONS[currentPage - 1];
  const progress = (currentPage / SURVEY_QUESTIONS.length) * 100;
  const selectedAnswer = answers[currentQuestion.id];
  
  // 이전 질문과 다른 파트인지 확인 (파트 표시용)
  const previousQuestion = currentPage > 1 ? SURVEY_QUESTIONS[currentPage - 2] : null;
  const showPartTitle = !previousQuestion || previousQuestion.part !== currentQuestion.part;

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleNext = () => {
    if (currentPage < SURVEY_QUESTIONS.length && selectedAnswer) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // 선택지 선택 시 자동으로 다음 페이지로 이동 또는 결과 페이지로 이동
  useEffect(() => {
    if (selectedAnswer) {
      if (currentPage < SURVEY_QUESTIONS.length) {
        const timer = setTimeout(() => {
          setCurrentPage(prev => prev + 1);
        }, 500); // 0.5초 후 자동 이동
        return () => clearTimeout(timer);
      } else {
        // 마지막 문제를 풀었을 때 결과 페이지로 이동
        const timer = setTimeout(() => {
          navigate('/result', { state: { answers } });
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedAnswer, currentPage, navigate, answers]);

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="flex-1 p-[12px] flex flex-col">
        <Card className="flex-1 p-[12px] flex flex-col">
          <div
            ref={canvasRef}
            className="relative w-full flex-1 rounded-lg overflow-hidden select-none"
          >
            {/* 제목 유리 shader (배경 레이어) */}
            <LiquidGlassShader
              backgroundMedia={backgroundMedia}
              uniforms={shaderUniforms}
              className="w-full h-full"
              isTransitioning={false}
              onReady={handleCanvasReady}
              alpha={false}
            />
            
            {/* 본문 유리 shader (투명 배경 사용) */}
            <div className="absolute inset-0" style={{ zIndex: 5 }}>
              <LiquidGlassShader
                backgroundMedia={backgroundMedia}
                uniforms={contentGlassUniforms}
                className="w-full h-full"
                isTransitioning={false}
                onReady={() => {}}
                alpha={true}
              />
            </div>
            
            {/* Canvas Loading Blur Overlay */}
            <div 
              className={`absolute inset-0 bg-white/80 backdrop-blur-[40px] transition-opacity duration-700 ease-out pointer-events-none ${
                isCanvasReady ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                transitionDelay: isCanvasReady ? '0ms' : '0ms',
                zIndex: 1
              }}
            />
            
            {/* PART 제목 - 좌상단 */}
            <div 
              className="absolute pointer-events-none select-none"
              style={{
                left: '24px',
                top: '24px',
                zIndex: 20,
                color: `rgb(${Math.round(params.iconColorR * 255)}, ${Math.round(params.iconColorG * 255)}, ${Math.round(params.iconColorB * 255)})`,
                fontFamily: '"Chiron Sung HK", "Noto Serif KR", "Noto Serif Korean", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                fontSize: '1.75rem',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            >
              {currentQuestion.part}
            </div>

            {/* 제목 유리 내부 - 질문 번호 및 질문 텍스트 */}
            <div 
              className={`absolute pointer-events-none select-none transition-opacity duration-300 ease-out ${
                isTextVisible ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                left: params.mouseX,
                top: params.mouseY,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: params.width * 2.9,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '8px'
              }}
            >
              <span 
                className="text-white/80 font-semibold"
                style={{ fontSize: '2rem', fontFamily: '"Chiron Sung HK", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}
              >
                Q{currentQuestion.id}.
              </span>
              <span 
                className="text-white/90 font-medium leading-relaxed"
                style={{ fontSize: '2rem', fontFamily: '"Chiron Sung HK", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}
              >
                {currentQuestion.question}
              </span>
            </div>

            {/* 진행 상황 바 및 페이지 번호 - 제목 유리와 본문 유리 사이 */}
            <div 
              className="absolute pointer-events-none"
              style={{
                left: params.mouseX,
                top: params.mouseY + params.height / 2 + 100, // 제목 유리 아래 100px
                transform: 'translateX(-50%)',
                width: params.width,
                zIndex: 15,
                padding: '0 20px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              {/* 진행 상황 바 */}
              <div className="flex-1 relative">
                <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              {/* 페이지 번호 */}
              <div className="text-sm text-muted-foreground min-w-[40px] text-right whitespace-nowrap">
                {currentPage}/{SURVEY_QUESTIONS.length}
              </div>
            </div>

            {/* 선택지 버튼들 - 유리 위의 별도 레이어 */}
            <div
              className="absolute pointer-events-auto"
              style={{
                left: contentGlassParams.mouseX - (contentGlassParams.width * 1.5) / 2,
                top: contentGlassParams.mouseY - contentGlassParams.height / 2,
                width: contentGlassParams.width * 1.5,
                height: contentGlassParams.height,
                zIndex: 20,
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'stretch'
              }}
            >
              {/* 선택지 버튼들 - 2열 그리드 */}
              <div className="grid grid-cols-2 gap-4 w-full" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className="rounded-lg font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-center px-2 py-2"
                    style={{
                      minHeight: '80px',
                      width: '100%',
                      maxWidth: '100%',
                      backdropFilter: `blur(${contentGlassParams.blur * 10}px) saturate(${contentGlassParams.saturation * 100}%)`,
                      WebkitBackdropFilter: `blur(${contentGlassParams.blur * 10}px) saturate(${contentGlassParams.saturation * 100}%)`,
                      backgroundColor: selectedAnswer === option
                        ? `rgba(${Math.round(contentGlassParams.tintR * 255)}, ${Math.round(contentGlassParams.tintG * 255)}, ${Math.round(contentGlassParams.tintB * 255)}, 0.5)`
                        : `rgba(${Math.round(contentGlassParams.tintR * 255)}, ${Math.round(contentGlassParams.tintG * 255)}, ${Math.round(contentGlassParams.tintB * 255)}, 0.3)`,
                      border: selectedAnswer === option
                        ? '1px solid rgba(255, 255, 255, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: selectedAnswer === option
                        ? '0 8px 32px 0 rgba(31, 38, 135, 0.5)'
                        : '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                      borderRadius: `${contentGlassParams.cornerRadius}px`,
                      color: '#000000',
                      fontFamily: '"Chiron Sung HK", "Noto Serif KR", "Noto Serif Korean", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                      fontWeight: 500,
                      textShadow: 'none',
                      fontSize: '1.5rem',
                      wordBreak: 'keep-all'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


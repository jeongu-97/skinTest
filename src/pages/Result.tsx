import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import LiquidGlassShader from '../components/LiquidGlassShader';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

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

// 고정된 설정값
const FIXED_PARAMS: ShaderParams = {
  width: 380,
  height: 50,
  mouseX: 0,
  mouseY: 0,
  tintR: 1.0,
  tintG: 1.0,
  tintB: 1.0,
  saturation: 0.60,
  distortion: 1.6,
  blur: 1.6,
  text: '결과',
  iconSize: 0.35,
  iconColorR: 1.0,
  iconColorG: 1.0,
  iconColorB: 1.0,
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

// 물속 모래 바닥 배경 이미지
const BACKGROUND_IMAGE = {
  url: 'https://images.unsplash.com/photo-1724748860101-589aa7ee8b29?q=80&w=3174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  type: 'image' as const,
  blurhash: 'L6Adyj00_4WA?HRP%LIp4.%1x^t8'
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const answers = (location.state?.answers as Record<number, string>) || {};
  
  const [backgroundMedia] = useState<BackgroundMedia>(BACKGROUND_IMAGE);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useState<ShaderParams>(FIXED_PARAMS);

  // Glass를 화면 중앙 상단에 배치 (반응형 너비 포함)
  const centerGlass = useCallback(() => {
    if (canvasRef.current && isCanvasReady) {
      const rect = canvasRef.current.getBoundingClientRect();
      const minMargin = 80;
      const responsiveWidth = Math.min(
        rect.width - minMargin * 2,
        Math.min(rect.width * 0.45, 800)
      );
      setParams(prev => ({
        ...prev,
        width: Math.max(responsiveWidth, 10),
        mouseX: rect.width / 2,
        mouseY: rect.height * 0.15
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
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerGlass]);

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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="flex-1 p-[12px] flex flex-col">
        <Card className="flex-1 p-[12px] flex flex-col">
          <div
            ref={canvasRef}
            className="relative w-full flex-1 rounded-lg overflow-hidden select-none"
          >
            {/* 제목 유리 shader */}
            <LiquidGlassShader
              backgroundMedia={backgroundMedia}
              uniforms={shaderUniforms}
              className="w-full h-full"
              isTransitioning={false}
              onReady={handleCanvasReady}
              alpha={false}
            />
            
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
            
            {/* 제목 텍스트 */}
            {params.text && (
              <div 
                className={`absolute pointer-events-none select-none transition-opacity duration-300 ease-out ${
                  isTextVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  left: params.mouseX,
                  top: params.mouseY,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: '"Chiron Sung HK", "Noto Serif KR", "Noto Serif Korean", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  fontSize: '2.5rem',
                  fontWeight: 400,
                  textShadow: '2px 2px 4px rgba(128, 128, 128, 0.5), 0 0 8px rgba(128, 128, 128, 0.3)',
                  color: '#000000',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  wordBreak: 'keep-all',
                  zIndex: 14
                }}
              >
                {params.text}
              </div>
            )}

            {/* 결과 내용 */}
            <div 
              className="absolute pointer-events-none select-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '80%',
                maxWidth: '600px',
                textAlign: 'center'
              }}
            >
              <div 
                style={{
                  fontFamily: '"Chiron Sung HK", "Noto Serif KR", "Noto Serif Korean", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  fontSize: '1.5rem',
                  color: '#000000',
                  marginBottom: '2rem'
                }}
              >
                설문이 완료되었습니다!
              </div>
              <div 
                style={{
                  fontFamily: '"Chiron Sung HK", "Noto Serif KR", "Noto Serif Korean", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  fontSize: '1rem',
                  color: '#666666',
                  marginBottom: '2rem'
                }}
              >
                총 {Object.keys(answers).length}개의 질문에 답변하셨습니다.
              </div>
            </div>

            {/* 홈으로 가기 버튼 */}
            <div 
              className="absolute pointer-events-auto"
              style={{
                left: '50%',
                bottom: '80px',
                transform: 'translateX(-50%)',
                zIndex: 20
              }}
            >
              <Button
                onClick={() => navigate('/')}
                className="px-8 py-4 text-lg"
                style={{
                  fontFamily: '"Chiron Sung HK", "Noto Serif KR", "Noto Serif Korean", -apple-system, "SF Pro Display", BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  backdropFilter: 'blur(16px) saturate(60%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(60%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                  borderRadius: '40px'
                }}
              >
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


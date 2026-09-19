import React, { useRef, useMemo, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, ArrowRight, Search, Anchor } from 'lucide-react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// ==========================================
// THE ULTIMATE REALISTIC SHADER WATER EFFECT
// ==========================================
const ShaderWaterImage = () => {
  const { viewport, pointer } = useThree();
  const texture = useLoader(THREE.TextureLoader, '/island.jpg');
  
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const canvasSize = 1024; 
  
  const rippleCanvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = 'rgb(128, 128, 128)'; 
        ctx.fillRect(0, 0, canvasSize, canvasSize);
    }
    return canvas;
  }, []);

  const rippleTexture = useMemo(() => {
    const tex = new THREE.CanvasTexture(rippleCanvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [rippleCanvas]);

  const ripples = useRef<{x: number, y: number, age: number, maxAge: number}[]>([]);
  const lastMouse = useRef({ x: 0, y: 0 });

  useFrame(() => {
    const ctx = rippleCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(128, 128, 128, 0.05)';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const px = ((pointer.x + 1) / 2) * canvasSize;
    const py = ((-pointer.y + 1) / 2) * canvasSize; 

    const dist = Math.hypot(px - lastMouse.current.x, py - lastMouse.current.y);
    
    if (dist > 3) {
      ripples.current.push({ x: px, y: py, age: 0, maxAge: 80 });
      lastMouse.current = { x: px, y: py };
    }

    ripples.current.forEach((r, i) => {
      r.age++;
      if (r.age > r.maxAge) {
        ripples.current.splice(i, 1);
        return;
      }

      const radius = r.age * 1.5; 
      const thickness = 30; 
      const alpha = 1 - (r.age / r.maxAge);
      
      const innerRadius = Math.max(0, radius - thickness);
      const outerRadius = radius + thickness;

      const gradient = ctx.createRadialGradient(r.x, r.y, innerRadius, r.x, r.y, outerRadius);
      gradient.addColorStop(0, 'rgba(128, 128, 128, 0)');
      gradient.addColorStop(0.3, `rgba(0, 0, 0, ${alpha * 0.5})`);       
      gradient.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.8})`); 
      gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(r.x, r.y, outerRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    rippleTexture.needsUpdate = true;

    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.uDisp.value = rippleTexture;
    }
  });

  // GLSL Shader: White Reflection is reduced for a natural look
  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uDisp: { value: rippleTexture }
  }), [texture, rippleTexture]);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform sampler2D uDisp;

    void main() {
      vec4 disp = texture2D(uDisp, vUv);
      float effect = (disp.r - 0.5) * 0.15; 
      vec2 distortedUv = vUv + vec2(effect);
      vec4 color = texture2D(uTexture, distortedUv);
      
      // REDUCED HIGHLIGHT: Changed multiplier from 0.4 to 0.15 for subtle reflection
      float highlight = smoothstep(0.5, 0.8, disp.r) * 0.15;
      float shadow = smoothstep(0.5, 0.2, disp.r) * 0.2;
      
      gl_FragColor = vec4(color.rgb + highlight - shadow, color.a);
    }
  `;

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
      <shaderMaterial 
        ref={shaderMaterialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const NotFound = () => {
  const navigate = useNavigate();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate('/shop');
    }
  };

  return (
    <>
      <Helmet>
        <title>Page Not Found | LoomoRA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="relative h-[calc(100vh-80px)] w-full bg-black overflow-hidden m-0 p-0 font-sans">
        
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <Suspense fallback={null}>
              <ShaderWaterImage />
            </Suspense>
          </Canvas>
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pointer-events-none">
          <div className="animate-[fadeInUp_0.8s_ease-out_0.2s_both] pointer-events-auto w-full max-w-2xl">
            <div className="relative overflow-hidden backdrop-blur-xl bg-gray-900/40 border border-white/20 p-10 md:p-14 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center">
              
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              
              <div className="flex justify-center mb-4">
                <Anchor className="w-12 h-12 text-white/80" />
              </div>

              <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-lg tracking-tighter mb-2">
                404
              </h1>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight drop-shadow-md">
                Stranded on an Island?
              </h2>
              <p className="text-white/90 font-medium text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed drop-shadow-sm">
                You've washed up on an unknown shore. Run your fingers through the water, or let us rescue you back to civilization.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link to="/" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center group shadow-lg active:scale-95">
                  <Home className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Rescue Me
                </Link>
                <Link to="/shop" className="w-full sm:w-auto px-8 py-4 bg-black/30 border-2 border-white/50 text-white rounded-xl font-bold hover:bg-black/50 backdrop-blur-md transition-all flex items-center justify-center group active:scale-95">
                  Explore Shop
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="relative max-w-sm mx-auto group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-white/80 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="text"
                  onKeyDown={handleSearch}
                  className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/80 focus:bg-black/60 transition-all font-medium backdrop-blur-sm"
                  placeholder="Press Enter to search..."
                />
              </div>

            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </>
  );
};

export default NotFound;
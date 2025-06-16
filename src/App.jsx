import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  // Tamaño del video original
  const [videoSize, setVideoSize] = useState({ width: 640, height: 360 });
  // Área seleccionada para la LSA
  const [box, setBox] = useState({ x: 50, y: 50, width: 200, height: 150 });
  // Estado para mover/redimensionar el área LSA
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  // Estado para mover/redimensionar la ventana espejo
  const [mirrorBox, setMirrorBox] = useState({ x: 400, y: 40, width: 240, height: 180 });
  const [mirrorDragging, setMirrorDragging] = useState(false);
  const [mirrorResizing, setMirrorResizing] = useState(false);
  // Video local
  const [localVideoUrl, setLocalVideoUrl] = useState(null);
  // Modo pseudo-fullscreen
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [showSelector, setShowSelector] = useState(true);
  // Refs
  const dragStart = useRef({ x: 0, y: 0 });
  const boxStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const mirrorStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cargar video local
  const handleLocalVideo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalVideoUrl(URL.createObjectURL(file));
    }
  };

  // Mover/redimensionar área LSA
  const handleMouseDown = (e) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    boxStart.current = { ...box };
  };
  const handleMouseDownResize = (e) => {
    e.stopPropagation();
    setResizing(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    boxStart.current = { ...box };
  };

  // Mover/redimensionar ventana espejo
  const handleMirrorMouseDown = (e) => {
    setMirrorDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    mirrorStart.current = { ...mirrorBox };
  };
  const handleMirrorResizeDown = (e) => {
    e.stopPropagation();
    setMirrorResizing(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    mirrorStart.current = { ...mirrorBox };
  };

  // Movimiento general
  const handleMouseMove = (e) => {
    if (dragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setBox((prev) => ({ ...prev, x: boxStart.current.x + dx, y: boxStart.current.y + dy }));
    } else if (resizing) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setBox((prev) => ({ ...prev, width: Math.max(50, boxStart.current.width + dx), height: Math.max(50, boxStart.current.height + dy) }));
    } else if (mirrorDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setMirrorBox((prev) => ({ ...prev, x: mirrorStart.current.x + dx, y: mirrorStart.current.y + dy }));
    } else if (mirrorResizing) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setMirrorBox((prev) => ({
        ...prev,
        width: Math.max(50, mirrorStart.current.width + dx),
        height: Math.max(50, mirrorStart.current.height + dy),
      }));
    }
  };
  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
    setMirrorDragging(false);
    setMirrorResizing(false);
  };

  useEffect(() => {
    if (dragging || resizing || mirrorDragging || mirrorResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, mirrorDragging, mirrorResizing]);

  // Dibuja el área seleccionada en el canvas espejo
  useEffect(() => {
    if (!localVideoUrl) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    const draw = () => {
      if (video.paused || video.ended) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        video,
        box.x, box.y, box.width, box.height, // src rect
        0, 0, canvas.width, canvas.height    // dest rect
      );
      requestAnimationFrame(draw);
    };
    draw();
    return () => ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [localVideoUrl, box, mirrorBox]);

  // Cambiar tamaño del video original
  const handleVideoSize = (e) => {
    const value = Number(e.target.value);
    setVideoSize({ width: value, height: Math.round((value * 9) / 16) });
  };

  // Pseudo-fullscreen toggle
  const handlePseudoFullscreen = () => {
    setPseudoFullscreen((prev) => !prev);
  };

  return (
    <div className={pseudoFullscreen ? 'container pseudo-fullscreen' : 'container'}>
      <h1 style={{ display: pseudoFullscreen ? 'none' : 'block' }}>Reproductor de Video con Zona de LSA</h1>
      <p style={{ display: pseudoFullscreen ? 'none' : 'block' }}>
        Sube un video local, selecciona el área de interpretación y ajusta el tamaño del video y la ventana espejo arrastrando.
      </p>
      <div className="input-group" style={{ gap: 16, display: pseudoFullscreen ? 'none' : 'flex' }}>
        <input type="file" accept="video/*" onChange={handleLocalVideo} />
        <label style={{ color: '#222', fontWeight: 500 }}>
          Tamaño video:
          <input
            type="range"
            min={320}
            max={960}
            value={videoSize.width}
            onChange={handleVideoSize}
            style={{ width: 120, marginLeft: 8 }}
          />
          <span style={{ marginLeft: 8 }}>{videoSize.width}x{videoSize.height}</span>
        </label>
      </div>
      <button
        onClick={handlePseudoFullscreen}
        style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, padding: '0.7em 1.2em', fontSize: 16 }}
      >
        {pseudoFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      </button>
      <button
        onClick={() => setShowSelector((prev) => !prev)}
        style={{ position: 'fixed', top: 64, right: 16, zIndex: 1000, padding: '0.7em 1.2em', fontSize: 16 }}
      >
        {showSelector ? 'Ocultar selector' : 'Mostrar selector'}
      </button>
      <div
        style={pseudoFullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: '#111',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }
          : { position: 'relative', width: videoSize.width, height: videoSize.height, margin: '32px auto' }}
      >
        {localVideoUrl && (
          <>
            <video
              ref={videoRef}
              src={localVideoUrl}
              width={pseudoFullscreen ? Math.min(window.innerWidth, window.innerHeight * 16 / 9) : videoSize.width}
              height={pseudoFullscreen ? Math.min(window.innerHeight, window.innerWidth * 9 / 16) : videoSize.height}
              controls
              style={{ display: 'block', background: '#000', margin: '0 auto' }}
              crossOrigin="anonymous"
            />
            {/* Cuadro editable sobre el video */}
            {showSelector && (
              <div
                className="lsa-box"
                style={{
                  position: 'absolute',
                  left: box.x,
                  top: box.y,
                  width: box.width,
                  height: box.height,
                  border: '2px solid #00bcd4',
                  background: 'rgba(0,188,212,0.1)',
                  cursor: dragging ? 'move' : 'pointer',
                  boxSizing: 'border-box',
                  zIndex: 2,
                  userSelect: 'none',
                }}
                onMouseDown={handleMouseDown}
              >
                <div
                  className="resize-handle"
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 16,
                    height: 16,
                    background: '#00bcd4',
                    cursor: 'nwse-resize',
                    zIndex: 3,
                  }}
                  onMouseDown={handleMouseDownResize}
                />
              </div>
            )}
            {/* Ventana espejo superpuesta, movible y redimensionable */}
            <div
              style={{
                position: 'absolute',
                left: mirrorBox.x,
                top: mirrorBox.y,
                width: mirrorBox.width,
                height: mirrorBox.height,
                border: '3px solid #ff9800',
                background: '#222',
                zIndex: 10,
                boxShadow: '0 2px 12px #0008',
                cursor: mirrorDragging ? 'move' : 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={handleMirrorMouseDown}
            >
              <canvas
                ref={canvasRef}
                width={mirrorBox.width}
                height={mirrorBox.height}
                style={{ background: '#000', display: 'block', borderRadius: 4 }}
              />
              {/* Handle de redimensionado */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: 16,
                  height: 16,
                  background: '#ff9800',
                  cursor: 'nwse-resize',
                  zIndex: 11,
                  borderRadius: 4,
                }}
                onMouseDown={handleMirrorResizeDown}
              />
              <span style={{ color: '#fff', fontSize: 12, position: 'absolute', bottom: 8, left: 8, opacity: 0.7 }}>LSA destacado</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

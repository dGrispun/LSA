import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [box, setBox] = useState({ x: 50, y: 50, width: 200, height: 150 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState(null);
  const [mirrorSize, setMirrorSize] = useState({ width: 320, height: 180 });
  const [mirrorResizing, setMirrorResizing] = useState(false);
  const mirrorStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const boxStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleLocalVideo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalVideoUrl(URL.createObjectURL(file));
    }
  };

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

  const handleMouseMove = (e) => {
    if (dragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setBox((prev) => ({ ...prev, x: boxStart.current.x + dx, y: boxStart.current.y + dy }));
    } else if (resizing) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setBox((prev) => ({ ...prev, width: Math.max(50, boxStart.current.width + dx), height: Math.max(50, boxStart.current.height + dy) }));
    } else if (mirrorResizing) {
      const dx = e.clientX - mirrorStart.current.x;
      const dy = e.clientY - mirrorStart.current.y;
      setMirrorSize((prev) => ({
        width: Math.max(50, mirrorStart.current.width + dx),
        height: Math.max(50, mirrorStart.current.height + dy),
      }));
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
    setMirrorResizing(false);
  };

  // Redimensionar ventana espejo con mouse
  const handleMirrorResizeDown = (e) => {
    e.stopPropagation();
    setMirrorResizing(true);
    mirrorStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: mirrorSize.width,
      height: mirrorSize.height,
    };
  };

  useEffect(() => {
    if (dragging || resizing || mirrorResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, mirrorResizing]);

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
    // Limpia el canvas cuando cambia el video
    return () => ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [localVideoUrl, box, mirrorSize]);

  return (
    <div className="container">
      <h1>Reproductor de Video con Zona de LSA</h1>
      <p>Sube un video local, selecciona el área de interpretación y ajusta el tamaño de la ventana espejo arrastrando la esquina.</p>
      <div className="input-group" style={{ gap: 16 }}>
        <input type="file" accept="video/*" onChange={handleLocalVideo} />
      </div>
      <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'flex-start', marginTop: 32 }}>
        <div className="video-wrapper">
          {localVideoUrl && (
            <div className="video-container" style={{ position: 'relative', width: 640, height: 360 }}>
              <video
                ref={videoRef}
                src={localVideoUrl}
                width={640}
                height={360}
                controls
                style={{ display: 'block' }}
                crossOrigin="anonymous"
              />
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
            </div>
          )}
        </div>
        {/* Ventana espejo editable */}
        {localVideoUrl && (
          <div style={{ width: mirrorSize.width, height: mirrorSize.height, border: '1px solid #ccc', position: 'relative', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas
              ref={canvasRef}
              width={mirrorSize.width}
              height={mirrorSize.height}
              style={{ background: '#000', display: 'block' }}
            />
            {/* Handle de redimensionado */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 16,
                height: 16,
                background: '#00bcd4',
                cursor: 'nwse-resize',
                zIndex: 3,
                borderRadius: 4,
              }}
              onMouseDown={handleMirrorResizeDown}
            />
            <span style={{ color: '#fff', fontSize: 12, position: 'absolute', bottom: 8, left: 8, opacity: 0.7 }}>Vista espejo (área seleccionada)</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

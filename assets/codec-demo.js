/* === Video Codecs Course: Interactive Canvas Widgets === */

;(function() {
  'use strict';

  // ============================================================
  // 1. DCT COEFFICIENT HEAT MAP & BASIS VISUALIZATION
  // ============================================================

  window.DCTDemo = {
    /** Draw DCT basis functions for an 8×8 block */
    drawBasis: function(canvasId, u, v) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width || canvas.width || 100;
      const h = rect.height || canvas.height || w;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      const N = 8;
      const cellSize = Math.floor(Math.min(w, h) / N);
      const offsetX = Math.floor((w - cellSize * N) / 2);
      const offsetY = Math.floor((h - cellSize * N) / 2);

      // Draw DCT basis pattern
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          const val = Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
                       Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
          // Normalize to 0-255
          const c = Math.round(((val * 0.707) + 1) * 127.5);
          ctx.fillStyle = `rgb(${c},${c},${c})`;
          ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
        }
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= N; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + i * cellSize, offsetY);
        ctx.lineTo(offsetX + i * cellSize, offsetY + N * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * cellSize);
        ctx.lineTo(offsetX + N * cellSize, offsetY + i * cellSize);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#ff6b35';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`DCT basis (u=${u}, v=${v})`, w / 2, offsetY + N * cellSize + 16);
    },

    /** Draw a heat map of DCT coefficients from a sample block */
    drawCoefficientHeatMap: function(canvasId, blockData, coefficients) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width || canvas.width || 100;
      const h = rect.height || canvas.height || 200;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      // Create sample block if not provided
      if (!coefficients) {
        // Generate a smooth gradient block
        const N = 8;
        const block = [];
        for (let y = 0; y < N; y++) {
          block[y] = [];
          for (let x = 0; x < N; x++) {
            block[y][x] = Math.sin(x * 0.8) * Math.cos(y * 0.6) * 80 + 128;
          }
        }
        // Compute DCT coefficients (approximate)
        coefficients = [];
        let maxCoef = 0;
        for (let u = 0; u < N; u++) {
          coefficients[u] = [];
          for (let v = 0; v < N; v++) {
            let sum = 0;
            const Cu = u === 0 ? 1 / Math.sqrt(2) : 1;
            const Cv = v === 0 ? 1 / Math.sqrt(2) : 1;
            for (let x = 0; x < N; x++) {
              for (let y = 0; y < N; y++) {
                sum += block[y][x] *
                  Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
                  Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
              }
            }
            coefficients[u][v] = (2 / N) * Cu * Cv * sum;
            maxCoef = Math.max(maxCoef, Math.abs(coefficients[u][v]));
          }
        }

        // Normalize
        if (maxCoef > 0) {
          for (let u = 0; u < N; u++)
            for (let v = 0; v < N; v++)
              coefficients[u][v] /= maxCoef;
        }
      }

      const N = 8;
      const cellSize = Math.floor(Math.min(w, h) / N);
      const offsetX = Math.floor((w - cellSize * N) / 2);
      const offsetY = Math.floor((h - cellSize * N) / 2);

      // Draw heat map
      for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
          const val = (coefficients[u][v] + 1) / 2; // [-1, 1] → [0, 1]
          // Blue-to-red heatmap
          const r = Math.round(255 * val);
          const b = Math.round(255 * (1 - val));
          ctx.fillStyle = `rgb(${r},40,${b})`;
          ctx.fillRect(offsetX + u * cellSize, offsetY + v * cellSize, cellSize, cellSize);
        }
      }

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= N; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + i * cellSize, offsetY);
        ctx.lineTo(offsetX + i * cellSize, offsetY + N * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * cellSize);
        ctx.lineTo(offsetX + N * cellSize, offsetY + i * cellSize);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#00bcd4';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Low freq →', offsetX + N * cellSize / 2, offsetY + N * cellSize + 16);
    },

    /** Apply quantization and show how coefficients are reduced */
    applyQuantization: function(canvasId, qp, N) {
      N = N || 8;
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width || canvas.width || 100;
      const h = rect.height || canvas.height || 220;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      // Generate sample block
      const block = [];
      for (let y = 0; y < N; y++) {
        block[y] = [];
        for (let x = 0; x < N; x++) {
          block[y][x] = Math.sin(x * 0.8) * Math.cos(y * 0.6) * 80 + 128;
        }
      }

      // Forward DCT
      let coeffs = [];
      let maxCoef = 0;
      for (let u = 0; u < N; u++) {
        coeffs[u] = [];
        for (let v = 0; v < N; v++) {
          let sum = 0;
          const Cu = u === 0 ? 1 / Math.sqrt(2) : 1;
          const Cv = v === 0 ? 1 / Math.sqrt(2) : 1;
          for (let x = 0; x < N; x++)
            for (let y = 0; y < N; y++)
              sum += block[y][x] *
                Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
                Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
          coeffs[u][v] = (2 / N) * Cu * Cv * sum;
          maxCoef = Math.max(maxCoef, Math.abs(coeffs[u][v]));
        }
      }

      // Quantization step size (QP-based, simplified)
      const qStep = qp < 30 ? 1 + qp * 0.3 : 10 + (qp - 30) * 1.5;

      // Quantize and dequantize
      const quantCoeffs = [];
      for (let u = 0; u < N; u++) {
        quantCoeffs[u] = [];
        for (let v = 0; v < N; v++) {
          quantCoeffs[u][v] = Math.round(coeffs[u][v] / qStep) * qStep;
        }
      }

      // Inverse DCT
      const reconstructed = [];
      for (let y = 0; y < N; y++) {
        reconstructed[y] = [];
        for (let x = 0; x < N; x++) {
          let sum = 0;
          for (let u = 0; u < N; u++) {
            for (let v = 0; v < N; v++) {
              const Cu = u === 0 ? 1 / Math.sqrt(2) : 1;
              const Cv = v === 0 ? 1 / Math.sqrt(2) : 1;
              sum += Cu * Cv * quantCoeffs[u][v] *
                Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
                Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
            }
          }
          reconstructed[y][x] = Math.round((2 / N) * sum);
        }
      }

      // Compute PSNR
      let mse = 0;
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++)
          mse += Math.pow(block[y][x] - reconstructed[y][x], 2);
      mse /= (N * N);
      const psnr = mse > 0 ? 10 * Math.log10(255 * 255 / mse) : Infinity;

      // Count non-zero quantized coefficients
      let nzCount = 0;
      for (let u = 0; u < N; u++)
        for (let v = 0; v < N; v++)
          if (Math.abs(quantCoeffs[u][v]) > 0.5) nzCount++;

      // Draw 3 panels side by side
      const thirdW = Math.floor((w - 20) / 3);
      const cellSize = Math.floor(Math.min(thirdW - 10, h - 30) / N);

      const panels = [
        { label: 'Original', data: block },
        { label: `QP=${qp} (${nzCount}/${N*N} coeffs)`, data: reconstructed },
        { label: `PSNR: ${psnr.toFixed(1)} dB`, data: quantCoeffs, isCoef: true }
      ];

      panels.forEach((panel, pi) => {
        const ox = 5 + pi * (thirdW + 5);
        const oy = 5;

        // Panel title
        ctx.fillStyle = '#88889c';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(panel.label, ox + (N * cellSize) / 2, oy + N * cellSize + 14);

        if (panel.isCoef) {
          // Draw heat map for coefficients
          let maxV = 0;
          for (let u = 0; u < N; u++)
            for (let v = 0; v < N; v++)
              maxV = Math.max(maxV, Math.abs(panel.data[u][v]));
          for (let u = 0; u < N; u++) {
            for (let v = 0; v < N; v++) {
              const val = maxV > 0 ? Math.abs(panel.data[u][v]) / maxV : 0;
              const r = Math.round(255 * val);
              const b = Math.round(255 * (1 - val));
              ctx.fillStyle = `rgb(${r},40,${b})`;
              ctx.fillRect(ox + u * cellSize, oy + v * cellSize, cellSize, cellSize);
            }
          }
        } else {
          // Draw pixel block
          for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
              const val = Math.max(0, Math.min(255, Math.round(panel.data[y][x])));
              ctx.fillStyle = `rgb(${val},${val},${val})`;
              ctx.fillRect(ox + x * cellSize, oy + y * cellSize, cellSize, cellSize);
            }
          }
        }

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= N; i++) {
          ctx.beginPath();
          ctx.moveTo(ox + i * cellSize, oy);
          ctx.lineTo(ox + i * cellSize, oy + N * cellSize);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ox, oy + i * cellSize);
          ctx.lineTo(ox + N * cellSize, oy + i * cellSize);
          ctx.stroke();
        }
      });
    }
  };

  // ============================================================
  // 2. MOTION VECTOR EXPLORER
  // ============================================================

  window.MotionVectorDemo = {
    init: function(canvasId, stateId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.min(rect.width || canvas.width || 300, 500);
      const h = Math.min(rect.height || canvas.height || 200, 300);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      const state = {
        refBlockX: 150, refBlockY: 100,
        blockSize: 40,
        targetX: 200, targetY: 120,
        dragging: false,
        dragOffsetX: 0, dragOffsetY: 0
      };

      // Background grid
      const gridSize = 16;

      function draw() {
        ctx.clearRect(0, 0, w, h);

        // Reference frame
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#2a2a3e';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y <= h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Reference block in previous frame (faded)
        ctx.strokeStyle = 'rgba(0,188,212,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(state.refBlockX, state.refBlockY, state.blockSize, state.blockSize);
        ctx.setLineDash([]);

        // Fill reference with pattern
        ctx.save();
        ctx.beginPath();
        ctx.rect(state.refBlockX, state.refBlockY, state.blockSize, state.blockSize);
        ctx.clip();

        for (let py = state.refBlockY; py < state.refBlockY + state.blockSize; py += 8) {
          for (let px = state.refBlockX; px < state.refBlockX + state.blockSize; px += 8) {
            const c = 30 + ((px % 32) + (py % 32)) % 48;
            ctx.fillStyle = `rgb(${c},${c+10},${c+20})`;
            ctx.fillRect(px, py, 8, 8);
          }
        }
        ctx.restore();

        // Motion vector arrow
        const mvX = state.targetX - state.refBlockX;
        const mvY = state.targetY - state.refBlockY;

        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(state.refBlockX + state.blockSize / 2, state.refBlockY + state.blockSize / 2);
        ctx.lineTo(state.refBlockX + state.blockSize / 2 + mvX, state.refBlockY + state.blockSize / 2 + mvY);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(mvY, mvX);
        const headLen = 10;
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.moveTo(state.refBlockX + state.blockSize / 2 + mvX, state.refBlockY + state.blockSize / 2 + mvY);
        ctx.lineTo(
          state.refBlockX + state.blockSize / 2 + mvX - headLen * Math.cos(angle - 0.4),
          state.refBlockY + state.blockSize / 2 + mvY - headLen * Math.sin(angle - 0.4)
        );
        ctx.lineTo(
          state.refBlockX + state.blockSize / 2 + mvX - headLen * Math.cos(angle + 0.4),
          state.refBlockY + state.blockSize / 2 + mvY - headLen * Math.sin(angle + 0.4)
        );
        ctx.closePath();
        ctx.fill();

        // Target block (current frame) - same pattern but moved
        ctx.save();
        ctx.beginPath();
        ctx.rect(state.targetX, state.targetY, state.blockSize, state.blockSize);
        ctx.clip();

        const dx = state.targetX - state.refBlockX;
        const dy = state.targetY - state.refBlockY;
        ctx.translate(dx, dy);
        for (let py = state.refBlockY; py < state.refBlockY + state.blockSize; py += 8) {
          for (let px = state.refBlockX; px < state.refBlockX + state.blockSize; px += 8) {
            const c = 30 + ((px % 32) + (py % 32)) % 48;
            ctx.fillStyle = `rgb(${Math.min(255,c+15)},${Math.min(255,c+20)},${Math.min(255,c+25)})`;
            ctx.fillRect(px, py, 8, 8);
          }
        }
        ctx.restore();

        // Target block border
        ctx.strokeStyle = '#76ff03';
        ctx.lineWidth = 2;
        ctx.strokeRect(state.targetX, state.targetY, state.blockSize, state.blockSize);

        // MV label
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`MV = (${mvX}, ${mvY})`, 8, 18);

        // Legend
        ctx.fillStyle = '#88889c';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Dashed: reference block (prev frame)', 8, h - 24);
        ctx.fillStyle = '#76ff03';
        ctx.fillText('Solid: matched block (current frame)', 8, h - 10);
      }

      canvas.style.cursor = 'grab';

      canvas.addEventListener('mousedown', function(e) {
        const rect2 = canvas.getBoundingClientRect();
        const mx = e.clientX - rect2.left;
        const my = e.clientY - rect2.top;

        // Check if click is near target block
        if (mx >= state.targetX && mx <= state.targetX + state.blockSize &&
            my >= state.targetY && my <= state.targetY + state.blockSize) {
          state.dragging = true;
          state.dragOffsetX = mx - state.targetX;
          state.dragOffsetY = my - state.targetY;
          canvas.style.cursor = 'grabbing';
        }
      });

      canvas.addEventListener('mousemove', function(e) {
        if (!state.dragging) return;
        const rect2 = canvas.getBoundingClientRect();
        state.targetX = Math.max(4, Math.min(w - state.blockSize - 4, e.clientX - rect2.left - state.dragOffsetX));
        state.targetY = Math.max(4, Math.min(h - state.blockSize - 4, e.clientY - rect2.top - state.dragOffsetY));
        draw();
      });

      canvas.addEventListener('mouseup', function() {
        state.dragging = false;
        canvas.style.cursor = 'grab';
      });

      canvas.addEventListener('mouseleave', function() {
        state.dragging = false;
        canvas.style.cursor = 'grab';
      });

      // Touch support
      canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect2 = canvas.getBoundingClientRect();
        const mx = touch.clientX - rect2.left;
        const my = touch.clientY - rect2.top;
        if (mx >= state.targetX && mx <= state.targetX + state.blockSize &&
            my >= state.targetY && my <= state.targetY + state.blockSize) {
          state.dragging = true;
          state.dragOffsetX = mx - state.targetX;
          state.dragOffsetY = my - state.targetY;
        }
      }, { passive: false });

      canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!state.dragging) return;
        const touch = e.touches[0];
        const rect2 = canvas.getBoundingClientRect();
        state.targetX = Math.max(4, Math.min(w - state.blockSize - 4, touch.clientX - rect2.left - state.dragOffsetX));
        state.targetY = Math.max(4, Math.min(h - state.blockSize - 4, touch.clientY - rect2.top - state.dragOffsetY));
        draw();
      }, { passive: false });

      canvas.addEventListener('touchend', function() {
        state.dragging = false;
      });

      draw();
    }
  };

  // ============================================================
  // 3. QUANTIZATION QUALITY SLIDER
  // ============================================================

  window.QuantDemo = {
    init: function(canvasId, sliderId, qpDisplayId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const slider = document.getElementById(sliderId);
      if (!slider) return;
      const display = document.getElementById(qpDisplayId);

      const ctx = canvas.getContext('2d');
      let qp = parseInt(slider.value) || 25;

      // Generate test pattern (radial gradient + edges)
      function drawTestImage(q) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // Use CSS layout dimensions, fall back to canvas attributes if layout not ready yet
        const w = rect.width || canvas.width;
        const h = rect.height || canvas.height || 200;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        // Quantization step
        const qStep = Math.max(1, q * 0.4 + 2);

        // Create test image data
        const imgData = ctx.createImageData(w, h);
        const cx = w / 2, cy = h / 2;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;

            // Original pixel values (test pattern)
            let r = 0, g = 0, b = 0;

            // Smooth gradient
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Original: radial sine + checker + edges
            let orig = 128 + 100 * Math.sin(dist * 0.04) * Math.cos(angle * 3);
            orig += 40 * (Math.sin(x * 0.08) * Math.sin(y * 0.08));
            // Edge (step function)
            if (Math.abs(x - cx) < 3 || Math.abs(y - cy) < 3) orig = 200;

            // Quantize
            let quantized = Math.round(orig / qStep) * qStep;

            // Clamp
            quantized = Math.max(0, Math.min(255, quantized));

            // Color the reconstructed image
            // Use a color mapping to show banding
            if (q > 20) {
              // Add false color for banding visualization
              const band = Math.floor(quantized / (qStep * 2));
              const hue = (band * 30) % 360;
              // Monochrome with slight hue deviation at boundaries
              r = quantized;
              g = quantized + Math.sin(band * 0.5) * 5;
              b = quantized + Math.cos(band * 0.5) * 5;
            } else {
              r = quantized;
              g = quantized;
              b = quantized;
            }

            imgData.data[idx] = Math.max(0, Math.min(255, Math.round(r)));
            imgData.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
            imgData.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
            imgData.data[idx + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Overlay info
        ctx.fillStyle = 'rgba(14,14,18,0.75)';
        ctx.fillRect(0, 0, w, 32);
        ctx.fillStyle = '#00bcd4';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`QP = ${q} | Step = ${qStep.toFixed(1)}`, 8, 20);
      }

      function update() {
        qp = parseInt(slider.value);
        if (display) display.textContent = qp;
        drawTestImage(qp);
      }

      slider.addEventListener('input', update);
      update();
    }
  };

  // ============================================================
  // 4. BLOCK ARTIFACT EXPLORER
  // ============================================================

  window.ArtifactDemo = {
    init: function(canvasId, sliderId, typeSelectId, qpDisplayId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const slider = document.getElementById(sliderId);
      const typeSelect = document.getElementById(typeSelectId);
      const display = document.getElementById(qpDisplayId);
      const ctx = canvas.getContext('2d');
      let severity = parseInt(slider ? slider.value : 50);
      let artifactType = 'blocking';

      function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width || canvas.width || 100;
        const h = rect.height || canvas.height || 220;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(0, 0, w, h);

        if (artifactType === 'blocking') {
          drawBlocking(w, h);
        } else if (artifactType === 'ringing') {
          drawRinging(w, h);
        } else if (artifactType === 'banding') {
          drawBanding(w, h);
        } else if (artifactType === 'blurring') {
          drawBlurring(w, h);
        }
      }

      function drawBlocking(w, h) {
        // Simulate block-based quantization artifacts
        const blockSize = 8 + Math.floor(severity / 20) * 4;
        const noiseAmt = severity / 100;

        for (let by = 0; by < h; by += blockSize) {
          for (let bx = 0; bx < w; bx += blockSize) {
            // Each block has slightly different brightness
            const drift = (Math.sin(bx * 0.3 + by * 0.2) * 40 * noiseAmt);
            const base = 128 + drift;

            for (let y = by; y < Math.min(by + blockSize, h); y++) {
              for (let x = bx; x < Math.min(bx + blockSize, w); x++) {
                // Original smooth gradient
                const cx = w / 2, cy = h / 2;
                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                let px = 128 + 80 * Math.sin(dist * 0.03);

                // Quantize per block
                px = Math.round((px + drift) / (noiseAmt * 20 + 8)) * (noiseAmt * 20 + 8);
                px = Math.max(0, Math.min(255, px));

                ctx.fillStyle = `rgb(${px},${px},${px})`;
                ctx.fillRect(x, y, 1, 1);
              }
            }

            // Draw block grid
            ctx.strokeStyle = 'rgba(255,107,53,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, blockSize, blockSize);
          }
        }

        ctx.fillStyle = 'rgba(14,14,18,0.7)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`⚠ Blocking: ${blockSize}×${blockSize} blocks`, 8, 18);
      }

      function drawRinging(w, h) {
        // Gibbs phenomenon - ringing along sharp edges
        const rings = Math.floor(severity / 15) + 1;

        // Draw a sharp edge with ringing
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const cx = w * 0.4;
            let px;

            if (x < cx) {
              px = 50; // dark region
            } else {
              px = 200; // light region
            }

            // Add ringing at the edge
            const distFromEdge = x - cx;
            if (Math.abs(distFromEdge) < rings * 8) {
              const ringing = Math.exp(-Math.abs(distFromEdge) * 0.3) *
                              Math.sin(distFromEdge * 0.8) * 40 * (severity / 100);
              px += ringing;
            }

            px = Math.max(0, Math.min(255, Math.round(px)));
            ctx.fillStyle = `rgb(${px},${px},${px})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }

        ctx.fillStyle = 'rgba(14,14,18,0.7)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`⚠ Ringing: ${rings} ripple(s) along edge`, 8, 18);
      }

      function drawBanding(w, h) {
        // Color banding - smooth gradient with quantization in smooth areas
        const qStep = Math.max(4, Math.floor(severity / 3) + 2);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const cx = w / 2;
            const dist = Math.abs(x - cx) / cx;
            let px = 180 - dist * 160;
            // Quantize harshly
            px = Math.round(px / qStep) * qStep;
            px = Math.max(0, Math.min(255, px));

            ctx.fillStyle = `rgb(${px},${px},${px})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }

        ctx.fillStyle = 'rgba(14,14,18,0.7)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`⚠ Banding: step=${qStep} in smooth gradient`, 8, 18);
      }

      function drawBlurring(w, h) {
        // Simulated blur / detail loss
        const blurAmount = severity / 100;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            // Fine detail pattern
            const cx = w / 2, cy = h / 2;
            let detail = 128 + 100 * Math.sin(x * 0.1 + y * 0.08) * Math.cos(x * 0.05 - y * 0.07);
            // Sharp edge
            if (Math.abs(x - w * 0.7) < 2) detail = 220;

            // Apply blur (low-pass filter)
            const smoothX = x * (1 - blurAmount * 0.8);
            let px = 128 + 100 * Math.sin(smoothX * 0.1 + y * 0.08) * Math.cos(smoothX * 0.05 - y * 0.07);
            if (Math.abs(smoothX - w * 0.7 * (1 - blurAmount * 0.8)) < 2) px = 220;

            px = Math.max(0, Math.min(255, Math.round(px)));
            ctx.fillStyle = `rgb(${px},${px},${px})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }

        ctx.fillStyle = 'rgba(14,14,18,0.7)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`⚠ Blurring: ${(blurAmount * 100).toFixed(0)}% detail loss`, 8, 18);
      }

      function update() {
        if (slider) severity = parseInt(slider.value);
        if (typeSelect) artifactType = typeSelect.value;
        if (display) display.textContent = severity;
        draw();
      }

      if (slider) slider.addEventListener('input', update);
      if (typeSelect) typeSelect.addEventListener('change', update);
      update();
    }
  };

  // ============================================================
  // 5. RATE-DISTORTION CURVE COMPARISON
  // ============================================================

  window.RDDemo = {
    init: function(canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width || canvas.width || 100;
        const h = rect.height || canvas.height || 240;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const pad = { top: 20, right: 20, bottom: 40, left: 50 };
        const plotW = w - pad.left - pad.right;
        const plotH = h - pad.top - pad.bottom;

        // Background
        ctx.fillStyle = '#0e0e12';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(pad.left, pad.top, plotW, plotH);

        // Grid
        ctx.strokeStyle = '#2a2a3e';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 5; i++) {
          const x = pad.left + (plotW / 5) * i;
          const y = pad.top + (plotH / 5) * i;
          ctx.beginPath();
          ctx.moveTo(x, pad.top);
          ctx.lineTo(x, pad.top + plotH);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pad.left, y);
          ctx.lineTo(pad.left + plotW, y);
          ctx.stroke();
        }

        // Axes labels
        ctx.fillStyle = '#88889c';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Bitrate →', pad.left + plotW / 2, h - 6);
        ctx.save();
        ctx.translate(10, pad.top + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Quality (PSNR) →', 0, 0);
        ctx.restore();

        // Curves: each codec
        const codecs = [
          {
            name: 'H.264',
            color: '#00bcd4',
            fn: function(t) { return 48 - 15 * Math.exp(-t * 4) - t * 2; }
          },
          {
            name: 'H.265/HEVC',
            color: '#76ff03',
            fn: function(t) { return 50 - 14 * Math.exp(-t * 5) - t * 1.5; }
          },
          {
            name: 'AV1',
            color: '#ff6b35',
            fn: function(t) { return 52 - 13 * Math.exp(-t * 5.5) - t * 1.2; }
          },
          {
            name: 'VP9',
            color: '#ffeb3b',
            fn: function(t) { return 49 - 14 * Math.exp(-t * 4.5) - t * 1.8; }
          }
        ];

        codecs.forEach(function(codec) {
          ctx.strokeStyle = codec.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const steps = 100;
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const bitrate = 0.1 + t * 0.9; // normalized bitrate
            const psnr = codec.fn(t);
            const x = pad.left + bitrate * plotW;
            const y = pad.top + plotH - ((psnr - 30) / 20) * plotH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        // Legend
        let lx = pad.left + 8;
        let ly = pad.top + 10;
        codecs.forEach(function(codec, i) {
          const perRow = 2;
          const col = i % perRow;
          const row = Math.floor(i / perRow);
          const lx2 = lx + col * (plotW / 2);
          const ly2 = ly + row * 14;

          ctx.fillStyle = codec.color;
          ctx.fillRect(lx2, ly2, 12, 3);
          ctx.fillStyle = '#e0e0ea';
          ctx.font = '10px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(codec.name, lx2 + 16, ly2 + 4);
        });

        // Annotation at top
        ctx.fillStyle = '#00bcd4';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Higher curve = better efficiency (more quality at same bitrate)', pad.left + plotW / 2, 12);
      }

      // Redraw on resize
      let resizeTimer;
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(draw, 150);
      });
      draw();
    }
  };

  // ============================================================
  // 6. GOP STRUCTURE VISUALIZER
  // ============================================================

  window.GOPDemo = {
    init: function(canvasId, sliderId, displayId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const slider = document.getElementById(sliderId);
      const display = document.getElementById(displayId);
      const ctx = canvas.getContext('2d');
      let gopSize = parseInt(slider ? slider.value : 12);

      function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width || canvas.width || 100;
        const h = rect.height || canvas.height || 140;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#0e0e12';
        ctx.fillRect(0, 0, w, h);

        const numFrames = gopSize;
        const totalWidth = w - 40;
        const frameW = Math.min(36, totalWidth / numFrames);
        const startX = (w - frameW * numFrames) / 2;
        const frameY = 35;
        const frameH = 60;

        for (let i = 0; i < numFrames; i++) {
          const x = startX + i * frameW;
          const spacing = 4;

          // Determine frame type
          let type, color, label;
          if (i === 0 || i % 12 === 0) {
            type = 'I';
            color = '#ff6b35';
          } else if (i % 3 === 0) {
            type = 'P';
            color = '#00bcd4';
          } else {
            type = 'B';
            color = '#88889c';
          }

          // Draw frame rectangle
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.85;
          const fw = frameW - spacing;
          const rx = x + spacing / 2;
          ctx.fillRect(rx, frameY, fw, frameH);
          ctx.globalAlpha = 1;

          // Border
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(rx, frameY, fw, frameH);

          // Frame number
          ctx.fillStyle = '#e0e0ea';
          ctx.font = '9px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(i + 1, rx + fw / 2, frameY + frameH / 2 - 4);

          // Type label
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px system-ui, sans-serif';
          ctx.fillText(type, rx + fw / 2, frameY + frameH / 2 + 12);

          // Arrows between frames showing prediction dependencies
          if (i > 0) {
            if (type === 'P') {
              // Arrow from previous I or P frame
              ctx.strokeStyle = color;
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              ctx.beginPath();
              ctx.moveTo(rx - spacing / 2, frameY + frameH / 2);
              ctx.lineTo(rx, frameY + frameH / 2);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (type === 'B') {
              // Bidirectional arrows
              ctx.strokeStyle = '#88889c';
              ctx.lineWidth = 0.8;
              ctx.setLineDash([1, 2]);
              // Find nearest I or P before and after
              let prevRef = -1, nextRef = -1;
              for (let j = i - 1; j >= 0; j--) {
                if (j === 0 || j % 3 === 0) { prevRef = j; break; }
              }
              for (let j = i + 1; j < numFrames; j++) {
                if (j === 0 || j % 3 === 0 || j % 3 === 0) { nextRef = j; break; }
              }
              // Draw small arrows
              const arrowY = frameY + frameH + 8;
              ctx.beginPath();
              ctx.moveTo(rx, arrowY);
              ctx.lineTo(rx + fw / 2, arrowY + 6);
              ctx.lineTo(rx + fw, arrowY);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }

        // Label
        ctx.fillStyle = '#88889c';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GOP (Group of Pictures) structure', w / 2, h - 6);

        // Legend
        ctx.textAlign = 'left';
        const legX = 8;
        ctx.fillStyle = '#ff6b35';
        ctx.fillRect(legX, h - 28, 10, 10);
        ctx.fillStyle = '#e0e0ea';
        ctx.font = '9px system-ui, sans-serif';
        ctx.fillText('I', legX + 14, h - 18);

        const legX2 = legX + 40;
        ctx.fillStyle = '#00bcd4';
        ctx.fillRect(legX2, h - 28, 10, 10);
        ctx.fillStyle = '#e0e0ea';
        ctx.fillText('P', legX2 + 14, h - 18);

        const legX3 = legX2 + 40;
        ctx.fillStyle = '#88889c';
        ctx.fillRect(legX3, h - 28, 10, 10);
        ctx.fillStyle = '#e0e0ea';
        ctx.fillText('B', legX3 + 14, h - 18);
      }

      function update() {
        if (slider) gopSize = parseInt(slider.value);
        if (display) display.textContent = gopSize;
        draw();
      }

      if (slider) slider.addEventListener('input', update);
      draw();
    }
  };

  // ============================================================
  // 7. YUV COLOR SPACE & CHROMA SUBSAMPLING
  // ============================================================

  window.ColorSpaceDemo = {
    init: function(canvasId, subsamplingSelectId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const select = document.getElementById(subsamplingSelectId);
      const ctx = canvas.getContext('2d');
      let subsampling = select ? select.value : '4:4:4';

      function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width || canvas.width || 100;
        const h = rect.height || canvas.height || 200;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#0e0e12';
        ctx.fillRect(0, 0, w, h);

        // Draw a test pattern: 4 colored blocks side by side
        const blocks = [
          { r: 180, g: 40, b: 40, label: 'Red' },
          { r: 40, g: 180, b: 40, label: 'Green' },
          { r: 40, g: 40, b: 180, label: 'Blue' },
          { r: 180, g: 180, b: 40, label: 'Yellow' }
        ];

        const numBlocks = blocks.length;
        const blockW = Math.floor((w - 40) / numBlocks);
        const blockH = Math.min(blockW * 0.8, h - 60);
        const startY = 30;

        // Convert RGB to YUV
        const yuvBlocks = blocks.map(function(b) {
          const y  = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
          const cb = 128 + (-0.1687 * b.r - 0.3313 * b.g + 0.5 * b.b);
          const cr = 128 + (0.5 * b.r - 0.4187 * b.g - 0.0813 * b.b);
          return { y: y, cb: cb, cr: cr, label: b.label, r: b.r, g: b.g, b: b.b };
        });

        if (subsampling !== '4:4:4') {
          // Apply subsampling: reduce chroma resolution
          const ssFactor = subsampling === '4:2:2' ? 2 : (subsampling === '4:2:0' ? 4 : 1);

          // Average chroma across groups
          if (ssFactor > 1) {
            for (let i = 0; i < numBlocks; i += ssFactor) {
              let avgCb = 0, avgCr = 0, count = 0;
              for (let j = 0; j < ssFactor && i + j < numBlocks; j++) {
                avgCb += yuvBlocks[i + j].cb;
                avgCr += yuvBlocks[i + j].cr;
                count++;
              }
              avgCb /= count;
              avgCr /= count;
              for (let j = 0; j < ssFactor && i + j < numBlocks; j++) {
                yuvBlocks[i + j].cb = avgCb;
                yuvBlocks[i + j].cr = avgCr;
              }
            }
          }
        }

        // Convert back to RGB for display
        const displayBlocks = yuvBlocks.map(function(yuv) {
          const Y = yuv.y;
          const Cb = yuv.cb;
          const Cr = yuv.cr;
          const r = Y + 1.402 * (Cr - 128);
          const g = Y - 0.344 * (Cb - 128) - 0.714 * (Cr - 128);
          const b = Y + 1.772 * (Cb - 128);
          return {
            r: Math.max(0, Math.min(255, Math.round(r))),
            g: Math.max(0, Math.min(255, Math.round(g))),
            b: Math.max(0, Math.min(255, Math.round(b))),
            label: yuv.label
          };
        });

        // Draw each block
        displayBlocks.forEach(function(block, i) {
          const x = 10 + i * (blockW + 4);

          // Block with border
          ctx.fillStyle = `rgb(${block.r},${block.g},${block.b})`;
          ctx.fillRect(x, startY, blockW, blockH);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, startY, blockW, blockH);

          // Label
          ctx.fillStyle = '#e0e0ea';
          ctx.font = '11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(block.label, x + blockW / 2, startY + blockH + 16);

          // Color error indicator
          if (subsampling !== '4:4:4') {
            const err = Math.sqrt(
              Math.pow(block.r - blocks[i].r, 2) +
              Math.pow(block.g - blocks[i].g, 2) +
              Math.pow(block.b - blocks[i].b, 2)
            );
            ctx.fillStyle = err > 5 ? '#ff6b35' : '#76ff03';
            ctx.font = '9px system-ui, sans-serif';
            ctx.fillText(err > 5 ? '✗' : '✓', x + blockW / 2, startY + blockH + 30);
          }
        });

        // Title
        ctx.fillStyle = '#00bcd4';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Chroma Subsampling: ${subsampling}`, w / 2, 14);
      }

      function update() {
        if (select) subsampling = select.value;
        draw();
      }

      if (select) select.addEventListener('change', update);
      draw();
    }
  };

  // ============================================================
  // 8. MACROBLOCK PARTITIONING VISUALIZER
  // ============================================================

  window.PartitionDemo = {
    init: function(canvasId, depthSliderId, displayId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const slider = document.getElementById(depthSliderId);
      const display = document.getElementById(displayId);
      const ctx = canvas.getContext('2d');
      let maxDepth = parseInt(slider ? slider.value : 3);

      function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width || canvas.width || 100;
        const h = rect.height || canvas.height || w;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(0, 0, w, h);

        // Quadtree partition simulation
        const size = Math.min(w, h) - 20;
        const offsetX = (w - size) / 2;
        const offsetY = (h - size) / 2;

        function drawQuadrant(x, y, sz, depth, maxD) {
          if (depth >= maxD || sz < 8) {
            // Draw leaf block
            const hue = (depth * 40 + x * 0.2 + y * 0.2) % 360;
            ctx.fillStyle = '#22222e';
            ctx.fillRect(x, y, sz, sz);
            ctx.strokeStyle = depth >= 2 ? '#76ff03' : '#00bcd4';
            ctx.lineWidth = depth >= 2 ? 1.5 : 1;
            ctx.strokeRect(x, y, sz, sz);

            // Small texture to show block content
            if (sz > 16) {
              ctx.fillStyle = 'rgba(255,255,255,0.03)';
              ctx.fillRect(x + 4, y + 4, sz - 8, sz - 8);
            }
            return;
          }

          const half = sz / 2;
          // Split into 4
          drawQuadrant(x, y, half, depth + 1, maxD);
          drawQuadrant(x + half, y, half, depth + 1, maxD);
          drawQuadrant(x, y + half, half, depth + 1, maxD);
          drawQuadrant(x + half, y + half, half, depth + 1, maxD);

          // Draw thicker border for higher-level splits
          ctx.strokeStyle = 'rgba(255,107,53,0.4)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, y, sz, sz);
        }

        drawQuadrant(offsetX, offsetY, size, 0, maxDepth);

        // Title
        ctx.fillStyle = '#88889c';
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Partition depth: ${maxDepth} | ${Math.pow(4, maxDepth)} blocks (${Math.round(size / Math.pow(2, maxDepth))}px each)`, w / 2, 12);

        // Block count info
        const leafCount = Math.pow(4, maxDepth);
        ctx.fillText(`${leafCount} leaf blocks`, w / 2, h - 4);
      }

      function update() {
        if (slider) maxDepth = parseInt(slider.value);
        if (display) display.textContent = maxDepth;
        draw();
      }

      if (slider) slider.addEventListener('input', update);
      draw();
    }
  };

  // ============================================================
  // 9. IN-LOOP FILTER DEMO (Deblocking)
  // ============================================================

  window.FilterDemo = {
    init: function(canvasId, strengthSliderId, displayId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const slider = document.getElementById(strengthSliderId);
      const display = document.getElementById(displayId);
      const ctx = canvas.getContext('2d');
      let strength = parseInt(slider ? slider.value : 50);

      function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width || canvas.width || 100;
        const h = rect.height || 160;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#1a1a22';
        ctx.fillRect(0, 0, w, h);

        const halfW = Math.floor((w - 20) / 2);
        const blockH = Math.min(h - 40, 80);
        const yOffset = (h - blockH) / 2;

        // Left: Before filter
        drawBlocky(ctx, 5, yOffset, halfW, blockH, 8, false);
        ctx.fillStyle = '#88889c';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Before deblocking', 5 + halfW / 2, yOffset + blockH + 16);

        // Right: After filter
        drawBlocky(ctx, halfW + 15, yOffset, halfW, blockH, Math.max(1, Math.floor(8 - strength / 14)), true);
        ctx.fillText('After deblocking', halfW + 15 + halfW / 2, yOffset + blockH + 16);
      }

      function drawBlocky(ctx, x, y, w, h, blockSize, filtered) {
        const cols = Math.floor(w / blockSize);
        const rows = Math.floor(h / blockSize);
        const actualW = cols * blockSize;
        const actualH = rows * blockSize;

        // Fill with slightly different blocks (simulating compression blocks)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            // Each block has a random-ish value
            const base = 100 + ((c * 17 + r * 31) % 60);
            const bx = x + c * blockSize;
            const by = y + r * blockSize;

            if (filtered) {
              // Smooth transition at boundaries
              for (let py = 0; py < blockSize; py++) {
                for (let px = 0; px < blockSize; px++) {
                  const blendX = Math.min(px, blockSize - 1 - px) / (blockSize / 2);
                  const blendY = Math.min(py, blockSize - 1 - py) / (blockSize / 2);
                  const blend = Math.min(blendX, blendY);
                  const smooth = base + (50 - base) * (1 - blend) * 0.3;
                  const v = Math.max(0, Math.min(255, Math.round(smooth)));
                  ctx.fillStyle = `rgb(${v},${v},${v})`;
                  ctx.fillRect(bx + px, by + py, 1, 1);
                }
              }
            } else {
              // Sharp block boundaries
              ctx.fillStyle = `rgb(${base},${base},${base})`;
              ctx.fillRect(bx, by, blockSize, blockSize);
              ctx.strokeStyle = 'rgba(255,107,53,0.35)';
              ctx.lineWidth = 1;
              ctx.strokeRect(bx, by, blockSize, blockSize);
            }
          }
        }
      }

      function update() {
        if (slider) strength = parseInt(slider.value);
        if (display) display.textContent = strength;
        draw();
      }

      if (slider) slider.addEventListener('input', update);
      draw();
    }
  };

  // ============================================================
  // 10. PIXEL / TRANSFORM BLOCK VISUALIZER
  // ============================================================

  window.PixelBlockDemo = {
    init: function(canvasId, blockSize) {
      blockSize = blockSize || 16;
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width || canvas.width || 100;
        const h = rect.height || 150;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const N = blockSize;
        const cellSize = Math.floor(Math.min(w, h - 40) / N);
        const ox = Math.floor((w - cellSize * N) / 2);
        const oy = 20;

        // Generate pixel data with a pattern
        for (let y = 0; y < N; y++) {
          for (let x = 0; x < N; x++) {
            const val = 128 + 100 * Math.sin(x * 0.5 + y * 0.3) * Math.cos(x * 0.1 - y * 0.2);
            const c = Math.max(0, Math.min(255, Math.round(val)));
            ctx.fillStyle = `rgb(${c},${c},${c})`;
            ctx.fillRect(ox + x * cellSize, oy + y * cellSize, cellSize, cellSize);
          }
        }

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= N; i++) {
          ctx.beginPath();
          ctx.moveTo(ox + i * cellSize, oy);
          ctx.lineTo(ox + i * cellSize, oy + N * cellSize);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ox, oy + i * cellSize);
          ctx.lineTo(ox + N * cellSize, oy + i * cellSize);
          ctx.stroke();
        }

        ctx.fillStyle = '#88889c';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${N}×${N} pixel block`, w / 2, oy + N * cellSize + 14);
      }

      draw();
    }
  };

  // ============================================================
  // UTILITY: Resize all canvases on window resize
  // ============================================================

  document.addEventListener('DOMContentLoaded', function() {
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        // Trigger a custom event for canvases that need redrawing
        document.dispatchEvent(new CustomEvent('canvas-resize'));
      }, 200);
    });
  });

})();
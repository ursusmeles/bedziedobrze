import { animate } from "motion";

document.addEventListener("mousemove", (e) => {
  // 1. Track both horizontal (X) and vertical (Y) mouse positions
  const normalizedX = (e.clientX / window.innerWidth) - 0.5;
  const normalizedY = (e.clientY / window.innerHeight) - 0.5;
  
  // 2. Combine them and invert the output with a negative multiplier.
  // Now, moving down or right will rotate it in the opposite direction.
  const targetRotation = (normalizedX + normalizedY) * -150;

  animate(
    ".animated-gradient",
    { rotate: targetRotation },
    { 
      type: "spring", 
      stiffness: 500, 
      damping: 100, 
      weight: 1
    }
  );
});

/*
animate(
  ".animated-gradient",
  { rotate: [-25, 25] },
  { 
    duration: 2.5,
    repeat: Infinity, 
    repeatType: "mirror",
    ease: [0.6, 0.05, 0.15, 0.95]
  }
);
*/

const ball = document.querySelector(".ball");

let isDragging = false;
let currentX = 0, currentY = 0; 
let startX = 0, startY = 0;     
let lastX = 0, lastY = 0;       
let lastTime = 0;
let velocityX = 0, velocityY = 0;

// NEW: Trackers for optimization
let activeAnimation = null; 
let isDrawing = false;      

ball.addEventListener("pointerdown", (e) => {
  isDragging = true;
  ball.setPointerCapture(e.pointerId);
  
  // NEW: Instantly kill any running physics animation on grab
  if (activeAnimation) activeAnimation.stop();
  
  const computedStyle = window.getComputedStyle(ball);
  const matrix = new DOMMatrixReadOnly(computedStyle.transform);
  currentX = matrix.m41 || 0;
  currentY = matrix.m42 || 0;
  
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;
  
  lastX = e.clientX;
  lastY = e.clientY;
  lastTime = performance.now();
});

ball.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  
  const now = performance.now();
  const dt = Math.max(now - lastTime, 1); 
  
  velocityX = ((e.clientX - lastX) / dt) * 1000;
  velocityY = ((e.clientY - lastY) / dt) * 1000;
  
  lastX = e.clientX;
  lastY = e.clientY;
  lastTime = now;

  // NEW: Throttle DOM writes to the screen's native refresh rate
  if (!isDrawing) {
    isDrawing = true;
    requestAnimationFrame(() => {
      ball.style.transform = `translate(${currentX}px, ${currentY}px)`;
      isDrawing = false;
    });
  }
});

ball.addEventListener("pointerup", () => {
  if (!isDragging) return;
  isDragging = false;
  
  const momentumMultiplier = 0.2; 
  const targetX = currentX + (velocityX * momentumMultiplier);
  const targetY = currentY + (velocityY * momentumMultiplier);
  
  activeAnimation = animate(
    ball,
    { 
      // Passing an array [start, end] forces Motion to acknowledge 
      // the exact pixel where you let go of the mouse.
      x: [currentX, targetX], 
      y: [currentY, targetY] 
    },
    { type: "spring", stiffness: 450, damping: 30 }
  );
});
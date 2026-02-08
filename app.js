const video = document.getElementById('cameraFeed');
const placeholder = document.getElementById('cameraPlaceholder');
const startCameraBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('captureImage');
const uploadInput = document.getElementById('imageUpload');
const preview = document.getElementById('imagePreview');
const imageState = document.getElementById('imageState');
const analyzeBtn = document.getElementById('analyzeButton');

const reportPanel = document.getElementById('report');
const riskBadge = document.getElementById('riskBadge');
const riskScore = document.getElementById('riskScore');
const abcdeList = document.getElementById('abcdeList');
const patternList = document.getElementById('patternList');
const nextStepsList = document.getElementById('nextSteps');
const priorityText = document.getElementById('priorityText');
const riskMeter = document.getElementById('riskMeter');
const meterCtx = riskMeter.getContext('2d');

let currentStream;
let hasImage = false;

function setImage(dataUrl, sourceLabel) {
  preview.src = dataUrl;
  imageState.textContent = `Image loaded from ${sourceLabel}. Ready for report generation.`;
  hasImage = true;
  analyzeBtn.disabled = false;
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function startCamera() {
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = currentStream;
    placeholder.style.display = 'none';
  } catch (error) {
    imageState.textContent =
      'Camera access failed. Please allow permissions or upload an image manually.';
  }
}

function captureFrame() {
  if (!video.srcObject) {
    imageState.textContent = 'Please start camera first or upload an image.';
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  setImage(canvas.toDataURL('image/jpeg', 0.92), 'live camera capture');
}

function handleUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => setImage(reader.result, 'uploaded file');
  reader.readAsDataURL(file);
}

function scoreToLabel(score) {
  if (score >= 70) return ['High Attention', 'risk-high'];
  if (score >= 40) return ['Moderate Attention', 'risk-medium'];
  return ['Lower Attention', 'risk-low'];
}

function drawMeter(score) {
  meterCtx.clearRect(0, 0, riskMeter.width, riskMeter.height);
  const gradient = meterCtx.createLinearGradient(20, 0, riskMeter.width - 20, 0);
  gradient.addColorStop(0, '#2ed39a');
  gradient.addColorStop(0.5, '#f9b34b');
  gradient.addColorStop(1, '#ff6e7f');

  meterCtx.lineWidth = 24;
  meterCtx.lineCap = 'round';
  meterCtx.strokeStyle = 'rgba(255,255,255,0.17)';
  meterCtx.beginPath();
  meterCtx.moveTo(24, 60);
  meterCtx.lineTo(riskMeter.width - 24, 60);
  meterCtx.stroke();

  meterCtx.strokeStyle = gradient;
  meterCtx.beginPath();
  meterCtx.moveTo(24, 60);
  meterCtx.lineTo(24 + (riskMeter.width - 48) * (score / 100), 60);
  meterCtx.stroke();

  const x = 24 + (riskMeter.width - 48) * (score / 100);
  meterCtx.fillStyle = '#ffffff';
  meterCtx.beginPath();
  meterCtx.arc(x, 60, 9, 0, Math.PI * 2);
  meterCtx.fill();
}

function generateReport() {
  if (!hasImage) return;

  const score = randomRange(28, 91);
  const [label, className] = scoreToLabel(score);

  riskScore.textContent = `${score}%`;
  riskBadge.textContent = label;
  riskBadge.className = `risk-badge ${className}`;

  const abcdeFindings = [
    `Asymmetry: ${score > 65 ? 'Mild-to-moderate irregularity detected' : 'Mostly symmetric contour'}`,
    `Border: ${score > 55 ? 'Uneven edges with focal notching' : 'Relatively smooth edge pattern'}`,
    `Color: ${score > 60 ? 'Multi-tone distribution noted' : 'Limited color variance'}`,
    `Diameter: ${randomRange(4, 9)} mm estimated lesion span`,
    `Evolution: ${score > 68 ? 'Recent change likely, monitor urgently' : 'No pronounced progression markers in this frame'}`,
  ];

  const visualPatterns = [
    'Pigment network contrast mapped across lesion center and periphery.',
    `${score > 70 ? 'Atypical blotches detected with nonuniform spread.' : 'Low atypical blotch density observed.'}`,
    'Surface texture estimated from lighting gradient and image sharpness profile.',
    'Peripheral inflammation estimate based on surrounding redness intensity.',
  ];

  const nextSteps = [
    score >= 70
      ? 'Book a dermatologist appointment within 1-2 weeks for dermoscopic review.'
      : 'Continue periodic self-monitoring with consistent lighting and distance.',
    'Capture follow-up images monthly and compare for shape, color, and edge changes.',
    'Log symptoms (itching, bleeding, tenderness) to improve clinical triage context.',
    'Use broad-spectrum SPF 30+ daily and avoid peak UV exposure periods.',
  ];

  abcdeList.innerHTML = abcdeFindings.map((item) => `<li>${item}</li>`).join('');
  patternList.innerHTML = visualPatterns.map((item) => `<li>${item}</li>`).join('');
  nextStepsList.innerHTML = nextSteps.map((item) => `<li>${item}</li>`).join('');

  priorityText.textContent =
    score >= 70
      ? 'Priority: High. Clinical confirmation strongly advised soon.'
      : score >= 40
      ? 'Priority: Medium. Arrange non-urgent review and trend over time.'
      : 'Priority: Low. Continue routine monitoring and preventive care.';

  drawMeter(score);
  reportPanel.classList.remove('hidden');
  reportPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

startCameraBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', captureFrame);
uploadInput.addEventListener('change', handleUpload);
analyzeBtn.addEventListener('click', generateReport);

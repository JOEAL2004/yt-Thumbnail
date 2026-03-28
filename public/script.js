const form = document.getElementById('swapForm');
const thumbnailInput = document.getElementById('thumbnail');
const portraitInput = document.getElementById('portrait');
const thumbnailPreview = document.getElementById('thumbnailPreview');
const portraitPreview = document.getElementById('portraitPreview');
const instructionsInput = document.getElementById('instructions');
const submitBtn = document.getElementById('submitBtn');
const statusEl = document.getElementById('status');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadLink = document.getElementById('downloadLink');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

let progressTimer = null;

const setStatus = (message, kind = '') => {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`.trim();
};

const readFilePreview = (file, previewElement) => {
  if (!file) {
    previewElement.hidden = true;
    previewElement.removeAttribute('src');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    previewElement.src = reader.result;
    previewElement.hidden = false;
  };
  reader.readAsDataURL(file);
};

const setupInputPreview = (inputEl, previewEl) => {
  inputEl.addEventListener('change', () => {
    const [file] = inputEl.files;
    readFilePreview(file, previewEl);
  });
};

setupInputPreview(thumbnailInput, thumbnailPreview);
setupInputPreview(portraitInput, portraitPreview);

const setupDragDrop = () => {
  const uploadPanels = document.querySelectorAll('.upload-panel');

  uploadPanels.forEach((panel) => {
    const inputName = panel.dataset.dropTarget;
    const inputEl = document.getElementById(inputName);

    ['dragenter', 'dragover'].forEach((eventName) => {
      panel.addEventListener(eventName, (event) => {
        event.preventDefault();
        panel.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      panel.addEventListener(eventName, (event) => {
        event.preventDefault();
        panel.classList.remove('drag-over');
      });
    });

    panel.addEventListener('drop', (event) => {
      const droppedFile = event.dataTransfer.files?.[0];
      if (!droppedFile) return;

      const transfer = new DataTransfer();
      transfer.items.add(droppedFile);
      inputEl.files = transfer.files;
      inputEl.dispatchEvent(new Event('change'));
    });
  });
};

setupDragDrop();

const startFakeProgress = () => {
  progressContainer.hidden = false;
  progressBar.style.width = '0%';
  let current = 0;

  progressTimer = setInterval(() => {
    current = Math.min(current + Math.random() * 9, 90);
    progressBar.style.width = `${current.toFixed(0)}%`;
  }, 350);
};

const completeProgress = () => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  progressBar.style.width = '100%';
  setTimeout(() => {
    progressContainer.hidden = true;
    progressBar.style.width = '0%';
  }, 500);
};

const toDataUrl = (mimeType, base64) => `data:${mimeType};base64,${base64}`;

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const thumbnail = thumbnailInput.files?.[0];
  const portrait = portraitInput.files?.[0];

  if (!thumbnail || !portrait) {
    setStatus('Please upload both thumbnail and portrait images.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('thumbnail', thumbnail);
  formData.append('portrait', portrait);
  formData.append('instructions', instructionsInput.value.trim());

  submitBtn.disabled = true;
  resultSection.hidden = true;
  setStatus('Generating your face swap... this can take a few seconds.', '');
  startFakeProgress();

  try {
    const response = await fetch('/api/swap-face', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to generate image');
    }

    const dataUrl = toDataUrl(payload.mimeType || 'image/png', payload.imageBase64);
    resultImage.src = dataUrl;
    downloadLink.href = dataUrl;
    resultSection.hidden = false;

    setStatus('Face swap completed successfully.', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Generation failed. Please try again.', 'error');
  } finally {
    completeProgress();
    submitBtn.disabled = false;
  }
});

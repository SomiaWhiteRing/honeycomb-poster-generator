const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imageList = document.getElementById("imageList");
const imageUpload = document.getElementById("imageUpload");
let hexagons = [];
let images = [];
let draggedImageHex = null;
let preRenderedHexagons = new Map();
let dragPreviewCanvas = null;
let db = null;

// 默认配置
const defaultConfig = {
  startX: -49,
  startY: -88,
  hexWidth: 188,
  hexHeight: 167,
  rows: 7,
  cols: 14,
  canvasWidth: 1920,
  canvasHeight: 1080,
};

// 获取配置
function getConfig() {
  const savedConfig = localStorage.getItem("hexLayoutConfig");
  return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
}

// 保存配置
function updateConfig() {
  const config = {
    startX: parseInt(document.getElementById("startX").value) || defaultConfig.startX,
    startY: parseInt(document.getElementById("startY").value) || defaultConfig.startY,
    hexWidth: parseInt(document.getElementById("hexWidth").value) || defaultConfig.hexWidth,
    hexHeight: parseInt(document.getElementById("hexHeight").value) || defaultConfig.hexHeight,
    rows: parseInt(document.getElementById("rows").value) || defaultConfig.rows,
    cols: parseInt(document.getElementById("cols").value) || defaultConfig.cols,
    canvasWidth: parseInt(document.getElementById("canvasWidth").value) || defaultConfig.canvasWidth,
    canvasHeight: parseInt(document.getElementById("canvasHeight").value) || defaultConfig.canvasHeight,
  };

  localStorage.setItem("hexLayoutConfig", JSON.stringify(config));

  // 更新画布尺寸
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;

  initHexGrid();
  render().catch((error) => {
    console.error("Render failed after config update:", error);
  });
}

// 添加输入事件监听
function addConfigListeners() {
  const configInputs = [
    "startX",
    "startY",
    "hexWidth",
    "hexHeight",
    "rows",
    "cols",
    "canvasWidth",
    "canvasHeight",
  ];
  configInputs.forEach((id) => {
    document.getElementById(id).addEventListener("input", updateConfig);
  });
}

// 加载配置到表单
function loadConfigToForm() {
  const config = getConfig();
  document.getElementById("startX").value = config.startX;
  document.getElementById("startY").value = config.startY;
  document.getElementById("hexWidth").value = config.hexWidth;
  document.getElementById("hexHeight").value = config.hexHeight;
  document.getElementById("rows").value = config.rows;
  document.getElementById("cols").value = config.cols;
  document.getElementById("canvasWidth").value = config.canvasWidth;
  document.getElementById("canvasHeight").value = config.canvasHeight;

  // 设置画布尺寸
  canvas.width = config.canvasWidth;
  canvas.height = config.canvasHeight;
}

// 初始化六边形网格
function initHexGrid() {
  const config = getConfig();
  hexagons = []; // 清空现有的六边形
  let count = 0;

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      if (count >= 100) break;

      const x = col * (config.hexWidth * 0.75);
      const y = row * config.hexHeight + (col % 2) * (config.hexHeight / 2);

      hexagons.push({
        x: x + config.startX,
        y: y + config.startY,
        width: config.hexWidth,
        height: config.hexHeight,
        imageIndex: -1,
        row: row,
        col: col,
        id: `${row}-${col}`,
      });

      count++;
    }
  }
}

// 绘制六边形
function drawHexagon(x, y, width, height, context = ctx) {
  context.beginPath();
  context.lineWidth = 3;
  context.moveTo(x + width / 4, y);
  context.lineTo(x + (width * 3) / 4, y);
  context.lineTo(x + width, y + height / 2);
  context.lineTo(x + (width * 3) / 4, y + height);
  context.lineTo(x + width / 4, y + height);
  context.lineTo(x, y + height / 2);
  context.closePath();
}

// 预渲染六边形
function preRenderHexagon(hex) {
  if (!hex.imageData) return Promise.resolve();

  if (preRenderedHexagons.has(`${hex.row}-${hex.col}`)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = hex.width;
    tempCanvas.height = hex.height;
    const tempCtx = tempCanvas.getContext("2d", { alpha: true });
    tempCtx.clearRect(0, 0, hex.width, hex.height);

    const img = new Image();
    img.onload = () => {
      const scale = Math.max(hex.width / img.width, hex.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const imgX = (hex.width - w) / 2;
      const imgY = (hex.height - h) / 2;

      tempCtx.beginPath();
      drawHexagon(0, 0, hex.width, hex.height, tempCtx);
      tempCtx.clip();
      tempCtx.drawImage(img, imgX, imgY, w, h);

      tempCtx.strokeStyle = "#444";
      tempCtx.lineWidth = 2;
      tempCtx.beginPath();
      drawHexagon(0, 0, hex.width, hex.height, tempCtx);
      tempCtx.stroke();

      preRenderedHexagons.set(`${hex.row}-${hex.col}`, tempCanvas);
      resolve();
    };
    img.src = hex.imageData;
  });
}

// 渲染单个六边形
function renderHexagon(hex) {
  if (!hex) return;

  const preRendered = preRenderedHexagons.get(`${hex.row}-${hex.col}`);
  if (preRendered) {
    ctx.drawImage(preRendered, hex.x, hex.y);
    return;
  }

  ctx.save();
  ctx.beginPath();
  drawHexagon(hex.x, hex.y, hex.width, hex.height);
  ctx.clip();
  ctx.clearRect(hex.x, hex.y, hex.width, hex.height);
  ctx.restore();

  ctx.strokeStyle = "#444";
  drawHexagon(hex.x, hex.y, hex.width, hex.height);
  ctx.stroke();

  if (hex.imageData) {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      drawHexagon(hex.x, hex.y, hex.width, hex.height);
      ctx.clip();

      const scale = Math.max(hex.width / img.width, hex.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = hex.x + (hex.width - w) / 2;
      const y = hex.y + (hex.height - h) / 2;

      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      ctx.strokeStyle = "#444";
      drawHexagon(hex.x, hex.y, hex.width, hex.height);
      ctx.stroke();
    };
    img.src = hex.imageData;
  }
}

// 渲染整个画布
async function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  hexagons.forEach((hex) => {
    ctx.strokeStyle = "#444";
    drawHexagon(hex.x, hex.y, hex.width, hex.height);
    ctx.stroke();
  });

  const hexagonsWithImages = hexagons.filter((hex) => hex.imageData);
  const batchSize = 20;

  for (let i = 0; i < hexagonsWithImages.length; i += batchSize) {
    const batch = hexagonsWithImages.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (hex) => {
        try {
          if (!preRenderedHexagons.has(`${hex.row}-${hex.col}`)) {
            await preRenderHexagon(hex);
          }
          renderHexagon(hex);
        } catch (error) {
          console.warn("Failed to render hexagon:", error);
        }
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  updateClearButtonsVisibility();
}

// 初始化数据库
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("HexagonGalleryDB", 2);

    request.onerror = (event) => {
      console.error("数据库错误:", event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      if (!db.objectStoreNames.contains("hexagons")) {
        const hexStore = db.createObjectStore("hexagons", { keyPath: "id" });
        hexStore.createIndex("position", ["row", "col"], { unique: true });
      }

      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("数据库初始化成功");
      loadHexagonsFromDB();
      loadImagesFromDB();
      resolve();
    };
  });
}

// 从数据库加载六边形数据
function loadHexagonsFromDB() {
  const transaction = db.transaction(["hexagons"], "readonly");
  const store = transaction.objectStore("hexagons");
  const request = store.getAll();

  request.onsuccess = () => {
    const savedHexagons = request.result;
    if (savedHexagons.length > 0) {
      const hexMap = new Map(
        savedHexagons.map((hex) => [`${hex.row}-${hex.col}`, hex])
      );

      hexagons.forEach((hex) => {
        const savedHex = hexMap.get(`${hex.row}-${hex.col}`);
        if (savedHex) {
          Object.assign(hex, {
            imageData: savedHex.imageData,
            row: savedHex.row,
            col: savedHex.col,
            width: savedHex.width,
            height: savedHex.height,
            x: savedHex.x,
            y: savedHex.y,
          });
        }
      });

      const imagePromises = hexagons
        .filter((hex) => hex.imageData)
        .map(
          (hex) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.src = hex.imageData;
            })
        );

      Promise.all(imagePromises).then(() => {
        render().catch((error) => {
          console.error("Render failed:", error);
        });
      });
    }
  };
}

// 从数据库加载图片
function loadImagesFromDB() {
  const transaction = db.transaction(["images"], "readonly");
  const store = transaction.objectStore("images");
  const request = store.getAll();

  request.onsuccess = () => {
    const savedImages = request.result;
    imageList.innerHTML = "";
    images = [];

    savedImages.forEach((imageData, index) => {
      const img = new Image();
      img.src = imageData.data;
      images.push(img);

      const container = document.createElement("div");
      container.className = "image-item-container";

      const imgElement = document.createElement("img");
      imgElement.src = imageData.data;
      imgElement.className = "image-item";
      imgElement.draggable = true;
      imgElement.dataset.index = index;
      imgElement.dataset.id = imageData.id;
      imgElement.dataset.isGalleryImage = "true";

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.innerHTML = "×";
      deleteButton.onclick = () => deleteImage(imageData.id);

      container.appendChild(imgElement);
      container.appendChild(deleteButton);
      imageList.appendChild(container);
    });

    updateClearButtonsVisibility();
  };
}

// 保存六边形数据到数据库
function saveHexagonToDB(hexagon) {
  return new Promise((resolve, reject) => {
    if (!hexagon) {
      console.warn("Attempt to save null hexagon");
      resolve();
      return;
    }

    if (typeof hexagon.row !== "number" || typeof hexagon.col !== "number") {
      console.error("Invalid hexagon data:", hexagon);
      reject(new Error("Invalid hexagon data"));
      return;
    }

    const transaction = db.transaction(["hexagons"], "readwrite");
    const store = transaction.objectStore("hexagons");

    const request = store.put({
      id: `${hexagon.row}-${hexagon.col}`,
      row: hexagon.row,
      col: hexagon.col,
      imageData: hexagon.imageData,
      width: hexagon.width,
      height: hexagon.height,
      x: hexagon.x,
      y: hexagon.y,
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 保存图片到数据库
function saveImageToDB(imageData) {
  const transaction = db.transaction(["images"], "readwrite");
  const store = transaction.objectStore("images");

  store.add({ data: imageData }).onsuccess = (event) => {
    loadImagesFromDB();
  };
}

// 删除图片
function deleteImage(id) {
  const transaction = db.transaction(["images"], "readwrite");
  const store = transaction.objectStore("images");

  store.delete(id).onsuccess = () => {
    loadImagesFromDB();
  };
}

// 处理图片上传
function handleImageUpload(files) {
  Array.from(files).forEach((file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        saveImageToDB(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });
}

// 创建拖动预览画布
function createDragPreview() {
  if (!dragPreviewCanvas) {
    dragPreviewCanvas = document.createElement("canvas");
    dragPreviewCanvas.style.position = "fixed";
    dragPreviewCanvas.style.top = "-9999px";
    dragPreviewCanvas.style.left = "-9999px";
    document.body.appendChild(dragPreviewCanvas);
  }
  return dragPreviewCanvas;
}

// 导出图片
function exportImage() {
  const link = document.createElement("a");
  link.download = "result.png";
  link.href = canvas.toDataURL();
  link.click();
}

// 自定义确认对话框
function showConfirm(message) {
  return new Promise((resolve) => {
    const dialog = document.getElementById('confirmDialog');
    const messageEl = dialog.querySelector('.confirm-message');
    const confirmBtn = dialog.querySelector('.confirm-btn');
    const cancelBtn = dialog.querySelector('.cancel-btn');

    messageEl.textContent = message;
    dialog.style.display = 'flex';
    setTimeout(() => dialog.classList.add('active'), 10);

    const handleConfirm = () => {
      dialog.classList.remove('active');
      setTimeout(() => {
        dialog.style.display = 'none';
      }, 300);
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      dialog.classList.remove('active');
      setTimeout(() => {
        dialog.style.display = 'none';
      }, 300);
      cleanup();
      resolve(false);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    };

    const cleanup = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      document.removeEventListener('keydown', handleKeydown);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKeydown);
  });
}

// 修改清空画布函数
async function clearCanvas() {
  if (!hexagons.some(hex => hex.imageData)) {
    return; // 果画布是空的，直接返回
  }

  const confirmed = await showConfirm('确定要清空画布吗？这将删除所有已放置的图片。');
  if (confirmed) {
    hexagons.forEach(hex => {
      hex.imageData = null;
      preRenderedHexagons.delete(`${hex.row}-${hex.col}`);
    });

    // 清空数据库中的六边形数据
    const transaction = db.transaction(["hexagons"], "readwrite");
    const store = transaction.objectStore("hexagons");
    store.clear();

    // 直接绘制空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hexagons.forEach((hex) => {
      ctx.strokeStyle = "#444";
      drawHexagon(hex.x, hex.y, hex.width, hex.height);
      ctx.stroke();
    });

    // 更新清空按钮状态
    updateClearButtonsVisibility();
  }
}

// 修改清空图库函数
async function clearGallery() {
  if (images.length === 0) {
    return; // 如果图库是空的，直接返回
  }

  const confirmed = await showConfirm('确定要清空图库吗？这将删除所有上传的图片。');
  if (confirmed) {
    // 清空数据库中的图片数据
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");
    store.clear().onsuccess = () => {
      // 清空内存中的图片数组和图片表
      images = [];
      imageList.innerHTML = '';
      updateClearButtonsVisibility();
    };
  }
}

// 修改自动铺设图片函数
async function autoFillImages() {
  if (images.length === 0) {
    alert("请先上传图片");
    return;
  }

  const confirmed = await showConfirm("这将覆盖当前的布局，是否继续？");
  if (confirmed) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    preRenderedHexagons.clear();

    hexagons.forEach((hex) => {
      hex.imageData = null;
      preRenderedHexagons.delete(`${hex.row}-${hex.col}`);

      ctx.strokeStyle = "#444";
      drawHexagon(hex.x, hex.y, hex.width, hex.height);
      ctx.stroke();
    });

    let imageIndices = Array.from({ length: images.length }, (_, i) => i);
    for (let i = imageIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [imageIndices[i], imageIndices[j]] = [imageIndices[j], imageIndices[i]];
    }
    let currentImageIndex = 0;

    const batchSize = 10;
    for (
      let i = 0;
      i < hexagons.length && currentImageIndex < imageIndices.length;
      i += batchSize
    ) {
      const batch = hexagons.slice(i, Math.min(i + batchSize, hexagons.length));
      await Promise.all(
        batch.map(async (hex) => {
          if (currentImageIndex < imageIndices.length) {
            const img = images[imageIndices[currentImageIndex++]];
            const canvas = document.createElement("canvas");
            const tempCtx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);
            hex.imageData = canvas.toDataURL();

            try {
              await saveHexagonToDB(hex);
              preRenderedHexagons.delete(`${hex.row}-${hex.col}`);
              await preRenderHexagon(hex);
              renderHexagon(hex);
            } catch (error) {
              console.warn("Failed to save/render hexagon:", error);
            }
          }
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    if (currentImageIndex >= imageIndices.length) {
      for (let i = currentImageIndex; i < hexagons.length; i += batchSize) {
        const batch = hexagons.slice(
          i,
          Math.min(i + batchSize, hexagons.length)
        );
        await Promise.all(
          batch.map(async (hex, index) => {
            const imgIndex = imageIndices[index % imageIndices.length];
            const img = images[imgIndex];
            const canvas = document.createElement("canvas");
            const tempCtx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);
            hex.imageData = canvas.toDataURL();

            try {
              await saveHexagonToDB(hex);
              preRenderedHexagons.delete(`${hex.row}-${hex.col}`);
              await preRenderHexagon(hex);
              renderHexagon(hex);
            } catch (error) {
              console.warn("Failed to save/render hexagon:", error);
            }
          })
        );
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }
}

// 事件监听器设置
imageUpload.addEventListener("change", (e) => {
  handleImageUpload(e.target.files);
});

imageList.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("image-item")) {
    e.dataTransfer.setData("text/plain", e.target.dataset.index);
    e.dataTransfer.setData("application/x-gallery-image", "true");
  }
});

canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
});

canvas.addEventListener("dragstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  const scale = Math.min(scaleX, scaleY);

  hexagons.forEach((hex) => {
    ctx.beginPath();
    drawHexagon(hex.x, hex.y, hex.width, hex.height);
    if (ctx.isPointInPath(x, y) && hex.imageData) {
      draggedImageHex = { ...hex };
      e.dataTransfer.setData("text/plain", "canvas-image");

      const preRendered = preRenderedHexagons.get(`${hex.row}-${hex.col}`);
      if (preRendered) {
        const previewCanvas = createDragPreview();
        previewCanvas.width = hex.width * scale;
        previewCanvas.height = hex.height * scale;
        const previewCtx = previewCanvas.getContext("2d");

        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        previewCtx.drawImage(
          preRendered,
          0,
          0,
          preRendered.width,
          preRendered.height,
          0,
          0,
          previewCanvas.width,
          previewCanvas.height
        );

        e.dataTransfer.setDragImage(
          previewCanvas,
          previewCanvas.width / 2,
          previewCanvas.height / 2
        );
      }
    }
  });
});

canvas.addEventListener("drop", async (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  let imageData;
  const dataType = e.dataTransfer.getData("text/plain");

  if (dataType === "canvas-image" && draggedImageHex) {
    imageData = draggedImageHex.imageData;
  } else if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith("image/")) {
      imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }
  } else if (dataType && images[parseInt(dataType)]) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = images[parseInt(dataType)];
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    imageData = canvas.toDataURL();
  }

  if (imageData) {
    hexagons.forEach((targetHex) => {
      ctx.beginPath();
      drawHexagon(targetHex.x, targetHex.y, targetHex.width, targetHex.height);
      if (ctx.isPointInPath(x, y)) {
        if (draggedImageHex) {
          const tempImageData = targetHex.imageData;
          const tempHex = { ...targetHex };

          targetHex.imageData = draggedImageHex.imageData;

          const originalHex = hexagons.find(
            (h) => h.row === draggedImageHex.row && h.col === draggedImageHex.col
          );
          if (originalHex) {
            originalHex.imageData = tempImageData;
          }

          preRenderedHexagons.delete(`${targetHex.row}-${targetHex.col}`);
          if (originalHex) {
            preRenderedHexagons.delete(`${originalHex.row}-${originalHex.col}`);
          }

          Promise.all([
            preRenderHexagon(targetHex),
            originalHex ? preRenderHexagon(originalHex) : Promise.resolve(),
          ]).then(() => {
            Promise.all([
              saveHexagonToDB(targetHex),
              originalHex ? saveHexagonToDB(originalHex) : Promise.resolve(),
            ]).then(() => {
              renderHexagon(targetHex);
              if (originalHex) {
                renderHexagon(originalHex);
              }
              draggedImageHex = null;
              updateClearButtonsVisibility();
            });
          });
        } else {
          preRenderedHexagons.delete(`${targetHex.row}-${targetHex.col}`);

          targetHex.imageData = imageData;
          preRenderHexagon(targetHex).then(() => {
            saveHexagonToDB(targetHex).then(() => {
              renderHexagon(targetHex);
              updateClearButtonsVisibility();
            });
          });
        }
      }
    });
  }
});

canvas.addEventListener("dragend", () => {
  if (!draggedImageHex) return;

  const originalHex = hexagons.find(
    (h) => h.row === draggedImageHex.row && h.col === draggedImageHex.col
  );
  if (originalHex) {
    renderHexagon(originalHex);
  }
  draggedImageHex = null;
});

imageList.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (e.dataTransfer.types.includes('Files') &&
    !e.dataTransfer.types.includes('application/x-gallery-image')) {
    imageList.classList.add("dragover");
  }
});

imageList.addEventListener("dragleave", () => {
  imageList.classList.remove("dragover");
});

imageList.addEventListener("drop", (e) => {
  e.preventDefault();
  imageList.classList.remove("dragover");
  if (e.dataTransfer.types.includes('Files') &&
    !e.dataTransfer.types.includes('application/x-gallery-image')) {
    handleImageUpload(e.dataTransfer.files);
  }
});

canvas.setAttribute("draggable", "true");

// 主题切换功能
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  themeIcon.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// 加载保存的主题
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light'; // 默认为浅色主题
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeIcon.textContent = '🌙';
  } else {
    document.body.classList.remove('dark-theme');
    themeIcon.textContent = '☀️';
  }
}

// 配置区域折叠功能
const configHeader = document.getElementById('configHeader');
const configContent = document.getElementById('configContent');
const toggleBtn = configHeader.querySelector('.toggle-btn');

function toggleConfig() {
  const isExpanded = configContent.style.display !== 'none';
  configContent.style.display = isExpanded ? 'none' : 'block';
  toggleBtn.classList.toggle('expanded', !isExpanded);
}

// 初始化配置区域的折叠状态
function initConfigState() {
  const isExpanded = configContent.style.display !== 'none';
  toggleBtn.classList.toggle('expanded', isExpanded);
}

// 事件监听
themeToggle.addEventListener('click', toggleTheme);
configHeader.addEventListener('click', (e) => {
  // 确保点击导出或清空按钮时不会触发折叠
  if (!e.target.classList.contains('export-btn') && !e.target.classList.contains('danger-btn')) {
    toggleConfig();
  }
});

// 检测设备��型
function isMobileDevice() {
  return (window.innerWidth <= 768) ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 处理设备检测
function handleDeviceCheck() {
  const isMobile = isMobileDevice();
  document.querySelector('.mobile-notice').style.display = isMobile ? 'block' : 'none';
  document.querySelector('.container').style.display = isMobile ? 'none' : 'flex';
}

// 监听窗口大小改变
window.addEventListener('resize', handleDeviceCheck);

// 初始化
window.onload = async function () {
  // 设备检测
  handleDeviceCheck();
  if (isMobileDevice()) {
    return;
  }

  // 主题初始化
  loadTheme();

  // 配置初始化
  loadConfigToForm();
  addConfigListeners();
  initHexGrid();
  initConfigState();

  try {
    await initDB();
    await render();
  } catch (error) {
    console.error("初始化失败:", error);
  }
};

// 更新清空按钮的可见性
function updateClearButtonsVisibility() {
  const clearCanvasBtn = document.getElementById('clearCanvasBtn');
  const clearGalleryBtn = document.getElementById('clearGalleryBtn');

  // 检查画布是否有图片
  const hasCanvasImages = hexagons.some(hex => hex.imageData);
  clearCanvasBtn.classList.toggle('hidden', !hasCanvasImages);

  // 检查图库是否有图片
  const hasGalleryImages = images.length > 0;
  clearGalleryBtn.classList.toggle('hidden', !hasGalleryImages);
}

// 修改loadImagesFromDB函数，添加按钮可见性更新
const originalLoadImagesFromDB = loadImagesFromDB;
loadImagesFromDB = function () {
  originalLoadImagesFromDB();
  updateClearButtonsVisibility();
};

// 修改render函数，添加按钮可见性更新
const originalRender = render;
render = async function () {
  await originalRender();
  updateClearButtonsVisibility();
};

// 复制链接功能
async function copyLink() {
  const link = 'https://hex.shatranj.space/';
  try {
    await navigator.clipboard.writeText(link);
    const button = document.querySelector('.notice-button');
    button.textContent = '已复制';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = '复制访问链接';
      button.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('复制失败:', err);
  }
}

// 检测设备类型
// ... existing code ... 
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');

// HTML渲染器 - 服务器端动态注入捕获代码
class HTMLRenderer {
    constructor() {
        this.canvas = createCanvas(296, 152);
        this.ctx = this.canvas.getContext('2d');
    }

    // 生成预览页面HTML，使用iframe方式
    generatePreviewPage(projectName) {
        const projectPath = path.join(__dirname, 'weights', projectName);
        const indexPath = path.join(projectPath, 'dist', 'index.html');

        if (!fs.existsSync(indexPath)) {
            return null;
        }

        // 创建预览页面
        const previewHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - 预览</title>
    <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #f0f0f0;
        }
        .preview-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 80vh;
            flex-direction: column;
            gap: 20px;
        }
        
        .header-actions {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .back-btn {
            background: #6c757d;
        }
        
        .back-btn:hover {
            background: #5a6268;
        }
        .iframe-container {
            border: 2px solid #667eea;
            width: 296px;
            height: 152px;
            overflow: hidden;
            background: white;
            transition: width 0.3s ease, height 0.3s ease;
        }
        .iframe-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        .controls {
            text-align: center;
        }
        .capture-options {
            margin-bottom: 15px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        .capture-options h4 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
        }
        .option-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            margin-bottom: 10px;
        }
        .capture-options label {
            display: inline-block;
            margin: 0;
            font-weight: 500;
            color: #555;
            font-size: 14px;
            white-space: nowrap;
        }
        .select-option {
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            background: white;
            cursor: pointer;
            min-width: 120px;
        }
        .select-option:focus {
            outline: none;
            border-color: #667eea;
        }
        .number-input {
            padding: 6px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            width: 60px;
            text-align: center;
        }
        .number-input:focus {
            outline: none;
            border-color: #667eea;
        }
        .button-group {
            margin-bottom: 15px;
        }
        .btn {
            padding: 10px 20px;
            margin: 5px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .btn:hover {
            background: #5a6fd8;
        }
        .btn-original {
            background: #28a745;
        }
        .btn-original:hover {
            background: #218838;
        }
        .status {
            margin-top: 10px;
            padding: 10px;
            border-radius: 5px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
        }
        .preview-image {
            max-width: 296px;
            max-height: 152px;
            border: 2px solid #28a745;
            margin: 10px 0;
        }
        .capture-canvas {
            display: none;
        }
        .image-comparison {
            display: flex;
            gap: 20px;
            justify-content: flex-start;
            flex-wrap: wrap;
        }
        .image-preview {
            text-align: left;
        }
        .image-preview h4 {
            margin: 5px 0;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="iframe-container">
            <iframe id="projectFrame" src="/api/project-iframe/${projectName}"></iframe>
        </div>
        
        <div class="controls">
            <div class="capture-options">
                <h4>图像处理选项</h4>
                <div class="option-row">
                    <label>调色板：</label>
                    <select id="paletteSelect" class="select-option">
                        <option value="default">默认</option>
                        <option value="spectra6">Spectra 6</option>
                        <option value="acep">Gallery (ACEP)</option>
                        <option value="grayscale" selected>灰度</option>
                    </select>
                    
                    <label>设备颜色：</label>
                    <select id="deviceColorsSelect" class="select-option">
                        <option value="default">默认</option>
                        <option value="spectra6">Spectra 6</option>
                        <option value="acep" selected>ACEP</option>
                    </select>
                </div>
                
                <div class="option-row">
                    <label>抖动类型：</label>
                    <select id="ditheringType" class="select-option">
                        <option value="errorDiffusion">误差扩散</option>
                        <option value="ordered" selected>有序抖动</option>
                        <option value="random">随机抖动</option>
                        <option value="quantizationOnly">仅量化</option>
                    </select>
                    
                    <label>误差扩散矩阵：</label>
                    <select id="errorDiffusionMatrix" class="select-option">
                        <option value="floydSteinberg" selected>Floyd-Steinberg</option>
                        <option value="atkinson">Atkinson</option>
                        <option value="falseFloydSteinberg">False Floyd-Steinberg</option>
                        <option value="jarvis">Jarvis</option>
                        <option value="stucki">Stucki</option>
                        <option value="burkes">Burkes</option>
                        <option value="sierra3">Sierra-3</option>
                        <option value="sierra2">Sierra-2</option>
                        <option value="Sierra2-4A">Sierra-2-4A</option>
                    </select>
                </div>
                
                <div class="option-row">
                    <label>有序矩阵宽度：</label>
                    <input type="number" id="orderedMatrixW" value="4" min="1" max="8" class="number-input">
                    <label>高度：</label>
                    <input type="number" id="orderedMatrixH" value="4" min="1" max="8" class="number-input">
                    
                    <label>随机抖动类型：</label>
                    <select id="randomDitheringType" class="select-option">
                        <option value="blackAndWhite" selected>黑白</option>
                        <option value="rgb">RGB</option>
                    </select>
                </div>
                
                <div class="option-row">
                    <label><input type="checkbox" id="serpentine" checked> 蛇形扫描</label>
                    
                    <label>截图缩放：</label>
                    <select id="scaleFactor" class="select-option">
                        <option value="1">1x (原始尺寸)</option>
                        <option value="2" selected>2x (推荐)</option>
                        <option value="3">3x (高清晰度)</option>
                        <option value="4">4x (超高清晰度)</option>
                    </select>
                </div>
            </div>
            
            <div class="button-group">
                <button class="btn" onclick="captureAndPreview()">📸 捕获预览</button>
                <button class="btn" onclick="processAndDisplay()">🔄 处理并显示</button>
                <button class="btn" onclick="sendToDevice()">📱 发送到设备</button>
                <button class="btn btn-original" onclick="sendOriginalToDevice()">📱 发送原始图像</button>
                <a href="/codepen_gallery.html" class="btn back-btn">← 返回主页</a>
            </div>
            <div class="status" id="status">等待iframe加载完成...</div>
        </div>
        
        <div id="imagePreview" style="display: none; width: 100%; text-align: left; align-self: flex-start;">
            <h3 style="text-align: left; margin-left: 0;">图像预览：</h3>
            <div class="image-comparison">
                <div class="image-preview">
                    <h4>原始图像</h4>
                    <img id="originalImg" class="preview-image" alt="原始图像">
                </div>
                <div class="image-preview">
                    <h4>灰度图像（墨水屏）</h4>
                    <img id="grayscaleImg" class="preview-image" alt="灰度图像">
                </div>
            </div>
        </div>
        
        <!-- 隐藏的canvas用于捕获 -->
        <canvas id="captureCanvas" class="capture-canvas"></canvas>
        <canvas id="grayscaleCanvas" class="capture-canvas"></canvas>
    </div>

    <script>
        let capturedImageData = null;
        let grayscaleImageData = null;
        let iframeLoaded = false;
        
        // 基础尺寸（墨水屏尺寸）
        const baseWidth = 296;
        const baseHeight = 152;
        
        // 更新iframe容器大小
        function updateIframeSize() {
            const scaleFactor = parseInt(document.getElementById('scaleFactor').value);
            const iframeContainer = document.querySelector('.iframe-container');
            
            // 根据截图缩放选项调整显示大小
            const newWidth = baseWidth * scaleFactor;
            const newHeight = baseHeight * scaleFactor;
            
            iframeContainer.style.width = newWidth + 'px';
            iframeContainer.style.height = newHeight + 'px';
        }
        
        // 防抖定时器
        let autoProcessTimer = null;
        
        // 自动处理图像（当选项变化时）
        function autoProcessImage() {
            if (capturedImageData) {
                // 清除之前的定时器
                if (autoProcessTimer) {
                    clearTimeout(autoProcessTimer);
                }
                
                // 设置新的定时器，延迟500ms执行
                autoProcessTimer = setTimeout(() => {
                    console.log('选项变化，自动处理图像...');
                    processAndDisplay(true); // true表示自动处理
                }, 500);
            }
        }
        
        // 监听缩放因子变化
        document.getElementById('scaleFactor').addEventListener('change', updateIframeSize);
        
        // 监听图像处理选项变化
        document.getElementById('paletteSelect').addEventListener('change', autoProcessImage);
        document.getElementById('deviceColorsSelect').addEventListener('change', autoProcessImage);
        document.getElementById('ditheringType').addEventListener('change', autoProcessImage);
        document.getElementById('errorDiffusionMatrix').addEventListener('change', autoProcessImage);
        document.getElementById('orderedMatrixW').addEventListener('change', autoProcessImage);
        document.getElementById('orderedMatrixH').addEventListener('change', autoProcessImage);
        document.getElementById('randomDitheringType').addEventListener('change', autoProcessImage);
        document.getElementById('serpentine').addEventListener('change', autoProcessImage);
        
        // 监听iframe加载完成
        document.getElementById('projectFrame').onload = function() {
            iframeLoaded = true;
            document.getElementById('status').textContent = '✅ iframe加载完成，可以开始捕获';
            // 初始化iframe大小
            updateIframeSize();
        };
        
        // 转换为灰度图像
        function convertToGrayscale(canvas) {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                // 使用加权平均法转换为灰度
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                
                // 二值化处理，适合墨水屏
                const threshold = 128;
                const binary = gray > threshold ? 255 : 0;
                
                data[i] = binary;     // R
                data[i + 1] = binary; // G
                data[i + 2] = binary; // B
                // data[i + 3] 保持透明度不变
            }
            
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }
        
        // 捕获并预览
        async function captureAndPreview() {
            const status = document.getElementById('status');
            status.textContent = '🔄 正在使用服务器端截图...';
            
            let retryCount = 0;
            const maxRetries = 2;
            
            while (retryCount <= maxRetries) {
                try {
                    // 获取缩放因子
                    const scaleFactor = parseInt(document.getElementById('scaleFactor').value);
                    
                    // 获取原始图像（不进行任何处理）
                    const originalResponse = await fetch('/api/screenshot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            projectName: '${projectName}',
                            imageProcessing: 'original',
                            scaleFactor: scaleFactor
                        })
                    });

                    const originalData = await originalResponse.json();
                    
                    if (!originalResponse.ok) {
                        // 如果服务器建议重试，则重试
                        if (originalData.retry && retryCount < maxRetries) {
                            retryCount++;
                            status.textContent = '🔄 截图失败，正在重试 (' + retryCount + '/' + maxRetries + ')...';
                            await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒后重试
                            continue;
                        }
                        throw new Error(originalData.message || '原始图像截图失败');
                    }

                    // 设置原始图像数据
                    capturedImageData = originalData.imageData;
                    grayscaleImageData = originalData.imageData; // 初始时灰度图像也使用原始图像
                    
                    // 显示预览
                    const originalImg = document.getElementById('originalImg');
                    const grayscaleImg = document.getElementById('grayscaleImg');
                    const imagePreview = document.getElementById('imagePreview');
                    
                    // 原始图像始终显示最原始的状态
                    originalImg.src = 'data:image/png;base64,' + capturedImageData;
                    // 灰度图像初始显示原始图像
                    grayscaleImg.src = 'data:image/png;base64,' + grayscaleImageData;
                    
                    imagePreview.style.display = 'block';
                    
                    status.textContent = '✅ 服务器端截图成功！原始图像已准备好，请使用"处理并显示"按钮应用抖动效果';
                    
                    console.log('图像数据已设置:', {
                        capturedImageData: capturedImageData ? capturedImageData.substring(0, 50) + '...' : 'null',
                        grayscaleImageData: grayscaleImageData ? grayscaleImageData.substring(0, 50) + '...' : 'null'
                    });
                    
                    break; // 成功，跳出重试循环
                    
                } catch (error) {
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        console.error('截图失败(尝试 ' + retryCount + ' / ' + maxRetries + '): ', error);
                        status.textContent = '🔄 截图失败，正在重试(' + retryCount + ' / ' + maxRetries + ')...';
                        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒后重试
                    } else {
                        console.error('截图失败:', error);
                        status.textContent = '❌ 截图失败: ' + error.message;
                    }
                }
            }
        }
        
        // 处理并显示功能：发送原始图像到服务器，显示处理后的灰度图像
        async function processAndDisplay(isAutoProcess = false) {
            const status = document.getElementById('status');
            
            if (!capturedImageData) {
                status.textContent = '⚠️ 请先捕获原始图像';
                return;
            }
            
            status.textContent = isAutoProcess ? '🔄 选项变化，正在自动处理图像...' : '🔄 正在处理图像...';
            
            try {
                // 获取所有处理选项
                const processingOptions = {
                    palette: document.getElementById('paletteSelect').value,
                    deviceColors: document.getElementById('deviceColorsSelect').value,
                    ditheringType: document.getElementById('ditheringType').value,
                    errorDiffusionMatrix: document.getElementById('errorDiffusionMatrix').value,
                    orderedMatrixW: parseInt(document.getElementById('orderedMatrixW').value),
                    orderedMatrixH: parseInt(document.getElementById('orderedMatrixH').value),
                    randomDitheringType: document.getElementById('randomDitheringType').value,
                    serpentine: document.getElementById('serpentine').checked
                };
                
                // 发送原始图像到服务器进行处理
                const response = await fetch('/api/process-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        projectName: '${projectName}',
                        originalImageData: capturedImageData,
                        processingOptions: processingOptions
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || '图像处理失败');
                }
                
                // 检查是否有错误信息但请求成功
                if (data.error) {
                    console.warn('图像处理警告:', data.error);
                    status.textContent = '⚠️ 图像处理警告: ' + data.error + '，使用原始图像';
                }

                // 更新灰度图像数据
                grayscaleImageData = data.processedImageData;
                
                // 更新显示
                const grayscaleImg = document.getElementById('grayscaleImg');
                grayscaleImg.src = 'data:image/png;base64,' + grayscaleImageData;
                
                status.textContent = isAutoProcess ? '✅ 自动处理完成！已应用新选项' : '✅ 图像处理成功！已应用自定义抖动效果';
                
                console.log('图像处理完成:', {
                    originalImageData: capturedImageData ? capturedImageData.substring(0, 50) + '...' : 'null',
                    processedImageData: grayscaleImageData ? grayscaleImageData.substring(0, 50) + '...' : 'null',
                    options: processingOptions
                });
                
            } catch (error) {
                console.error('图像处理失败:', error);
                status.textContent = '❌ 图像处理失败: ' + error.message;
            }
        }
        
        // 发送到设备
        async function sendToDevice() {
            const status = document.getElementById('status');
            
            if (!grayscaleImageData) {
                status.textContent = '⚠️ 请先捕获预览图像';
                return;
            }
            
            status.textContent = '📤 正在发送灰度图像到墨水屏设备...';
            
            try {
                const response = await fetch('/api/send-to-device', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        projectName: '${projectName}',
                        deviceId: '9C9E6E3B70F4',
                        imageData: grayscaleImageData
                    })
                });

                const data = await response.json();
                
                if (response.ok) {
                    status.textContent = '✅ 发送成功: ' + (data.message || '灰度图像已发送到墨水屏设备');
                } else {
                    status.textContent = '❌ 发送失败: ' + (data.message || '未知错误');
                }
                
            } catch (error) {
                console.error('发送失败:', error);
                status.textContent = '❌ 发送失败: ' + error.message;
            }
        }
        
        // 发送原始图像到设备
        async function sendOriginalToDevice() {
            const status = document.getElementById('status');
            
            if (!capturedImageData) {
                status.textContent = '⚠️ 请先捕获原始图像';
                return;
            }
            
            status.textContent = '📤 正在发送原始图像到墨水屏设备...';
            
            try {
                const response = await fetch('/api/send-to-device', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        projectName: '${projectName}',
                        deviceId: '9C9E6E3B70F4',
                        imageData: capturedImageData
                    })
                });

                const data = await response.json();
                
                if (response.ok) {
                    status.textContent = '✅ 发送成功: ' + (data.message || '原始图像已发送到墨水屏设备');
                } else {
                    status.textContent = '❌ 发送失败: ' + (data.message || '未知错误');
                }
                
            } catch (error) {
                console.error('发送失败:', error);
                status.textContent = '❌ 发送失败: ' + error.message;
            }
        }
    </script>
</body>
</html>`;

        return previewHTML;
    }



    // 生成iframe HTML（修改相对路径）
    generateIframeHTML(projectName) {
        const projectPath = path.join(__dirname, 'weights', projectName);
        const indexPath = path.join(projectPath, 'dist', 'index.html');

        if (!fs.existsSync(indexPath)) {
            return null;
        }

        try {
            // 读取原始HTML内容
            let originalHTML = fs.readFileSync(indexPath, 'utf8');

            // 使用JSDOM解析HTML
            const dom = new JSDOM(originalHTML);
            const document = dom.window.document;

            // 修改CSS文件路径
            const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
            for (const link of linkElements) {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('//')) {
                    // 修改相对路径为绝对路径（现在文件在dist目录下）
                    link.setAttribute('href', `/api/project-iframe/${projectName}/${href}`);
                }
            }

            // 修改JS文件路径
            const scriptElements = document.querySelectorAll('script[src]');
            for (const script of scriptElements) {
                const src = script.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('//')) {
                    // 修改相对路径为绝对路径（现在文件在dist目录下）
                    script.setAttribute('src', `/api/project-iframe/${projectName}/${src}`);
                }
            }

            // 返回处理后的HTML
            return dom.serialize();

        } catch (error) {
            console.error('处理iframe HTML失败:', error);
            return null;
        }
    }

    // 向DOM注入捕获代码
    injectCaptureCodeToDOM(document) {
        // 注入html2canvas库
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
        document.head.appendChild(html2canvasScript);

        // 注入捕获函数
        const captureScript = document.createElement('script');
        captureScript.textContent = `
// 暴露捕获函数给父窗口
window.getBase64Data = function() {
    return new Promise((resolve, reject) => {
        try {
            // 等待页面完全渲染
            setTimeout(() => {
                html2canvas(document.body, {
                    width: 296,
                    height: 152,
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                }).then(canvas => {
                    const base64 = canvas.toDataURL('image/png').split(',')[1];
                    resolve(base64);
                }).catch(reject);
            }, 500);
        } catch (error) {
            reject(error);
        }
    });
};

// 通知父窗口内容已加载完成
if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'projectLoaded' }, '*');
}
`;
        document.body.appendChild(captureScript);
    }



    // 转义HTML内容
    escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    // 处理发送到设备的请求（接收客户端传来的图像数据）
    handleSendToDevice(projectName, imageData) {
        try {
            // 验证图像数据
            if (!imageData || typeof imageData !== 'string') {
                throw new Error('无效的图像数据');
            }

            // 返回Base64数据供服务器发送到Dot API
            return imageData;

        } catch (error) {
            console.error('处理图像数据失败:', error);
            return null;
        }
    }

    // 获取Base64数据（保留用于兼容性）
    getBase64Data() {
        return this.canvas.toDataURL('image/png').split(',')[1];
    }
}

module.exports = HTMLRenderer; 
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const HTMLRenderer = require('./html_renderer');
const ScreenshotService = require('./screenshot_service');

// 初始化截图服务
const screenshotService = new ScreenshotService();

const PORT = 3001;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// 获取项目列表
function getProjectsList() {
    const weightsPath = path.join(__dirname, 'weights');
    const projects = [];

    try {
        if (!fs.existsSync(weightsPath)) {
            return projects;
        }

        const folders = fs.readdirSync(weightsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const folder of folders) {
            const projectPath = path.join(weightsPath, folder);
            const indexPath = path.join(projectPath, 'dist', 'index.html');

            if (fs.existsSync(indexPath)) {
                projects.push({
                    name: folder,
                    path: projectPath,
                    description: getProjectDescription(projectPath)
                });
            }
        }
    } catch (error) {
        console.error('读取项目列表失败:', error);
    }

    return projects;
}

// 获取项目描述
function getProjectDescription(projectPath) {
    try {
        const readmePath = path.join(projectPath, 'README.md');
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf8');
            return content.split('\n')[0].replace('#', '').trim();
        }
    } catch (error) {
        console.error('读取项目描述失败:', error);
    }
    return '';
}





// 处理静态文件
function serveStaticFile(req, res, filePath) {
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - 文件未找到</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`服务器错误: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
}

// 创建服务器
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // 处理CORS预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.writeHead(200);
        res.end();
        return;
    }

    // 处理项目列表API
    if (pathname === '/api/projects' && req.method === 'GET') {
        const projects = getProjectsList();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(projects));
        return;
    }

    // 处理发送到设备API
    if (pathname === '/api/send-to-device' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const requestData = JSON.parse(body);
                const { projectName, deviceId, imageData, apiConfig } = requestData;

                // 使用HTML渲染器处理图像数据
                const renderer = new HTMLRenderer();
                const base64Data = renderer.handleSendToDevice(projectName, imageData);

                if (!base64Data) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(400);
                    res.end(JSON.stringify({
                        error: '处理图像数据失败',
                        message: '无法处理客户端传来的图像数据'
                    }));
                    return;
                }

                // 构建Dot API配置
                const dotApiConfig = {
                    hostname: apiConfig.apiHost,
                    path: apiConfig.apiPath,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiConfig.apiToken}`
                    }
                };

                // 发送到Dot API
                const dotRequestData = {
                    deviceId: deviceId,
                    image: base64Data
                };

                const dotRequest = https.request(dotApiConfig, (dotResponse) => {
                    let responseData = '';

                    dotResponse.on('data', chunk => {
                        responseData += chunk;
                    });

                    dotResponse.on('end', () => {
                        console.log('📥 收到Dot API响应:', dotResponse.statusCode);

                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(dotResponse.statusCode);
                        res.end(responseData);
                    });
                });

                dotRequest.on('error', (error) => {
                    console.error('❌ Dot API请求错误:', error.message);
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(500);
                    res.end(JSON.stringify({
                        error: '发送到设备失败',
                        message: error.message
                    }));
                });

                dotRequest.write(JSON.stringify(dotRequestData));
                dotRequest.end();

            } catch (error) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(JSON.stringify({
                    error: '请求数据格式错误',
                    message: error.message
                }));
            }
        });
        return;
    }

    // 处理图像处理API（接收原始图像，返回处理后的图像）
    if (pathname === '/api/process-image' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);
                const { projectName, originalImageData, processingOptions = {} } = requestData;

                if (!originalImageData) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(400);
                    res.end(JSON.stringify({
                        error: '缺少原始图像数据',
                        message: '请提供originalImageData参数'
                    }));
                    return;
                }

                console.log(`🔄 开始处理项目 ${projectName} 的图像...`, processingOptions);

                // 将Base64图像数据转换为Buffer
                const imageBuffer = Buffer.from(originalImageData, 'base64');

                // 使用自定义选项处理图像
                const processedBuffer = await screenshotService.processWithCustomOptions(imageBuffer, processingOptions);

                // 转换为Base64
                const processedBase64Data = processedBuffer.toString('base64');

                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    processedImageData: processedBase64Data,
                    message: '图像处理成功',
                    processing: 'custom'
                }));

            } catch (error) {
                console.error('图像处理失败:', error);
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    processedImageData: originalImageData, // 返回原始图像
                    message: '图像处理失败，返回原始图像',
                    error: error.message
                }));
            }
        });
        return;
    }

    // 处理服务器端截图API
    if (pathname === '/api/screenshot' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);
                const { projectName, imageProcessing = 'eink' } = requestData;

                if (!projectName) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(400);
                    res.end(JSON.stringify({
                        error: '缺少项目名称',
                        message: '请提供projectName参数'
                    }));
                    return;
                }

                console.log(`📸 开始截取项目 ${projectName} 的截图...`);

                // 获取缩放因子（可选，默认为2倍）
                const scaleFactor = requestData.scaleFactor || 2;
                console.log(`🔍 使用缩放因子: ${scaleFactor}x`);

                // 使用Puppeteer截取项目截图
                const screenshotBuffer = await screenshotService.captureProject(projectName, 'http://localhost:3001', scaleFactor);

                let processedBuffer = screenshotBuffer;

                // 根据需求进行图像处理
                switch (imageProcessing) {
                    case 'grayscale':
                        processedBuffer = await screenshotService.convertToGrayscale(screenshotBuffer);
                        break;
                    case 'eink':
                        processedBuffer = await screenshotService.convertToEInkDisplay(screenshotBuffer, {
                            ditheringType: 'errorDiffusion',
                            errorDiffusionMatrix: 'floydSteinberg',
                            serpentine: true
                        });
                        break;
                    case 'advanced':
                        processedBuffer = await screenshotService.convertToAdvancedEInk(screenshotBuffer, {
                            ditheringType: 'errorDiffusion',
                            errorDiffusionMatrix: 'floydSteinberg',
                            serpentine: true
                        });
                        break;
                    default:
                        // 不处理，保持原图
                        break;
                }

                // 转换为Base64
                const base64Data = processedBuffer.toString('base64');

                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    imageData: base64Data,
                    message: '截图成功',
                    processing: imageProcessing
                }));

            } catch (error) {
                console.error('截图失败:', error);

                // 尝试重新初始化截图服务
                try {
                    console.log('🔄 尝试重新初始化截图服务...');
                    await screenshotService.close();
                    await screenshotService.initialize();
                    console.log('✅ 截图服务重新初始化成功');
                } catch (initError) {
                    console.error('❌ 重新初始化截图服务失败:', initError);
                }

                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(500);
                res.end(JSON.stringify({
                    error: '截图失败',
                    message: error.message,
                    retry: true
                }));
            }
        });
        return;
    }

    // 处理项目预览
    if (pathname.startsWith('/preview/') && req.method === 'GET') {
        const projectName = pathname.replace('/preview/', '');

        // 使用HTML渲染器生成预览页面
        const renderer = new HTMLRenderer();
        const previewHTML = renderer.generatePreviewPage(projectName);

        if (!previewHTML) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - 项目未找到</h1>', 'utf-8');
            return;
        }

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(previewHTML);
        return;
    }



    // 处理项目iframe API（返回修改后的HTML，用于iframe显示）
    if (pathname.startsWith('/api/project-iframe/') && req.method === 'GET') {
        const urlParts = pathname.split('/');
        const projectName = urlParts[3]; // /api/project-iframe/clock -> clock

        if (!projectName) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(404);
            res.end(JSON.stringify({
                error: '项目未找到',
                message: '项目名称不能为空'
            }));
            return;
        }

        // 检查是否是请求项目内的文件
        if (urlParts.length > 4) {
            // 例如：/api/project-iframe/clock/style.css
            const fileName = urlParts.slice(4).join('/');
            const projectPath = path.join(__dirname, 'weights', projectName);
            const filePath = path.join(projectPath, 'dist', fileName);

            if (fs.existsSync(filePath)) {
                serveStaticFile(req, res, filePath);
                return;
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - 文件未找到</h1>', 'utf-8');
                return;
            }
        }

        // 如果是请求项目主页，返回修改后的HTML
        const renderer = new HTMLRenderer();
        const iframeHTML = renderer.generateIframeHTML(projectName);

        if (!iframeHTML) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(404);
            res.end(JSON.stringify({
                error: '项目未找到',
                message: `项目 ${projectName} 不存在或无法加载`
            }));
            return;
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(iframeHTML);
        return;
    }



    // 处理项目静态文件（相对路径映射）
    if (pathname.startsWith('/weights/')) {
        const filePath = path.join(__dirname, pathname);
        serveStaticFile(req, res, filePath);
        return;
    }







    // 处理静态文件
    let filePath = '.' + pathname;
    if (filePath === './') {
        filePath = './codepen_gallery.html';
    }

    // 处理favicon.ico请求
    if (pathname === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    serveStaticFile(req, res, filePath);
});

// 添加全局错误处理器
process.on('uncaughtException', (error) => {
    console.error('🚨 未捕获的异常:', error);
    console.log('🔄 服务器继续运行...');

    // 如果是截图服务相关错误，尝试重新初始化
    if (error.message && (error.message.includes('Connection closed') || error.message.includes('Protocol error'))) {
        console.log('🔄 检测到截图服务错误，尝试重新初始化...');
        screenshotService.close().catch(closeError => {
            console.error('关闭截图服务失败:', closeError);
        });
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 未处理的Promise拒绝:', reason);
    console.log('🔄 服务器继续运行...');

    // 如果是截图服务相关错误，尝试重新初始化
    if (reason && reason.message && (reason.message.includes('Connection closed') || reason.message.includes('Protocol error'))) {
        console.log('🔄 检测到截图服务Promise错误，尝试重新初始化...');
        screenshotService.close().catch(closeError => {
            console.error('关闭截图服务失败:', closeError);
        });
    }
});

// 添加进程退出处理
process.on('SIGINT', async () => {
    console.log('\n🛑 收到退出信号，正在清理资源...');
    try {
        await screenshotService.close();
        console.log('✅ 资源清理完成');
    } catch (error) {
        console.error('❌ 资源清理失败:', error);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 收到终止信号，正在清理资源...');
    try {
        await screenshotService.close();
        console.log('✅ 资源清理完成');
    } catch (error) {
        console.error('❌ 资源清理失败:', error);
    }
    process.exit(0);
});

// 定期健康检查
setInterval(async () => {
    try {
        if (!screenshotService.isBrowserConnected()) {
            console.log('🔍 健康检查：检测到浏览器连接异常，尝试重新初始化...');
            await screenshotService.close();
            await screenshotService.initialize();
            console.log('✅ 健康检查：截图服务重新初始化成功');
        }
    } catch (error) {
        console.error('❌ 健康检查失败:', error);
    }
}, 30000); // 每30秒检查一次

server.listen(PORT, () => {
    console.log(`🚀 墨水屏图像处理服务器运行在 http://localhost:${PORT}`);
    console.log(`📱 项目预览: http://localhost:${PORT}/codepen_gallery.html`);
    console.log(`📁 项目列表API: http://localhost:${PORT}/api/projects`);
    console.log(`🎨 支持多种抖动算法和调色板`);
    console.log(`⚫ 专为墨水屏优化的图像处理`);
    console.log(`🔍 健康检查：每30秒自动检查截图服务状态`);
    console.log(`⏹️  按 Ctrl+C 停止服务器`);
}); 
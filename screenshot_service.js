const puppeteer = require('puppeteer');
const EpdImageProcessor = require('./epd_image_processor');

class ScreenshotService {
    constructor() {
        this.browser = null;
        this.isInitialized = false;
        this.imageProcessor = new EpdImageProcessor();
    }

    // 检查浏览器连接状态
    isBrowserConnected() {
        return this.browser && this.browser.isConnected && this.browser.isConnected();
    }

    // 初始化浏览器
    async initialize() {
        if (this.isInitialized && this.isBrowserConnected()) {
            return;
        }

        try {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            this.isInitialized = true;
            console.log('✅ Puppeteer浏览器初始化成功');
        } catch (error) {
            console.error('❌ Puppeteer浏览器初始化失败:', error);
            throw error;
        }
    }

    // 截取项目截图
    async captureProject(projectName, baseUrl = 'http://localhost:3001', scaleFactor = 4) {
        // 检查浏览器是否可用，如果不可用则重新初始化
        if (!this.isInitialized || !this.isBrowserConnected()) {
            console.log('🔄 浏览器连接异常，重新初始化...');
            await this.close();
            await this.initialize();
        }

        let page;
        try {
            page = await this.browser.newPage();
        } catch (error) {
            console.error('❌ 创建页面失败，尝试重新初始化浏览器:', error);
            await this.close();
            await this.initialize();
            page = await this.browser.newPage();
        }

        try {
            // 目标尺寸（墨水屏尺寸）
            const targetWidth = 296;
            const targetHeight = 152;
            
            // 计算放大后的视口尺寸
            const scaledWidth = targetWidth * scaleFactor;
            const scaledHeight = targetHeight * scaleFactor;

            // 设置放大后的视口大小
            await page.setViewport({
                width: scaledWidth,
                height: scaledHeight,
                deviceScaleFactor: 1
            });

            // 设置用户代理
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // 导航到项目页面
            const projectUrl = `${baseUrl}/api/project-iframe/${projectName}`;
            await page.goto(projectUrl, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });

            // 等待页面完全渲染
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 截取放大后的页面
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: false,
                omitBackground: false
            });

            // 将截图缩放到目标尺寸
            const resizedScreenshot = await this.resizeImage(screenshot, targetWidth, targetHeight);

            return resizedScreenshot;

        } catch (error) {
            console.error('截图失败:', error);
            
            // 如果是连接错误，尝试重新初始化浏览器并重试一次
            if (error.message.includes('Connection closed') || error.message.includes('Protocol error')) {
                console.log('🔄 检测到连接错误，尝试重新初始化并重试...');
                await page.close();
                await this.close();
                await this.initialize();
                
                // 重试一次
                try {
                    const retryPage = await this.browser.newPage();
                    await retryPage.setViewport({
                        width: scaledWidth,
                        height: scaledHeight,
                        deviceScaleFactor: 1
                    });
                    await retryPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                    
                    const projectUrl = `${baseUrl}/api/project-iframe/${projectName}`;
                    await retryPage.goto(projectUrl, {
                        waitUntil: 'networkidle2',
                        timeout: 10000
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const screenshot = await retryPage.screenshot({
                        type: 'png',
                        fullPage: false,
                        omitBackground: false
                    });
                    
                    const resizedScreenshot = await this.resizeImage(screenshot, targetWidth, targetHeight);
                    await retryPage.close();
                    return resizedScreenshot;
                    
                } catch (retryError) {
                    console.error('重试失败:', retryError);
                    await retryPage.close();
                    throw retryError;
                }
            }
            
            throw error;
        } finally {
            if (page && !page.isClosed()) {
                await page.close();
            }
        }
    }

    // 缩放图像到指定尺寸
    async resizeImage(imageBuffer, targetWidth, targetHeight) {
        try {
            const { createCanvas, loadImage } = require('canvas');
            
            // 加载图像
            const image = await loadImage(imageBuffer);
            
            // 创建目标尺寸的canvas
            const canvas = createCanvas(targetWidth, targetHeight);
            const ctx = canvas.getContext('2d');
            
            // 使用高质量缩放
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // 绘制缩放后的图像
            ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
            
            // 返回Buffer
            return canvas.toBuffer('image/png');
            
        } catch (error) {
            console.error('图像缩放失败:', error);
            // 如果缩放失败，返回原始图像
            return imageBuffer;
        }
    }

    // 转换为高质量灰度图像
    async convertToGrayscale(imageBuffer) {
        try {
            return await this.imageProcessor.convertToGrayscale(imageBuffer);
        } catch (error) {
            console.error('灰度转换失败:', error);
            return imageBuffer;
        }
    }

    // 转换为墨水屏适配图像
    async convertToEInkDisplay(imageBuffer, options = {}) {
        try {
            return await this.imageProcessor.convertToEInkDisplay(imageBuffer, options);
        } catch (error) {
            console.error('墨水屏转换失败:', error);
            return imageBuffer;
        }
    }

    // 高级墨水屏转换
    async convertToAdvancedEInk(imageBuffer, options = {}) {
        try {
            return await this.imageProcessor.convertToAdvancedEInk(imageBuffer, options);
        } catch (error) {
            console.error('高级墨水屏转换失败:', error);
            return imageBuffer;
        }
    }

    // 使用自定义选项处理图像
    async processWithCustomOptions(imageBuffer, options = {}) {
        try {
            return await this.imageProcessor.processWithCustomOptions(imageBuffer, options);
        } catch (error) {
            console.error('自定义选项处理失败:', error);
            return imageBuffer;
        }
    }

    // 关闭浏览器
    async close() {
        if (this.browser) {
            try {
                await this.browser.close();
                console.log('🔒 Puppeteer浏览器已关闭');
            } catch (error) {
                console.warn('⚠️ 关闭浏览器时出现警告:', error.message);
            } finally {
                this.browser = null;
                this.isInitialized = false;
            }
        }
    }
}

module.exports = ScreenshotService; 
const { createCanvas, loadImage } = require('canvas');
const { ditherImage, getDefaultPalettes, getDeviceColors, replaceColors } = require('epdoptimize');

class EpdImageProcessor {
    constructor() {
        this.targetWidth = 296;
        this.targetHeight = 152;
    }

    // 将Buffer转换为Canvas
    async bufferToCanvas(imageBuffer) {
        const image = await loadImage(imageBuffer);
        const canvas = createCanvas(this.targetWidth, this.targetHeight);
        const ctx = canvas.getContext('2d');

        // 调整图像大小以适应目标尺寸
        ctx.drawImage(image, 0, 0, this.targetWidth, this.targetHeight);
        return canvas;
    }

    // 将Canvas转换为Buffer
    canvasToBuffer(canvas) {
        return canvas.toBuffer('image/png');
    }

    // 转换为灰度图像
    async convertToGrayscale(imageBuffer) {
        try {
            const inputCanvas = await this.bufferToCanvas(imageBuffer);
            const outputCanvas = createCanvas(this.targetWidth, this.targetHeight);

            // 使用灰度调色板
            const grayscalePalette = [
                '#000000', // 黑色
                '#FFFFFF'  // 白色
            ];

            const options = {
                ditheringType: 'errorDiffusion',
                errorDiffusionMatrix: 'floydSteinberg',
                palette: grayscalePalette,
                serpentine: true
            };

            ditherImage(inputCanvas, outputCanvas, options);
            return this.canvasToBuffer(outputCanvas);
        } catch (error) {
            console.error('灰度转换失败:', error);
            throw error;
        }
    }

    // 转换为墨水屏优化图像
    async convertToEInkDisplay(imageBuffer, options = {}) {
        try {
            const inputCanvas = await this.bufferToCanvas(imageBuffer);
            const outputCanvas = createCanvas(this.targetWidth, this.targetHeight);

            // 使用Spectra 6调色板（适合大多数墨水屏）
            const palette = getDefaultPalettes('spectra6');

            const ditherOptions = {
                ditheringType: 'errorDiffusion',
                errorDiffusionMatrix: 'floydSteinberg',
                palette: palette,
                serpentine: true,
                ...options
            };

            ditherImage(inputCanvas, outputCanvas, ditherOptions);
            return this.canvasToBuffer(outputCanvas);
        } catch (error) {
            console.error('墨水屏优化失败:', error);
            throw error;
        }
    }

    // 转换为高级墨水屏图像（使用设备特定颜色）
    async convertToAdvancedEInk(imageBuffer, options = {}) {
        try {
            const inputCanvas = await this.bufferToCanvas(imageBuffer);
            const ditheredCanvas = createCanvas(this.targetWidth, this.targetHeight);
            const finalCanvas = createCanvas(this.targetWidth, this.targetHeight);

            // 使用Spectra 6调色板
            const palette = getDefaultPalettes('spectra6');
            const deviceColors = getDeviceColors('spectra6');

            const ditherOptions = {
                ditheringType: 'errorDiffusion',
                errorDiffusionMatrix: 'floydSteinberg',
                palette: palette,
                serpentine: true,
                ...options
            };

            // 第一步：抖动处理
            ditherImage(inputCanvas, ditheredCanvas, ditherOptions);

            // 第二步：颜色校准（将调色板颜色替换为设备实际颜色）
            replaceColors(ditheredCanvas, finalCanvas, {
                originalColors: palette,
                replaceColors: deviceColors
            });

            return this.canvasToBuffer(finalCanvas);
        } catch (error) {
            console.error('高级墨水屏转换失败:', error);
            throw error;
        }
    }

    // 使用自定义调色板处理图像
    async processWithCustomPalette(imageBuffer, customPalette, options = {}) {
        try {
            const inputCanvas = await this.bufferToCanvas(imageBuffer);
            const outputCanvas = createCanvas(this.targetWidth, this.targetHeight);

            const ditherOptions = {
                ditheringType: 'errorDiffusion',
                errorDiffusionMatrix: 'floydSteinberg',
                palette: customPalette,
                serpentine: true,
                ...options
            };

            ditherImage(inputCanvas, outputCanvas, ditherOptions);
            return this.canvasToBuffer(outputCanvas);
        } catch (error) {
            console.error('自定义调色板处理失败:', error);
            throw error;
        }
    }

    // 使用自定义选项处理图像
    async processWithCustomOptions(imageBuffer, options = {}) {
        try {
            const inputCanvas = await this.bufferToCanvas(imageBuffer);
            const outputCanvas = createCanvas(this.targetWidth, this.targetHeight);

            // 根据调色板选项选择调色板
            let palette;
            switch (options.palette) {
                case 'spectra6':
                    palette = getDefaultPalettes('spectra6');
                    break;
                case 'acep':
                    palette = getDefaultPalettes('acep');
                    break;
                case 'grayscale':
                    palette = ['#000000', '#FFFFFF'];
                    break;
                case 'default':
                    palette = getDefaultPalettes('default');
                    break;
                default:
                    palette = getDefaultPalettes('spectra6');
            }

            // 确保调色板是有效的数组
            if (!palette || !Array.isArray(palette) || palette.length === 0) {
                console.warn('无效的调色板，使用默认调色板');
                palette = getDefaultPalettes('spectra6');
            }

            // 构建抖动选项
            const ditherOptions = {
                ditheringType: options.ditheringType || 'errorDiffusion',
                palette: palette,
                serpentine: options.serpentine !== false
            };

            // 根据抖动类型添加特定选项
            if (options.ditheringType === 'errorDiffusion') {
                // 验证误差扩散矩阵名称是否有效
                const validMatrices = [
                    'floydSteinberg', 'atkinson', 'falseFloydSteinberg',
                    'jarvis', 'stucki', 'burkes', 'sierra3', 'sierra2', 'Sierra2-4A'
                ];
                const matrixName = options.errorDiffusionMatrix || 'floydSteinberg';
                ditherOptions.errorDiffusionMatrix = validMatrices.includes(matrixName) ? matrixName : 'floydSteinberg';
            } else if (options.ditheringType === 'ordered') {
                ditherOptions.orderedDitheringType = 'bayer';
                ditherOptions.orderedDitheringMatrix = [
                    options.orderedMatrixW || 4,
                    options.orderedMatrixH || 4
                ];
                // 有序抖动时移除误差扩散矩阵选项
                delete ditherOptions.errorDiffusionMatrix;
            } else if (options.ditheringType === 'random') {
                ditherOptions.randomDitheringType = options.randomDitheringType || 'blackAndWhite';
                // 随机抖动时移除误差扩散矩阵选项
                delete ditherOptions.errorDiffusionMatrix;
            }

            // 执行抖动处理
            try {
                ditherImage(inputCanvas, outputCanvas, ditherOptions);

                // 如果需要设备颜色校准
                if (options.deviceColors && options.deviceColors !== 'default') {
                    const deviceColors = getDeviceColors(options.deviceColors);
                    const finalCanvas = createCanvas(this.targetWidth, this.targetHeight);

                    // 将调色板颜色替换为设备实际颜色
                    replaceColors(outputCanvas, finalCanvas, {
                        originalColors: palette,
                        replaceColors: deviceColors
                    });

                    return this.canvasToBuffer(finalCanvas);
                }

                return this.canvasToBuffer(outputCanvas);
            } catch (ditherError) {
                console.error('抖动处理失败:', ditherError);
                console.log('返回原始图像作为备选方案');
                return imageBuffer;
            }
        } catch (error) {
            console.error('自定义选项处理失败:', error);
            // 出错时返回原始图像，而不是抛出错误
            console.log('返回原始图像作为备选方案');
            return imageBuffer;
        }
    }

    // 获取可用的调色板
    getAvailablePalettes() {
        return {
            'spectra6': getDefaultPalettes('spectra6'),
            'acep': getDefaultPalettes('acep'),
            'grayscale': ['#000000', '#FFFFFF'],
            'custom': null
        };
    }

    // 获取设备颜色
    getDeviceColors(deviceType = 'spectra6') {
        return getDeviceColors(deviceType);
    }

    // 获取图像信息
    async getImageInfo(imageBuffer) {
        try {
            const canvas = await this.bufferToCanvas(imageBuffer);
            return {
                width: canvas.width,
                height: canvas.height,
                format: 'PNG'
            };
        } catch (error) {
            console.error('获取图像信息失败:', error);
            throw error;
        }
    }
}

module.exports = EpdImageProcessor; 
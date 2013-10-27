/////////////////////////////////
// Math Utility Functions
/////////////////////////////////

/**
 * Convert a number into a 32-bit integer.
 */
var int32 = function(val) {
    return val | 0;
};

/**
 * Convert a value from range [0.0, 1.0) (random number) to [0, 256) (single
 * RGB component value).
 */
var pixel = function(val) {
    return int32(val * 256);
};

/////////////////////////////////
// DOM Utility Functions
/////////////////////////////////

var getCanvasElement = function() {
    return document.getElementById('canvas');
};

/**
 * Use canvas.offset{Width,Height} to get the computed width and height. Then,
 * set the style width and height to the desired size on screen, and set the
 * element's width and height attributes to the size of the pixel buffer.
 */
var adjustCanvasForDPI = function(canvas) {
    var width = canvas.offsetWidth * window.devicePixelRatio,
        height = canvas.offsetHeight * window.devicePixelRatio;
        
    canvas.style.width = canvas.offsetWidth;
    canvas.style.height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
};

/////////////////////////////////
// Noise Renderers
/////////////////////////////////

var renderers = [];

var setGrayscalePixelFromRand = function(imageData, index, randFunc) {
    var arrayIndex = index * 4,
        brightness = pixel(randFunc());
    imageData.data[arrayIndex] = brightness;
    imageData.data[arrayIndex+1] = brightness;
    imageData.data[arrayIndex+2] = brightness;
    imageData.data[arrayIndex+3] = 255; // 255 = opaque.
};
renderers.push({
    name: 'grayscale',
    func: setGrayscalePixelFromRand
});

var setColorPixelFromRand = function(imageData, index, randFunc) {
    var arrayIndex = index * 4;
    imageData.data[arrayIndex] = pixel(randFunc());
    imageData.data[arrayIndex+1] = pixel(randFunc());
    imageData.data[arrayIndex+2] = pixel(randFunc());
    imageData.data[arrayIndex+3] = 255; // 255 = opaque.
};
renderers.push({
    name: 'color',
    func: setColorPixelFromRand
});

/////////////////////////////////
// Noise Generators
/////////////////////////////////

var generators = [];

var uniform = function() {
    return Math.random();
};
generators.push({
    name: 'uniform',
    func: uniform
});

var binaryUniform = function() {
    return Math.random() < 0.5 ? 0 : 1;
};
generators.push({
    name: 'binaryUniform',
    func: binaryUniform
});

/////////////////////////////////
// dat.GUI
/////////////////////////////////

var createGUI = function(canvas) {
    var getName = function(obj) { return obj.name; },
        rendererNames = _.map(renderers, getName),
        generatorNames = _.map(generators, getName);

    var renderConfig = {
        renderer: rendererNames[0],
        generator: generatorNames[0]
    };
    renderConfig.render = renderNoiseToCanvas.bind(this, canvas, renderConfig);

    var gui = new dat.GUI();
    gui.add(renderConfig, 'renderer', rendererNames);
    gui.add(renderConfig, 'generator', generatorNames);
    gui.add(renderConfig, 'render');
};

/////////////////////////////////
// Main Logic
/////////////////////////////////

/**
 * Once the document is loaded, we set getImageData to a function returning
 * a temporary ImageData object to render the noise into.
 */
var getImageData;

var renderNoiseToCanvas = function(canvas, config) {       
    // Look up the functions we should use for noise generation and rendering.
    var setPixel = _.find(renderers, function(item) {
        return item.name == config.renderer;
    }).func;
    var noiseFunc = _.find(generators, function(item) {
        return item.name == config.generator;
    }).func;

    var width = canvas.width,
        height = canvas.height,
        // Get our temporary ImageData object.
        imageData = getImageData();

    for (i = 0, maxIndex = width * height; i < maxIndex; i++) {
        // Set a pixel's color value using the given number source.
        setPixel(imageData, i, noiseFunc);
    }

    // Write the new image data to the canvas.
    canvas.getContext('2d').putImageData(imageData, 0, 0);
};

$(document).ready(function() {
    var canvas = getCanvasElement();
    adjustCanvasForDPI(canvas);

    // Create the accessor for our temporary drawing surface.
    var ctx = canvas.getContext('2d')
        imageData = ctx.createImageData(canvas.width, canvas.height);
    getImageData = function() { return imageData; };

    createGUI(canvas);
});

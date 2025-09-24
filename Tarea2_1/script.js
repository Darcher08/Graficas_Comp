// Usa glMatrix desde CDN
const mat4 = window.glMatrix.mat4;

function createCylinder(sides = 20, height = 2.0, radius = 1.0) {
    var vertices = [];
    var indices = [];
    var colors = [];

    var stepAngle = (2 * Math.PI) / sides;

    vertices.push(0, height / 2, 0);
    colors.push(1.0, 0.1, 0.1);

    vertices.push(0, -height / 2, 0);
    colors.push(1.0, 0.0, 0.0);

    for (var i = 0; i < sides; i++) {
        var angle = i * stepAngle;
        var x = radius * Math.cos(angle);
        var z = radius * Math.sin(angle);

        vertices.push(x, height / 2, z);
        colors.push(1, 1, 0);
    }

    for (var i = 0; i < sides; i++) {
        var angle = i * stepAngle;
        var x = radius * Math.cos(angle);
        var z = radius * Math.sin(angle);

        vertices.push(x, -height / 2, z);
        colors.push(0.2, 0.2, 0);
    }

    for (var i = 0; i < sides; i++) {
        indices.push(0);
        indices.push(2 + i);
        indices.push(2 + ((i + 1) % sides));
    }

    for (var i = 0; i < sides; i++) {
        indices.push(1);
        indices.push(2 + sides + ((i + 1) % sides));
        indices.push(2 + sides + i);
    }

    for (var i = 0; i < sides; i++) {
        var topCurrent = 2 + i;
        var topNext = 2 + ((i + 1) % sides);
        var bottomCurrent = 2 + sides + i;
        var bottomNext = 2 + sides + ((i + 1) % sides);

        indices.push(topCurrent);
        indices.push(bottomCurrent);
        indices.push(topNext);

        indices.push(topNext);
        indices.push(bottomCurrent);
        indices.push(bottomNext);
    }

    return {
        vertices: vertices,
        colors: colors,
        indices: indices
    };
}

var canvas = document.getElementById("my_Canvas");
var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

if (!gl) {
    alert("WebGL no está soportado en este navegador");
}

var cylinder = createCylinder(20, 4.0, 1);

var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinder.vertices), gl.STATIC_DRAW);

var color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinder.colors), gl.STATIC_DRAW);

var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cylinder.indices), gl.STATIC_DRAW);

var vertexShaderSource = `
    attribute vec3 position;
    attribute vec3 color;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;
    varying vec3 vColor;
    void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 1.0);
        vColor = color;
    }
`;

var fragmentShaderSource = `
    precision mediump float;
    varying vec3 vColor;
    void main() {
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compilando shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Error enlazando programa:', gl.getProgramInfoLog(shaderProgram));
}

var positionLocation = gl.getAttribLocation(shaderProgram, 'position');
var colorLocation = gl.getAttribLocation(shaderProgram, 'color');
var projectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
var viewMatrixLocation = gl.getUniformLocation(shaderProgram, 'uViewMatrix');
var modelMatrixLocation = gl.getUniformLocation(shaderProgram, 'uModelMatrix');

// Matriz de proyección
var projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 2, canvas.width / canvas.height, 0.1, 100.0);

// Parámetros de cámara
var cameraPos = [0, 0, 12];
var cameraFront = [0, 0, -1];
var cameraUp = [0, 1, 0];

// Movimiento de cámara con WASD
var cameraSpeed = 0.3;
document.addEventListener('keydown', function (e) {
    if (e.key === 'w' || e.key === 'W') {
        cameraPos[2] -= cameraSpeed;
    }
    if (e.key === 's' || e.key === 'S') {
        cameraPos[2] += cameraSpeed;
    }
    if (e.key === 'a' || e.key === 'A') {
        cameraPos[0] -= cameraSpeed;
    }
    if (e.key === 'd' || e.key === 'D') {
        cameraPos[0] += cameraSpeed;
    }
});

var orbitRotation = 0;
var selfRotation = 0;

function render() {
    orbitRotation += .02;
    selfRotation += 0.02;

    // Matriz de vista usando lookAt de glMatrix
    var viewMatrix = mat4.create();
    var target = [
        cameraPos[0] + cameraFront[0],
        cameraPos[1] + cameraFront[1],
        cameraPos[2] + cameraFront[2]
    ];
    mat4.lookAt(viewMatrix, cameraPos, target, cameraUp);

    // Matriz de modelo
    var modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [6, 6, 6]);
    mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 2);
    mat4.rotateY(modelMatrix, modelMatrix, orbitRotation);
    mat4.rotateZ(modelMatrix, modelMatrix, selfRotation);

    gl.clearColor(0.1, 0.1, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);

    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, cylinder.indices.length, gl.UNSIGNED_SHORT, 0); gl.drawElements(gl.TRIANGLES, cylinder.indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}

render();
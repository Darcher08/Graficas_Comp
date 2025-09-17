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

function multiplyMatrices(a, b) {
    var result = new Array(16);
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            result[i * 4 + j] = 0;
            for (var k = 0; k < 4; k++) {
                result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
            }
        }
    }
    return result;
}

function translate(tx, ty, tz) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1
    ];
}

function rotateX(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1
    ];
}
function perspective(fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2);
    var rangeInv = 1 / (near - far);

    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];
}

function rotateY(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
    ];
}


function rotateZ(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    return [
        c, -s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}


var canvas = document.getElementById("my_Canvas");
var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

if (!gl) {
    alert("WebGL no está soportado en este navegador");
}

var cylinder = createCylinder(20, 4.0, 1);
var colores = cylinder.colors


colores.forEach(color => {
    color / 0.01 * Math.random()
});

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



var projectionMatrix = perspective(Math.PI / 2, canvas.width / canvas.height, 0.1, 100.0);

// Vista superior: cámara mirando hacia abajo desde arriba
var cameraDistance = 12;

var cameraRotation = rotateZ(-Math.PI / 2);
var cameraTranslation = translate(0, 0, -cameraDistance);

var viewMatrix = multiplyMatrices(cameraTranslation, cameraRotation);

var orbitRotation = 0;
var selfRotation = 0;


function render() {
    orbitRotation += .02;
    selfRotation += 0.02;

    var translationMatrix = translate(6, 6, 6);
    var selfRotationMatrix = rotateZ(selfRotation);
    var orbitRotationMatrix = rotateY(orbitRotation);
    var orientationMatrix = rotateX(Math.PI / 2); // rotación para cambiar dirección

    var temp = multiplyMatrices(translationMatrix, orientationMatrix);
    temp = multiplyMatrices(temp, selfRotationMatrix);

    var modelMatrix = multiplyMatrices(orbitRotationMatrix, temp);


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
    gl.drawElements(gl.TRIANGLES, cylinder.indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}

render();
/*============= Creating a canvas =================*/
var canvas = document.getElementById("my_Canvas");
gl = canvas.getContext("experimental-webgl");

/*============ Defining and storing the geometry =========*/

var vertices = [
    // Front face
    -1, -1, 1,
    1, -1, 1,
    1, 1, 1,
    -1, 1, 1,
    // Back face
    -1, -1, -1,
    -1, 1, -1,
    1, 1, -1,
    1, -1, -1,
    // Top face
    -1, 1, -1,
    -1, 1, 1,
    1, 1, 1,
    1, 1, -1,
    // Bottom face
    -1, -1, -1,
    1, -1, -1,
    1, -1, 1,
    -1, -1, 1,
    // Right face
    1, -1, -1,
    1, 1, -1,
    1, 1, 1,
    1, -1, 1,
    // Left face
    -1, -1, -1,
    -1, -1, 1,
    -1, 1, 1,
    -1, 1, -1
];

var indices = [
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // back
    8, 9, 10, 8, 10, 11,   // top
    12, 13, 14, 12, 14, 15,   // bottom
    16, 17, 18, 16, 18, 19,   // right
    20, 21, 22, 20, 22, 23    // left
];

var uvs = [
    // Front face
    0, 0,
    1, 0,
    1, 1,
    0, 1,
    // Back face
    1, 0,
    1, 1,
    0, 1,
    0, 0,
    // Top face
    0, 1,
    0, 0,
    1, 0,
    1, 1,
    // Bottom face
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    // Right face
    1, 0,
    1, 1,
    0, 1,
    0, 0,
    // Left face
    0, 0,
    1, 0,
    1, 1,
    0, 1
];

var cubeTexture;
var cubeImage;


function initTextures() {
    cubeTexture = gl.createTexture();
    cubeImage = new Image();
    cubeImage.onload = function () {
        handleTextureLoaded(cubeImage, cubeTexture);
    };
    cubeImage.src = "prueba.jpg"


}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    D
    gl.bindTexture(gl.TEXTURE_2D, null);
}
// Create and store data into vertex buffer
var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Create and store data into index buffer
var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// Create and store data into UV buffer
var uv_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

/*=================== Shaders =========================*/

var vertCode =
    "attribute vec3 position;" +
    "attribute vec2 uv;" +
    "uniform mat4 Pmatrix;" +
    "uniform mat4 Vmatrix;" +
    "uniform mat4 Mmatrix;" +
    "varying vec2 vUV;" +
    "void main(void) { " +
    "gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);" +
    "vUV = uv;" +
    "}";

var fragCode =
    "precision mediump float;" +
    "varying vec2 vUV;" +
    "uniform sampler2D uSampler0;" +
    "uniform sampler2D uSampler1;" +
    "void main(void) {" +
    // Mezcla las dos texturas (puedes cambiar la mezcla)
    "vec4 tex0 = texture2D(uSampler0, vUV);" +
    "vec4 tex1 = texture2D(uSampler1, vUV);" +
    "gl_FragColor = mix(tex0, tex1, 0.5);" + // 0.5 es mezcla igual, puedes cambiarlo
    "}";

var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);

// Check for shader compilation errors
if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    console.log('Vertex shader error: ' + gl.getShaderInfoLog(vertShader));
}
if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    console.log('Fragment shader error: ' + gl.getShaderInfoLog(fragShader));
}
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log('Program link error: ' + gl.getProgramInfoLog(shaderProgram));
}

gl.useProgram(shaderProgram);

/* ====== Associating attributes to vertex shader =====*/
var Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
var Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
var Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");
var uSampler = gl.getUniformLocation(shaderProgram, "uSampler");

// Position attribute
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var position = gl.getAttribLocation(shaderProgram, "position");
gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(position);

// UV attribute
gl.bindBuffer(gl.ARRAY_BUFFER, uv_buffer);
var uv = gl.getAttribLocation(shaderProgram, "uv");
gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(uv);

initTextures();

/*==================== MATRIX =====================*/

function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle * 0.5 * Math.PI) / 180);
    return [
        0.5 / ang, 0, 0, 0,
        0, (0.5 * a) / ang, 0, 0,
        0, 0, -(zMax + zMin) / (zMax - zMin), -1,
        0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
    ];
}

var proj_matrix = get_projection(40, canvas.width / canvas.height, 1, 100);
var mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

// translating z
view_matrix[14] = view_matrix[14] - 6; //zoom

/*==================== Rotation ====================*/

function rotateZ(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c * m[0] - s * m[1];
    m[4] = c * m[4] - s * m[5];
    m[8] = c * m[8] - s * m[9];

    m[1] = c * m[1] + s * mv0;
    m[5] = c * m[5] + s * mv4;
    m[9] = c * m[9] + s * mv8;
}

function rotateX(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1] = m[1] * c - m[2] * s;
    m[5] = m[5] * c - m[6] * s;
    m[9] = m[9] * c - m[10] * s;

    m[2] = m[2] * c + mv1 * s;
    m[6] = m[6] * c + mv5 * s;
    m[10] = m[10] * c + mv9 * s;
}

function rotateY(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c * m[0] + s * m[2];
    m[4] = c * m[4] + s * m[6];
    m[8] = c * m[8] + s * m[10];

    m[2] = c * m[2] - s * mv0;
    m[6] = c * m[6] - s * mv4;
    m[10] = c * m[10] - s * mv8;
}

/*================= Drawing ===========================*/
var time_old = 0;

var animate = function (time) {
    var dt = time - time_old;
    rotateZ(mov_matrix, dt * 0.0005);
    rotateX(mov_matrix, dt * 0.0005);
    rotateY(mov_matrix, dt * 0.0005);
    time_old = time;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.5, 0.5, 0.5, 0.9);
    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
    gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
    gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.uniform1i(uSampler, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(animate);
};

animate(0);
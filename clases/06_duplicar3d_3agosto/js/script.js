function Cylinder() {
  var sides = 20;
  var height = 5.0;
  var stepTheta = (2 * Math.PI) / sides;
  var verticesPerCap = 9 * sides;

  var vertices = [];
  var theta = 0;
  var i = 0;

  // Top Cap
  for (; i < verticesPerCap; i += 9) {
    vertices[i] = Math.cos(theta);
    vertices[i + 1] = height;
    vertices[i + 2] = Math.sin(theta);
    theta += stepTheta;

    vertices[i + 3] = 0.0;
    vertices[i + 4] = height;
    vertices[i + 5] = 0.0;

    vertices[i + 6] = Math.cos(theta);
    vertices[i + 7] = height;
    vertices[i + 8] = Math.sin(theta);
  }

  // Bottom Cap
  theta = 0;
  for (; i < verticesPerCap + verticesPerCap; i += 9) {
    vertices[i + 6] = Math.cos(theta);
    vertices[i + 7] = -height;
    vertices[i + 8] = Math.sin(theta);
    theta += stepTheta;

    vertices[i + 3] = 0.0;
    vertices[i + 4] = -height;
    vertices[i + 5] = 0.0;

    vertices[i] = Math.cos(theta);
    vertices[i + 1] = -height;
    vertices[i + 2] = Math.sin(theta);
  }

  for (var j = 0; j < sides; ++j) {
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[0 + k + 9 * j];
    }
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[6 + k + 9 * j];
    }
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[verticesPerCap + k + 9 * j];
    }

    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[0 + k + 9 * j];
    }
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[verticesPerCap + k + 9 * j];
    }
    for (var k = 0; k < 3; ++k, ++i) {
      vertices[i] = vertices[verticesPerCap + 6 + k + 9 * j];
    }
  }

  var indices = new Array(vertices.length / 3);
  for (i = 0; i < indices.length; ++i) indices[i] = i;

  function sub(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
  function normalize(a) {
    var length = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    return [a[0] / length, a[1] / length, a[2] / length];
  }

  var normals = [];

  for (var i = 0; i < vertices.length; i += 9) {
    var a = [vertices[i], vertices[i + 1], vertices[i + 2]];
    var b = [vertices[i + 3], vertices[i + 4], vertices[i + 5]];
    var c = [vertices[i + 6], vertices[i + 7], vertices[i + 8]];
    var normal = normalize(cross(sub(a, b), sub(a, c)));
    normals = normals.concat(normal, normal, normal);
  }

  return {
    vertices: vertices,
    indices: indices,
    normals: normals,
  };
}

/*============= Creating a canvas =================*/
var canvas = document.getElementById("my_Canvas");
gl = canvas.getContext("experimental-webgl");

/*============ Defining and storing the geometry =========*/

var vertices = [
  -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1,
  1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1,
  1, 1, -1, 1, -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1, -1, 1, 1,
  1, 1, 1, 1, 1, -1,
];

var colors = [
  5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7, 1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3, 0, 0,
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1,
  1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
];

var indices = [
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
  15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
];

// Create and store data into vertex buffer
var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Create and store data into color buffer
var color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// Create and store data into index buffer
var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  new Uint16Array(indices),
  gl.STATIC_DRAW
);

// Después de crear los buffers del cubo, agregamos los del cilindro
var cylinder = Cylinder(); // Crear el cilindro

// Buffer para vértices del cilindro
var cylinder_vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_vertex_buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(cylinder.vertices),
  gl.STATIC_DRAW
);

// Buffer para normales del cilindro
var cylinder_normal_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_normal_buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(cylinder.normals),
  gl.STATIC_DRAW
);

// Buffer para índices del cilindro
var cylinder_index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinder_index_buffer);
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  new Uint16Array(cylinder.indices),
  gl.STATIC_DRAW
);

// Crear una segunda matriz de movimiento para el cilindro
// Z axis (blue) - Keep it along Z
var mov_matrix_cylinder = [
  0.1,
  0,
  0,
  0, // Thin X scale
  0,
  0.1,
  0,
  0, // Thin Y scale
  0,
  0,
  1,
  0, // Full Z scale
  0,
  0,
  0,
  1, // No translation
];

// X axis (red) - Rotate to align with X
var mov_matrix_cylinder_2 = [
  1,
  0,
  0,
  0, // Full X scale
  0,
  0.1,
  0,
  0, // Thin Y scale
  0,
  0,
  0.1,
  0, // Thin Z scale
  0,
  0,
  0,
  1, // No translation
];

// Y axis (green) - Rotate to align with Y
var mov_matrix_cylinder_3 = [
  0.1,
  0,
  0,
  0, // Thin X scale
  0,
  1,
  0,
  0, // Full Y scale
  0,
  0,
  0.1,
  0, // Thin Z scale
  0,
  0,
  0,
  1, // No translation
];

/*=================== Shaders =========================*/

var vertCode =
  "attribute vec3 position;" +
  "uniform mat4 Pmatrix;" +
  "uniform mat4 Vmatrix;" +
  "uniform mat4 Mmatrix;" +
  "attribute vec3 color;" + //the color of the point
  "varying vec3 vColor;" +
  "void main(void) { " + //pre-built function
  "gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);" +
  "vColor = color;" +
  "}";

var fragCode =
  "precision mediump float;" +
  "varying vec3 vColor;" +
  "void main(void) {" +
  "gl_FragColor = vec4(vColor, 1.);" +
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

/* ====== Associating attributes to vertex shader =====*/
var Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
var Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
var Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var position = gl.getAttribLocation(shaderProgram, "position");
gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

// Position
gl.enableVertexAttribArray(position);
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
var color = gl.getAttribLocation(shaderProgram, "color");
gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);

// Color
gl.enableVertexAttribArray(color);
gl.useProgram(shaderProgram);

/*==================== MATRIX =====================*/

function get_projection(angle, a, zMin, zMax) {
  var ang = Math.tan((angle * 0.5 * Math.PI) / 180); //angle*.5
  return [
    0.5 / ang,
    0,
    0,
    0,
    0,
    (0.5 * a) / ang,
    0,
    0,
    0,
    0,
    -(zMax + zMin) / (zMax - zMin),
    -1,
    0,
    0,
    (-2 * zMax * zMin) / (zMax - zMin),
    0,
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
  var mv0 = m[0],
    mv4 = m[4],
    mv8 = m[8];

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
  var mv1 = m[1],
    mv5 = m[5],
    mv9 = m[9];

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
  var mv0 = m[0],
    mv4 = m[4],
    mv8 = m[8];

  m[0] = c * m[0] + s * m[2];
  m[4] = c * m[4] + s * m[6];
  m[8] = c * m[8] + s * m[10];

  m[2] = c * m[2] - s * mv0;
  m[6] = c * m[6] - s * mv4;
  m[10] = c * m[10] - s * mv8;
}

/*================= Drawing ===========================*/
var time_old = 0;

// Rotar el cubo
rotateZ(mov_matrix, 0.0);

var animate = function (time) {
  var dt = time - time_old;

  time_old = time;

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.5, 0.5, 0.5, 0.9);
  gl.clearDepth(1.0);

  gl.viewport(0.0, 0.0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Dibujar el cubo

  gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
  gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
  gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

  // Dibujar el cilindro
  gl.uniformMatrix4fv(Mmatrix, false, mov_matrix_cylinder);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_vertex_buffer);
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_normal_buffer);
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinder_index_buffer);
  gl.drawElements(gl.TRIANGLES, cylinder.indices.length, gl.UNSIGNED_SHORT, 0);

  // Dibujar el cilindro
  gl.uniformMatrix4fv(Mmatrix, false, mov_matrix_cylinder_2);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_vertex_buffer);
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_normal_buffer);
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinder_index_buffer);
  gl.drawElements(gl.TRIANGLES, cylinder.indices.length, gl.UNSIGNED_SHORT, 0);

  // Dibujar el cilindro
  gl.uniformMatrix4fv(Mmatrix, false, mov_matrix_cylinder_3);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_vertex_buffer);
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylinder_normal_buffer);
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinder_index_buffer);
  gl.drawElements(gl.TRIANGLES, cylinder.indices.length, gl.UNSIGNED_SHORT, 0);

  window.requestAnimationFrame(animate);
};

animate(0);

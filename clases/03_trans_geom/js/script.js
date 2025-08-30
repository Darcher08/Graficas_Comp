/*=================Creating a canvas=========================*/
var canvas = document.getElementById("my_Canvas");
gl = canvas.getContext("experimental-webgl");

/*===========Defining and storing the geometry==============*/
var vertices = [-0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0];

//Create an empty buffer object and store vertex data
var vertex_buffer = gl.createBuffer();

//Create a new buffer
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

//bind it to the current buffer
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Pass the buffer data
gl.bindBuffer(gl.ARRAY_BUFFER, null);

/*========================Shaders============================*/

//vertex shader source code
var vertCode =
  "attribute vec4 coordinates;" +
  "uniform vec4 translation;" +
  "uniform float rotation;" +
  "void main(void) {" +
  "  float s = sin(rotation);" +
  "  float c = cos(rotation);" +
  "  mat4 rotationMatrix = mat4(" +
  "    c, -s, 0.0, 0.0," +
  "    s, c, 0.0, 0.0," +
  "    0.0, 0.0, 1.0, 0.0," +
  "    0.0, 0.0, 0.0, 1.0" +
  "  );" +
  "  gl_Position = rotationMatrix * coordinates + translation;" +
  "}";

//Create a vertex shader program object and compile it
var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

//fragment shader source code
var fragCode =
  "void main(void) {" + "   gl_FragColor = vec4(1.0, 0.2, 0.0, 0.8);" + "}";

//Create a fragment shader program object and compile it
var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

//Create and use combiened shader program
var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);

gl.useProgram(shaderProgram);

/* ===========Associating shaders to buffer objects============*/

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var coordinatesVar = gl.getAttribLocation(shaderProgram, "coordinates");
gl.vertexAttribPointer(coordinatesVar, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(coordinatesVar);

/* ==========translation======================================*/
var Tx = 0.5,
  Ty = 0.5,
  Tz = 0.0;
var translation = gl.getUniformLocation(shaderProgram, "translation");
gl.uniform4f(translation, Tx, Ty, Tz, 0.0);

var rotation = gl.getUniformLocation(shaderProgram, "rotation");

function checkBounds(x, y, z) {
  // Considerando el tamaño del triángulo (0.5 unidades)
  const triangleSize = 0.5;
  const maxX = 1.0 - triangleSize;
  const minX = -1.0 + triangleSize;
  const maxY = 1.0 - triangleSize;
  const minY = -1.0 + triangleSize;

  let newDirection = null;

  // Si alcanza cualquier límite, indicar cambio de dirección
  if (x >= maxX || x <= minX || y >= maxY || y <= minY) {
    newDirection = true;
  }

  // Ajustar posición dentro de límites
  x = Math.max(minX, Math.min(maxX, x));
  y = Math.max(minY, Math.min(maxY, y));

  return { x, y, z, needsDirectionChange: newDirection };
}

function fn_translation(tiempos, x, y, z, direction) {
  if (tiempos <= 0) {
    console.log("done");
    return;
  }

  let r = Math.random();
  let g = Math.random();
  let b = Math.random();

  gl.clearColor(r, g, b, 0.9);

  let move = 0.02;
  x = x + move * direction;
  y = y + move * direction;
  z = z + move * direction;

  // Agregar rotación
  let angle = (Date.now() * 0.001) % (Math.PI * 2); // Rotación basada en el tiempo
  gl.uniform1f(rotation, angle);

  // Verificar límites
  const bounded = checkBounds(x, y, z);

  // Si alcanzó un límite, cambiar dirección
  if (bounded.needsDirectionChange) {
    direction = -direction;
  }

  // Actualizar posición con valores ajustados
  x = bounded.x;
  y = bounded.y;
  z = bounded.z;

  // Actualizar la posición
  gl.uniform4f(translation, x, y, z, 0.0);

  // Redibujar la escena
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Continuar la animación
  setTimeout(() => {
    fn_translation(tiempos - 1, x, y, z, direction);
  }, 100);
}

setTimeout(() => {
  fn_translation(2000, 0, 0, 0, 1);
}, 1000);

/*=================Drawing the triangle and transforming it========================*/

/*
gl.enable(gl.DEPTH_TEST);

gl.clear(gl.COLOR_BUFFER_BIT);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.drawArrays(gl.TRIANGLES, 0, 3);
*/

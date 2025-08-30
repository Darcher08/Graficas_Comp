// Get the canvas element and initialize WebGL context
const canvas = document.getElementById("webgl-canvas");
const gl = canvas.getContext("webgl");

// Check if WebGL is supported
if (!gl) {
  console.error("WebGL not supported");
}

// Vertex shader source code: this
// determines the position of each vertex
const vsSource = `
    attribute vec4 a_position;
    uniform mat4 u_matrix;
    void main() {
        // Multiply the position by the 
        // matrix to transform the vertices
        gl_Position = u_matrix * a_position;
    }
`;

// Fragment shader source code:
// this determines the color of each pixel
const fsSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        // Set the fragment color to the uniform value
        gl_FragColor = u_color;
    }
`;

// Function to compile a shader from its source code
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  // Check for compilation errors
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Function to create a WebGL program
//  with a vertex and fragment shader
function createProgram(gl, vsSource, fsSource) {
  const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  // Check for linking errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

// Create and use the WebGL program
const program = createProgram(gl, vsSource, fsSource);
gl.useProgram(program);

// Define the vertices of a square (two triangles)
const vertices = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]);

// Create a buffer to hold the vertex data
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Get the location of the attributes and uniforms in the shader program
const positionLocation = gl.getAttribLocation(program, "a_position");
const matrixLocation = gl.getUniformLocation(program, "u_matrix");
const colorLocation = gl.getUniformLocation(program, "u_color");

// Set the color uniform to red
gl.uniform4f(colorLocation, 1, 0, 0, 1);

// Bind the vertex buffer and set up the attribute pointers
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionLocation);

// Function to update the transformation
// matrix and redraw the scene
function updateMatrix() {
  // Get the translation values from the input elements
  const translateX = parseFloat(document.getElementById("translateX").value);
  const translateY = parseFloat(document.getElementById("translateY").value);

  // Create a translation matrix

  const matrix = new Float32Array([
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    translateX,
    translateY,
    0,
    1,
  ]);

  // Set the matrix uniform in the shader
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // Clear the canvas and redraw the square
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Initial draw of the scene
updateMatrix();

// Add event listeners to update the matrix when the sliders change
document.getElementById("translateX").addEventListener("input", (event) => {
  document.getElementById("translateXValue").textContent = event.target.value;
  updateMatrix();
});

document.getElementById("translateY").addEventListener("input", (event) => {
  document.getElementById("translateYValue").textContent = event.target.value;
  updateMatrix();
});

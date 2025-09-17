import {
    Cube, //clase
    get_projection,
    rotateX,
    rotateY,
    rotateZ,
    cameraDepth,
    cameraRigth_Left,
    cameraUp_Down,

} from "./utils.js";


// Seleccionar el canvas con el que se va trabajar
var canvas = document.getElementById("my_Canvas");
var gl = canvas.getContext("experimental-webgl");
/*
Como son programas que van a utilizar 3 dimensiones se deben
crear vertices que conceptualmente, tengan 3 puntos
*/

// vertices : 8 esquinas del cubo (x,y,z para cada uno)

var vertices = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,  // cara frontal
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,  // cara trasera
    -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,  // cara izquierda
    1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,  // cara derecha
    -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,  // cara inferior
    -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1   // cara superior
];

// Colores para cada cara (valores RGB normalizados)

var colors = [
    5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,  // morado para cara frontal
    1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,  // amarillo para cara trasera
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,  // azul para cara izquierda
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,  // rojo para cara derecha
    1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,  // amarillo para cara inferior
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0   // verde para cara superior
];

// Indices: indican la forma en como queremos que se
// formen los triangulos
var indices = [
    0, 1, 2, 0, 2, 3,    // cara frontal (2 triángulos)
    4, 5, 6, 4, 6, 7,    // cara trasera
    8, 9, 10, 8, 10, 11,  // cara izquierda
    12, 13, 14, 12, 14, 15, // cara derecha
    16, 17, 18, 16, 18, 19, // cara inferior
    20, 21, 22, 20, 22, 23  // cara superior
];

//Crear buffers (contenedores de datos para la GPU)

var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);


var color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// shaders: programas que corren en la gpu que permiten dibujar cosas

// para ver la representacion grafica de las cosas
/**u
 * Puntos importantes a considerar
 * La Pmatrix es la representacion de los vertices que seran dibujados
 * Vmatrix, es la representacion de la vista de la camara
 * y la Mmatrix, es la que controla el posible movimiento que le queramos dar
 * a nuestros objetos en traslacion, escala o rotacion
 */
var vertCode =
    "attribute vec3 position;" +
    "uniform mat4 Pmatrix;" +
    "uniform mat4 Vmatrix;" +
    "uniform mat4 Mmatrix;" +
    "attribute vec3 color;" +
    "varying vec3 vColor;" +
    "void main(void) { " +
    "gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);" +
    "vColor = color;" +
    "}";

// sirve para asignar colores  a cada uno de los vertices
var fragCode =
    "precision mediump float;" +
    "varying vec3 vColor;" +
    "void main(void) {" +
    "gl_FragColor = vec4(vColor, 1.);" +
    "}";


//! Compilar shaders
var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

// Crear programa de shaders
var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);

// Conectar atributos
var Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
var Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
var Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

var position = gl.getAttribLocation(shaderProgram, "position");
gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(position);

gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);

var color = gl.getAttribLocation(shaderProgram, "color");
gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(color);

gl.useProgram(shaderProgram);

var proj_matrix = get_projection(40, canvas.width / canvas.clientHeight, 1, 100);
var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

//* Este alejamiento se hace con funciones de utils
cameraDepth(view_matrix, 15);
cameraRigth_Left(view_matrix, 5)


// Preparar para dibujar
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.clearColor(0.5, 0.1, 0.5, 0.9); // color de canvas
gl.clearDepth(1.0);

// mostrar canvas
gl.viewport(0.0, 0.0, canvas.width, canvas.height);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// Enviar matrices a los shaders
// toda la informacion almancenada anteriormente

gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);

// Crear múltiples cubos
const cubes = [
    new Cube(0, 0, 0, 0, 0, 0, 1),        // Centro
    new Cube(3, 0, 0, 0, Math.PI / 4, 0, 0.8), // Derecha
    new Cube(-3, 0, 0, Math.PI / 6, 0, 0, 1.2), // Izquierda
    new Cube(0, 3, 0, 0, 0, Math.PI / 3, 0.6),  // Arriba
    new Cube(0, -3, 0, Math.PI / 2, 0, 0, 1.5)  // Abajo
];

// Función de renderizado
function renderCubes(cubesToDraw) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    cubesToDraw.forEach(cube => {
        cube.draw(gl, Mmatrix, indices);
    });
}
// Función de animación con sistema de cubos
function animateCubes() {
    let time = Date.now() * 0.001;

    // Animar cada cubo individualmente
    cubes[0].rotate(0.01, 0.02, 0);
    cubes[1].setPosition(3 + Math.sin(time), 0, 0);
    cubes[1].rotate(0, 0.03, 0);
    cubes[2].setPosition(-3, Math.cos(time) * 2, 0);
    cubes[3].rotate(0.02, 0, 0.01);
    cubes[4].setPosition(0, -3, Math.sin(time * 2) * 2);

    renderCubes(cubes);
    requestAnimationFrame(animateCubes);
}

const newCubes = [
    new Cube(2, 0, 0, 0, 0, 0, 1), //centro
    new Cube(0, -2, 0, 0, 0, 0, 1), //abajo
    new Cube(0, 2, 0, 0, 0, 0, 1), //arriba
]

function createRowCubes() {
    renderCubes(newCubes);
}

//createRowCubes()
animateCubes()
// WebGL - load obj - w/mtl, textures
// from https://webglfundamentals.org/webgl/webgl-load-obj-w-mtl-w-textures.html


"use strict";

function seleccionarVerticesAleatorios(grafo) {
    const todosLosIds = Array.from(grafo.keys());
    const numVertices = todosLosIds.length;

    if (numVertices < 2) {
        console.error("El grafo debe tener al menos 2 vértices.");
        return [];
    }

    // 1. Elegir el primer vértice aleatorio
    const indiceAleatorio1 = Math.floor(Math.random() * numVertices);
    const vertice1 = todosLosIds[indiceAleatorio1];

    // 2. Elegir el segundo vértice aleatorio, asegurándose de que sea diferente al primero
    let vertice2;
    do {
        const indiceAleatorio2 = Math.floor(Math.random() * numVertices);
        vertice2 = todosLosIds[indiceAleatorio2];
    } while (vertice1 === vertice2); // Repetir si se selecciona el mismo vértice

    return [vertice1, vertice2];
}

function leerVerticesYAristas(contenidoObj) {
    const grafo = new Map();

    // 1. Inicializar el Map con todos los vértices 'v' para asegurar que existan.
    // Aunque solo se necesitan los 'f' para las aristas, es buena práctica.
    let verticeId = 0;
    const lineas = contenidoObj.split('\n');

    for (const linea of lineas) {
        if (linea.startsWith('v ')) {
            verticeId++;
            if (!grafo.has(verticeId)) {
                grafo.set(verticeId, new Set());
            }
        }
    }

    // 2. Procesar las caras 'f' para construir las aristas.
    for (const linea of lineas) {
        if (linea.startsWith('f ')) {
            const partes = linea.trim().split(/\s+/).slice(1);
            // Extrae solo el ID del vértice (ej. '1/1/1' -> 1)
            const indicesVertices = partes.map(p => parseInt(p.split('/')[0], 10)).filter(id => !isNaN(id));

            if (indicesVertices.length < 2) continue;

            // Conecta cada vértice con su siguiente y viceversa (aristas)
            for (let i = 0; i < indicesVertices.length; i++) {
                const v1 = indicesVertices[i];
                // El módulo (%) asegura que el último se conecte con el primero (cierre del polígono)
                const v2 = indicesVertices[(i + 1) % indicesVertices.length];

                // Añadir aristas bidireccionalmente
                if (grafo.has(v1)) {
                    grafo.get(v1).add(v2);
                } else {
                    grafo.set(v1, new Set([v2]));
                }

                if (grafo.has(v2)) {
                    grafo.get(v2).add(v1);
                } else {
                    grafo.set(v2, new Set([v1]));
                }
            }
        }
    }

    return grafo;
}

function encontrarCaminoBFS(grafo, inicio, fin) {
    if (!grafo.has(inicio) || !grafo.has(fin)) {
        console.error("Vértice de inicio o destino no existe en el grafo.");
        return [];
    }

    // Cola para BFS. Almacena objetos {vertice: number, camino: number[]}
    const cola = [{ vertice: inicio, camino: [inicio] }];
    const visitados = new Set([inicio]);

    while (cola.length > 0) {
        const { vertice, camino } = cola.shift(); // Saca el primer elemento (FIFO)

        if (vertice === fin) {
            // ¡Camino encontrado! Retorna la lista de vértices.
            return camino;
        }

        const vecinos = grafo.get(vertice) || new Set();

        for (const vecino of vecinos) {
            if (!visitados.has(vecino)) {
                visitados.add(vecino);
                // Crea un nuevo camino extendiendo el actual
                const nuevoCamino = [...camino, vecino];
                cola.push({ vertice: vecino, camino: nuevoCamino });
            }
        }
    }

    // Si la cola se vacía sin encontrar el destino
    return [];
}



function parseOBJ(text) {
    // because indices are base 1 let's just fill in the 0th data
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];
    const objColors = [[0, 0, 0]];

    // same order as `f` indices
    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
        objColors,
    ];

    // same order as `f` indices
    let webglVertexData = [
        [],   // positions
        [],   // texcoords
        [],   // normals
        [],   // colors
    ];

    const materialLibs = [];
    const geometries = [];
    let geometry;
    let groups = ['default'];
    let material = 'default';
    let object = 'default';

    const noop = () => { };

    function newGeometry() {
        // If there is an existing geometry and it's
        // not empty then start a new one.
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            const position = [];
            const texcoord = [];
            const normal = [];
            const color = [];
            webglVertexData = [
                position,
                texcoord,
                normal,
                color,
            ];
            geometry = {
                object,
                groups,
                material,
                data: {
                    position,
                    texcoord,
                    normal,
                    color,
                },
            };
            geometries.push(geometry);
        }
    }

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
            // if this is the position index (index 0) and we parsed
            // vertex colors then copy the vertex colors to the webgl vertex color data
            if (i === 0 && objColors.length > 1) {
                geometry.data.color.push(...objColors[index]);
            }
        });
    }

    const keywords = {
        v(parts) {
            // if there are more than 3 values here they are vertex colors
            if (parts.length > 3) {
                objPositions.push(parts.slice(0, 3).map(parseFloat));
                objColors.push(parts.slice(3).map(parseFloat));
            } else {
                objPositions.push(parts.map(parseFloat));
            }
        },
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {
            // should check for missing v and extra w?
            objTexcoords.push(parts.map(parseFloat));
        },
        f(parts) {
            setGeometry();
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
        s: noop,    // smoothing group
        mtllib(parts, unparsedArgs) {
            // the spec says there can be multiple filenames here
            // but many exist with spaces in a single filename
            materialLibs.push(unparsedArgs);
        },
        usemtl(parts, unparsedArgs) {
            material = unparsedArgs;
            newGeometry();
        },
        g(parts) {
            groups = parts;
            newGeometry();
        },
        o(parts, unparsedArgs) {
            object = unparsedArgs;
            newGeometry();
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    // remove any arrays that have no entries.
    for (const geometry of geometries) {
        geometry.data = Object.fromEntries(
            Object.entries(geometry.data).filter(([, array]) => array.length > 0));
    }

    return {
        geometries,
        materialLibs,
    };
}

function parseMapArgs(unparsedArgs) {
    // TODO: handle options
    return unparsedArgs;
}

function parseMTL(text) {
    const materials = {};
    let material;

    const keywords = {
        newmtl(parts, unparsedArgs) {
            material = {};
            materials[unparsedArgs] = material;
        },
        /* eslint brace-style:0 */
        Ns(parts) { material.shininess = parseFloat(parts[0]); },
        Ka(parts) { material.ambient = parts.map(parseFloat); },
        Kd(parts) { material.diffuse = parts.map(parseFloat); },
        Ks(parts) { material.specular = parts.map(parseFloat); },
        Ke(parts) { material.emissive = parts.map(parseFloat); },
        map_Kd(parts, unparsedArgs) { material.diffuseMap = parseMapArgs(unparsedArgs); },
        map_Ns(parts, unparsedArgs) { material.specularMap = parseMapArgs(unparsedArgs); },
        map_Bump(parts, unparsedArgs) { material.normalMap = parseMapArgs(unparsedArgs); },
        Ni(parts) { material.opticalDensity = parseFloat(parts[0]); },
        d(parts) { material.opacity = parseFloat(parts[0]); },
        illum(parts) { material.illum = parseInt(parts[0]); },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    return materials;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function create1PixelTexture(gl, pixel) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(pixel));
    return texture;
}

function createTexture(gl, url) {
    const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
    // Asynchronously load an image
    const image = new Image();
    requestCORSIfNotSameOrigin(image, url)
    image.src = url;
    image.addEventListener('load', function () {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Check if the image is a power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });
    return texture;
}


function extraerPosicionesOriginales(text) {
    const posiciones = [[0, 0, 0]]; //
    const lineas = text.split('\n');

    for (const linea of lineas) {
        if (linea.startsWith('v ')) {
            const partes = linea.trim().split(/\s+/).slice(1);
            const pos = partes.slice(0, 3).map(parseFloat);
            posiciones.push(pos);
        }
    }

    return posiciones;
}

// calcula la orientacion de los planos de cada cara
function vec3_sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function vec3_dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function vec3_cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function vec3_length(a) { return Math.hypot(a[0], a[1], a[2]); }
function vec3_normalize(a) { const l = vec3_length(a) || 1.0; return [a[0] / l, a[1] / l, a[2] / l]; }

//* calculo de la inclinacion de cada una de las caras
function quatFromUnitVectors(vFrom, vTo) {
    const EPS = 1e-6;
    const r = vec3_dot(vFrom, vTo) + 1;
    if (r < EPS) {
        // 180 degrees: pick an orthogonal axis
        let axis = Math.abs(vFrom[0]) > Math.abs(vFrom[2]) ? [-vFrom[1], vFrom[0], 0] : [0, -vFrom[2], vFrom[1]];
        axis = vec3_normalize(axis);
        return [axis[0], axis[1], axis[2], 0]; // x,y,z,w
    } else {
        const cross = vec3_cross(vFrom, vTo);
        const q = [cross[0], cross[1], cross[2], r];
        const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1.0;
        return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
    }
}

function quatToMat4(q) {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    // column-major order
    return [
        1 - (yy + zz), xy + wz, xz - wy, 0,
        xy - wz, 1 - (xx + zz), yz + wx, 0,
        xz + wy, yz - wx, 1 - (xx + yy), 0,
        0, 0, 0, 1
    ];
}

/**
 * Cuenta los triángulos en el OBJ, calcula el punto medio de cada triángulo
 * y además devuelve la normal de cada triángulo para orientar instancias.
 */
function contarTriangulosYPuntosMedios(contenidoObj) {
    const posiciones = extraerPosicionesOriginales(contenidoObj); // base 1, posiciones[0] dummy
    const lineas = contenidoObj.split('\n');

    const midpoints = [];
    const normals = [];
    let triangleCount = 0;

    for (const linea of lineas) {
        if (!linea.startsWith('f ')) continue;

        const partes = linea.trim().split(/\s+/).slice(1);
        // Extrae solo el ID del vértice (ej. '1/1/1' -> 1)
        const indices = partes.map(p => {
            const raw = parseInt(p.split('/')[0], 10);
            return raw;
        }).filter(i => !isNaN(i));

        if (indices.length < 3) continue;

        // Triangulación en fan: (0,1,2),(0,2,3),...
        const nTriangles = indices.length - 2;
        for (let t = 0; t < nTriangles; ++t) {
            const idxs = [
                indices[0],
                indices[t + 1],
                indices[t + 2],
            ].map(idx => {
                // manejar índices negativos: en OBJ -1 es el último vértice declarado
                if (idx < 0) {
                    return posiciones.length + idx; // posiciones incluye dummy en [0]
                }
                return idx;
            });

            const v0 = posiciones[idxs[0]] || [0, 0, 0];
            const v1 = posiciones[idxs[1]] || [0, 0, 0];
            const v2 = posiciones[idxs[2]] || [0, 0, 0];

            const mx = (v0[0] + v1[0] + v2[0]) / 3;
            const my = (v0[1] + v1[1] + v2[1]) / 3;
            const mz = (v0[2] + v1[2] + v2[2]) / 3;

            // normal: cross(v1-v0, v2-v0)
            const e1 = vec3_sub(v1, v0);
            const e2 = vec3_sub(v2, v0);
            let n = vec3_cross(e1, e2);
            n = vec3_normalize(n);

            midpoints.push([mx, my, mz]);
            normals.push(n);
            triangleCount++;
        }
    }

    return {
        count: triangleCount,
        midpoints,
        normals,
    };
}

async function main() {

    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }
    //gl.clearColor(0, 1, 1);
    const vs = `
  attribute vec4 a_position;
  attribute vec3 a_normal;
  attribute vec2 a_texcoord;
  attribute vec4 a_color;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;
  uniform vec3 u_viewWorldPosition;

  varying vec3 v_normal;
  varying vec3 v_surfaceToView;
  varying vec2 v_texcoord;
  varying vec4 v_color;

  void main() {
    vec4 worldPosition = u_world * a_position;
    gl_Position = u_projection * u_view * worldPosition;
    v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
    v_normal = mat3(u_world) * a_normal;
    v_texcoord = a_texcoord;
    v_color = a_color;
  }
  `;

    const fs = `
  precision highp float;

  varying vec3 v_normal;
  varying vec3 v_surfaceToView;
  varying vec2 v_texcoord;
  varying vec4 v_color;

  uniform vec3 diffuse;
  uniform sampler2D diffuseMap;
  uniform vec3 ambient;
  uniform vec3 emissive;
  uniform vec3 specular;
  uniform float shininess;
  uniform float opacity;
  uniform vec3 u_lightDirection;
  uniform vec3 u_ambientLight;

  void main () {
    vec3 normal = normalize(v_normal);

    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

    vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
    vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
    float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

    gl_FragColor = vec4(
        emissive +
        ambient * u_ambientLight +
        effectiveDiffuse * fakeLight +
        specular * pow(specularLight, shininess),
        effectiveOpacity);
  }
  `;


    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

    const objHref = 'sphere.obj'

    const response = await fetch(objHref);
    const text = await response.text();
    const obj = parseOBJ(text);
    const baseHref = new URL(objHref, window.location.href);
    const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
        const matHref = new URL(filename, baseHref).href;
        const response = await fetch(matHref);
        return await response.text();
    }));

    // CARGAR el objeto "pincho" y sus materiales/texturas
    const pinchoHref = 'pincho.obj';
    const responsePincho = await fetch(pinchoHref);
    const textPincho = await responsePincho.text();
    const objPincho = parseOBJ(textPincho);
    const baseHrefPincho = new URL(pinchoHref, window.location.href);
    const matTextsPincho = await Promise.all(objPincho.materialLibs.map(async filename => {
        const matHref = new URL(filename, baseHrefPincho).href;
        const resp = await fetch(matHref);
        return await resp.text();
    }));

    // Contamos triángulos y calculamos puntos medios
    const resultado = contarTriangulosYPuntosMedios(text);
    console.log('Cantidad de triángulos:', resultado.count);
    console.log('Puntos medios de cada triángulo (array de [x,y,z]):', resultado.midpoints);

    const posicionesOriginales = extraerPosicionesOriginales(text);

    const materials = parseMTL(matTexts.join('\n'));
    const materialsPincho = parseMTL(matTextsPincho.join('\n'));

    const textures = {
        defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
    };

    for (const material of Object.values(materials)) {
        Object.entries(material)
            .filter(([key]) => key.endsWith('Map'))
            .forEach(([key, filename]) => {
                let texture = textures[filename];
                if (!texture) {
                    const textureHref = new URL(filename, baseHref).href;
                    texture = createTexture(gl, textureHref);
                    textures[filename] = texture;
                }
                material[key] = texture;
            });
    }

    for (const material of Object.values(materialsPincho)) {
        Object.entries(material)
            .filter(([key]) => key.endsWith('Map'))
            .forEach(([key, filename]) => {
                let texture = textures[filename];
                if (!texture) {
                    const textureHref = new URL(filename, baseHrefPincho).href;
                    texture = createTexture(gl, textureHref);
                    textures[filename] = texture;
                }
                material[key] = texture;
            });
    }

    const defaultMaterial = {
        diffuse: [1, 1, 1],
        diffuseMap: textures.defaultWhite,
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        shininess: 400,
        opacity: 1,
    };

    const parts = obj.geometries.map(({ material, data }) => {
        if (data.color) {
            if (data.position.length === data.color.length) {
                data.color = { numComponents: 3, data: data.color };
            }
        } else {
            data.color = { value: [1, 1, 1, 1] };
        }

        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
        return {
            material: {
                ...defaultMaterial,
                ...materials[material],
            },
            bufferInfo,
        };
    });

    // partes del pincho (para instanciarlas en cada punto medio)
    const pinchoParts = objPincho.geometries.map(({ material, data }) => {
        if (data.color) {
            if (data.position.length === data.color.length) {
                data.color = { numComponents: 3, data: data.color };
            }
        } else {
            data.color = { value: [1, 1, 1, 1] };
        }

        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
        return {
            material: {
                ...defaultMaterial,
                ...materialsPincho[material],
            },
            bufferInfo,
        };
    });

    function getExtents(positions) {
        const min = positions.slice(0, 3);
        const max = positions.slice(0, 3);
        for (let i = 3; i < positions.length; i += 3) {
            for (let j = 0; j < 3; ++j) {
                const v = positions[i + j];
                min[j] = Math.min(v, min[j]);
                max[j] = Math.max(v, max[j]);
            }
        }
        return { min, max };
    }

    function getGeometriesExtents(geometries) {
        return geometries.reduce(({ min, max }, { data }) => {
            const minMax = getExtents(data.position);
            return {
                min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
                max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
            };
        }, {
            min: Array(3).fill(Number.POSITIVE_INFINITY),
            max: Array(3).fill(Number.NEGATIVE_INFINITY),
        });
    }

    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    const objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);
    const cameraTarget = objOffset;
    const radius = m4.length(range) * 1.2;
    const cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius,
    ]);

    const zNear = radius / 100;
    const zFar = radius * 3;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    function render(time) {
        time *= 0.001;  // convert to seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);


        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        const up = [0, 1, 0];
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);
        const view = m4.inverse(camera);

        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 3, 5]),
            u_view: view,
            u_projection: projection,
            u_viewWorldPosition: cameraPosition,
        };

        gl.useProgram(meshProgramInfo.program);
        webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

        // Mundo base para el objeto principal
        let u_world = m4.identity();
        u_world = m4.translate(u_world, ...objOffset)
        //u_world = m4.yRotate(u_world, time * -.5)
        u_world = m4.scale(u_world, 1, 1, 1);

        // Dibujar objeto principal
        for (const { bufferInfo, material } of parts) {
            webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
            webglUtils.setUniforms(meshProgramInfo, {
                u_world,
            }, material);
            webglUtils.drawBufferInfo(gl, bufferInfo);
        }

        // Dibujar una instancia del pincho en cada punto medio
        // Usamos la misma transformación base (objOffset) y luego trasladamos por el punto medio.
        for (let i = 0; i < resultado.midpoints.length; ++i) {
            const midpoint = resultado.midpoints[i];
            const normal = resultado.normals[i] || [0, 1, 0];

            // construir rotación que alinee el eje local Y (0,1,0) con la normal de la cara
            const from = [0, 1, 0];
            const to = vec3_normalize(normal);
            const q = quatFromUnitVectors(from, to);
            const rotMat = quatToMat4(q);

            let pinchoWorld = m4.identity();
            pinchoWorld = m4.translate(pinchoWorld, ...objOffset); // centrar como el objeto
            pinchoWorld = m4.translate(pinchoWorld, ...midpoint); // mover al punto medio (en espacio del objeto)

            pinchoWorld = m4.zRotate(pinchoWorld, time * -.02)
            pinchoWorld = m4.yRotate(pinchoWorld, time * -.02)
            pinchoWorld = m4.xRotate(pinchoWorld, time * -.02)


            // aplicar rotación (multiplicar la matriz actual por la matriz de rotación)
            pinchoWorld = m4.multiply(pinchoWorld, rotMat);

            // ajustar tamaño del pincho
            pinchoWorld = m4.scale(pinchoWorld, 0.08, 0.08, 0.08);

            for (const { bufferInfo, material } of pinchoParts) {
                webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
                webglUtils.setUniforms(meshProgramInfo, {
                    u_world: pinchoWorld,
                }, material);
                webglUtils.drawBufferInfo(gl, bufferInfo);
            }
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();


function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url, window.location.href)).origin !== window.location.origin) {
        img.crossOrigin = "";
    }
}

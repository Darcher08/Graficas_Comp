// Matriz de proyección (cómo se ve la perspectiva)
function get_projection(angle, a, zMin, zMax) {
    var ang = Math.tan((angle * .5 * Math.PI) / 180);
    return [
        0.5 / ang, 0, 0, 0,
        0, 0.5 * a / ang, 0, 0,
        0, 0, -(zMax + zMin) / (zMax - zMin), -1,
        0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
    ];
}

// Funciones de rotación
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


function cameraDepth(v_matrix, depth) {
    //Alejamiento por defecto
    v_matrix[14] = v_matrix[14] - depth
}
function cameraUp_Down(v_matrix, depth) {
    //Alejamiento por defecto
    v_matrix[13] = v_matrix[13] - depth
}
function cameraRigth_Left(v_matrix, depth) {
    //Alejamiento por defecto
    v_matrix[12] = v_matrix[12] - depth
}


class Cube {
    constructor(x = 0, y = 0, z = 0, rotX = 0, rotY = 0, rotZ = 0, scale = 1) {
        this.position = { x, y, z };
        this.rotation = { x: rotX, y: rotY, z: rotZ };
        this.scale = scale;
        this.matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    updateMatrix() {
        // Resetear matriz
        this.matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

        // Aplicar escala
        if (this.scale !== 1) {
            this.matrix[0] *= this.scale;  // X
            this.matrix[5] *= this.scale;  // Y
            this.matrix[10] *= this.scale; // Z
        }

        // Aplicar rotaciones
        if (this.rotation.x !== 0) rotateX(this.matrix, this.rotation.x);
        if (this.rotation.y !== 0) rotateY(this.matrix, this.rotation.y);
        if (this.rotation.z !== 0) rotateZ(this.matrix, this.rotation.z);

        // Aplicar traslación
        this.matrix[12] = this.position.x;
        this.matrix[13] = this.position.y;
        this.matrix[14] = this.position.z;
    }

    draw(gl, Mmatrix, indices) {
        this.updateMatrix();
        gl.uniformMatrix4fv(Mmatrix, false, this.matrix);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    // Métodos de utilidad
    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    setRotation(x, y, z) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
    }

    rotate(deltaX, deltaY, deltaZ) {
        this.rotation.x += deltaX;
        this.rotation.y += deltaY;
        this.rotation.z += deltaZ;
    }

    translate(deltaX, deltaY, deltaZ) {
        this.position.x += deltaX;
        this.position.y += deltaY;
        this.position.z += deltaZ;
    }
}

export {
    get_projection,
    rotateX,
    rotateY,
    rotateZ,
    cameraDepth,
    cameraRigth_Left,
    cameraUp_Down,
    Cube


};
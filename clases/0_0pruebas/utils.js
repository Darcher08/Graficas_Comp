class Cube {
    constructor(x, y, z, rotX, rotY, rotZ, scale) {
        this.position = [x, y, z];
        this.rotation = [rotX, rotY, rotZ];
        this.scale = scale;
    }

    setPosition(x, y, z) {
        this.position = [x, y, z];
    }

    rotate(rx, ry, rz) {
        this.rotation[0] += rx;
        this.rotation[1] += ry;
        this.rotation[2] += rz;
    }

    draw(gl, MVmatrixLocation, indices, viewMatrix) {
        // Crear matriz modelo
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.rotateX(modelMatrix, modelMatrix, this.rotation[0]);
        mat4.rotateY(modelMatrix, modelMatrix, this.rotation[1]);
        mat4.rotateZ(modelMatrix, modelMatrix, this.rotation[2]);
        mat4.scale(modelMatrix, modelMatrix, [this.scale, this.scale, this.scale]);

        // Combinar con la matriz de vista
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

        // Enviar al shader
        gl.uniformMatrix4fv(MVmatrixLocation, false, modelViewMatrix);

        // Dibujar el cubo
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
}


export {
    Cube
};
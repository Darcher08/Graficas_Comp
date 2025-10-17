// plantGenerator.js - CÓDIGO CORREGIDO
import * as THREE from 'three';

export class PlantGenerator {
    constructor(params) {
        this.params = params;
        this.trunkMaterial = new THREE.MeshStandardMaterial({ color: params.color, roughness: 0.8, metalness: 0.1 });
        this.leafMaterial = new THREE.MeshStandardMaterial({ color: params.leafColor, side: THREE.DoubleSide, roughness: 0.5 });
    }

    // Genera la cadena del L-System
    generateLSystemString() {
        let currentString = this.params.axiom;
        for (let i = 0; i < this.params.iterations; i++) {
            let nextString = "";
            for (const char of currentString) {
                // Las reglas deben estar en el objeto 'rules'
                nextString += this.params.rules[char] ? this.params.rules[char] : char;
            }
            currentString = nextString;
        }
        return currentString;
    }

    // Dibuja la planta interpretando la cadena y devolviendo una única geometría
    generatePlantGeometry() {
        const lSystemString = this.generateLSystemString();

        const branchGeometries = [];
        const leafPositions = [];
        const leafScales = [];
        const leafRotations = [];

        // Estado de la "tortuga" y stack para ramificaciones
        const state = {
            position: new THREE.Vector3(0, 0, 0),
            orientation: new THREE.Quaternion(),
            length: this.params.initialLength,
            thickness: this.params.thickness
        };
        const stack = [];
        const angleRad = THREE.MathUtils.degToRad(this.params.angle);

        for (const char of lSystemString) {
            switch (char) {
                case 'F': // Avanzar y dibujar una rama
                    const startPos = state.position.clone();

                    const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(state.orientation);
                    const endPos = startPos.clone().add(direction.multiplyScalar(state.length));

                    // AÑADIDO: Mover la creación de la geometría al final de la rama
                    branchGeometries.push(this._createCylinderGeometry(startPos, endPos, state.thickness, state.thickness * this.params.lengthFactor));

                    state.position.copy(endPos);
                    state.length *= this.params.lengthFactor;
                    state.thickness *= this.params.lengthFactor;

                    // Añadir hojas aleatoriamente
                    if (Math.random() < this.params.leafDensity && state.length < this.params.initialLength * 0.3) {
                        leafPositions.push(state.position.clone());
                        leafScales.push(Math.random() * 0.5 + 0.5);
                        leafRotations.push(state.orientation.clone());
                    }

                    break;

                case '+': // Girar derecha
                    state.orientation.premultiply(new THREE.Quaternion().setFromAxisAngle(
                        new THREE.Vector3(0, 0, 1).applyQuaternion(state.orientation), angleRad
                    ));
                    break;

                case '-': // Girar izquierda
                    state.orientation.premultiply(new THREE.Quaternion().setFromAxisAngle(
                        new THREE.Vector3(0, 0, 1).applyQuaternion(state.orientation), -angleRad
                    ));
                    break;

                case '[': // Guardar estado
                    stack.push({
                        position: state.position.clone(),
                        orientation: state.orientation.clone(),
                        length: state.length,
                        thickness: state.thickness
                    });
                    break;

                case ']': // Restaurar estado
                    const savedState = stack.pop();
                    if (savedState) {
                        state.position.copy(savedState.position);
                        state.orientation.copy(savedState.orientation);
                        state.length = savedState.length;
                        state.thickness = savedState.thickness;
                    }
                    break;
            }
        }

        // Fusión de geometrías usando el módulo importado:
        const mergedBranchGeometry = branchGeometries.length > 0
            ? THREE.BufferGeometryUtils.mergeGeometries(branchGeometries) // <--- CAMBIO AQUÍ
            : new THREE.BufferGeometry();

        // Centrar la geometría de la planta
        if (mergedBranchGeometry.attributes.position) {
            mergedBranchGeometry.computeBoundingBox();
            const bbox = mergedBranchGeometry.boundingBox;
            // Solo ajustar si el bbox es válido (si hay geometría)
            if (bbox.min.y !== Infinity) {
                mergedBranchGeometry.translate(-bbox.min.x, -bbox.min.y, -bbox.min.z); // Mover la base a Y=0
            }
        }

        return {
            branchGeometry: mergedBranchGeometry,
            leafData: { positions: leafPositions, scales: leafScales, rotations: leafRotations }
        };
    }

    // Crea una geometría de cilindro entre dos puntos
    _createCylinderGeometry(start, end, radiusTop, radiusBottom) {
        const length = start.distanceTo(end);
        // Usamos un radio mínimo para evitar errores de geometría si el grosor se reduce a cero
        const top = Math.max(radiusTop, 0.01);
        const bottom = Math.max(radiusBottom, 0.01);

        const cylinderGeom = new THREE.CylinderGeometry(top, bottom, length, 8, 1, false);

        const mesh = new THREE.Mesh(cylinderGeom);
        mesh.position.lerpVectors(start, end, 0.5);

        const direction = new THREE.Vector3().subVectors(end, start);
        const axis = new THREE.Vector3(0, 1, 0);
        mesh.quaternion.setFromUnitVectors(axis, direction.normalize());

        mesh.updateMatrix();

        const geom = mesh.geometry.clone();
        geom.applyMatrix4(mesh.matrix);
        return geom;
    }
}
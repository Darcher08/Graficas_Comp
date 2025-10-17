import networkx as nx
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.animation as animation
import random

# --- 1. Configuración de la simulación ---
num_nodes = 15
num_iterations = 100
decay_rate = 0.05   # Tasa de decaimiento de la conductividad
flow_amount = 0.1   # Cantidad de "flujo" en cada iteración
reinforce_factor = 0.1 # Cuánto se refuerza una arista con flujo

# --- 2. Creación del grafo inicial ---
G = nx.Graph()
for i in range(num_nodes):
    G.add_node(i)

# Añadir aristas aleatorias con conductividad inicial baja
# Cada arista tiene un atributo 'conductivity'
initial_conductivity = 0.1
for i in range(num_nodes):
    for j in range(i + 1, num_nodes):
        if random.random() > 0.7: # Probabilidad de añadir una arista
            G.add_edge(i, j, conductivity=initial_conductivity)

# --- 3. Generar posiciones 3D para los nodos ---
pos = nx.spring_layout(G, dim=3, seed=42) # Usamos un seed para posiciones consistentes

# --- 4. Preparación de la figura 3D para la animación ---
fig = plt.figure(figsize=(12, 9))
ax = fig.add_subplot(111, projection='3d')
title = ax.set_title("Simulación de Physarum - Iteración 0", fontsize=16)

# Diccionario para almacenar las líneas de las aristas
edge_lines = {}

# Dibujar nodos iniciales
for node_id, coords in pos.items():
    ax.scatter(coords[0], coords[1], coords[2], s=150, c='skyblue', edgecolors='k', alpha=0.9)
    # Etiquetar nodos
    # ax.text(coords[0], coords[1], coords[2], str(node_id), color='black', fontsize=8)


# Dibujar aristas iniciales (serán actualizadas en la animación)
for u, v, data in G.edges(data=True):
    x = [pos[u][0], pos[v][0]]
    y = [pos[u][1], pos[v][1]]
    z = [pos[u][2], pos[v][2]]
    line, = ax.plot(x, y, z, color='gray', alpha=0.3, linewidth=0.5)
    edge_lines[tuple(sorted((u, v)))] = line

ax.set_xticks([])
ax.set_yticks([])
ax.set_zticks([])

# --- 5. Función de actualización para la animación ---
def update(frame):
    current_iteration = frame + 1
    title.set_text(f"Simulación de Physarum - Iteración {current_iteration}")

    # Seleccionar un par aleatorio de origen y destino para simular el "flujo"
    source = random.randint(0, num_nodes - 1)
    target = random.randint(0, num_nodes - 1)
    while source == target: # Asegurarse de que no sea el mismo nodo
        target = random.randint(0, num_nodes - 1)

    # Decaimiento de la conductividad para todas las aristas
    for u, v, data in G.edges(data=True):
        data['conductivity'] = max(0.01, data['conductivity'] * (1 - decay_rate)) # Evitar conductividad cero

    # Simular el flujo y reforzar caminos
    # En una simulación real de Physarum, esto implicaría resolver un sistema de ecuaciones
    # para el flujo. Aquí, lo simplificamos a encontrar un camino y reforzarlo.
    try:
        # Encontrar el camino más corto basado en la "resistencia" (inverso de conductividad)
        # Esto imita que el flujo prefiere caminos de menor resistencia.
        path = nx.shortest_path(G, source=source, target=target, weight=lambda u, v, d: 1/d['conductivity'])

        # Reforzar la conductividad de las aristas en el camino encontrado
        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            edge_data = G.get_edge_data(u, v)
            edge_data['conductivity'] += flow_amount * reinforce_factor # Aumentar conductividad

    except nx.NetworkXNoPath:
        # Si no hay camino (grafo desconectado), simplemente decaen
        pass

    # Actualizar la visualización de las aristas
    max_current_conductivity = max([data['conductivity'] for u, v, data in G.edges(data=True)], default=1.0)
    if max_current_conductivity == 0:
        max_current_conductivity = 1.0 # Evitar división por cero

    for u, v, data in G.edges(data=True):
        edge_tuple = tuple(sorted((u, v)))
        line = edge_lines[edge_tuple]
        current_conductivity = data['conductivity']

        # Normalizar para el color y el grosor
        normalized_conductivity = current_conductivity / max_current_conductivity

        # Color: De gris (baja cond.) a rojo (alta cond.)
        color_val = 0.3 + 0.7 * normalized_conductivity # Ajusta el rango de color
        line.set_color((color_val, 0.2, 0.2)) # Más rojo cuanto mayor conductividad
        line.set_alpha(0.2 + 0.8 * normalized_conductivity) # Más opaco cuanto mayor conductividad
        line.set_linewidth(0.5 + 4 * normalized_conductivity) # Más grueso cuanto mayor conductividad

    return edge_lines.values() # Retorna los artistas actualizados para la animación

# --- 6. Iniciar la animación ---
# 'interval' es el tiempo en ms entre cada frame
ani = animation.FuncAnimation(fig, update, frames=num_iterations, interval=100, blit=False, repeat=False)

plt.show()
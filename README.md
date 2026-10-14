# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye un power-up de velocidad que duplica el impulso de la nave durante 5 segundos. Un ovni enemigo aparece periódicamente y dispara proyectiles contra la nave; el escudo (`Shift`) otorga 3 segundos de protección total con 10 segundos de recarga.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción                  |
| --------- | ----------------------- |
| `←` `→`   | Rotar nave              |
| `↑`       | Propulsar               |
| `Espacio` | Disparar                |
| `C`       | Cambiar skin de la nave |
| `Shift`   | Escudo                  |

## Puntuación

| Asteroide      | Puntos |
| -------------- | ------ |
| Grande         | 20     |
| Mediano        | 50     |
| Pequeño        | 100    |
| Estrella fugaz | 250    |
| Ovni           | 200    |

Con la nave Titán (morada) todos los puntos se duplican.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad: los asteroides destruidos pueden soltar un rayo amarillo que duplica el impulso de la nave durante 5 segundos
- Estrella fugaz: cada 10-15 s cruza la pantalla una estrella dorada mucho más rápida que los asteroides; se desvanece a los 7 s y destruirla otorga 250 puntos bonus
- Triple disparo: destruirla estrella fugaz activa 5 s de disparo triple (3 balas paralelas en línea recta)
- Sistema de skins: la tecla `C` rota entre 5 naves (Clásica, Interceptor, Halcón, Espectro y Titán), cada una con su propia silueta y colores; la elección se guarda en `localStorage` y los iconos de vidas reflejan la skin activa
- Nave Titán (morada): el doble de grande que la nave original (también su casco, escudo y radio de colisión); al pilotarla, todos los puntos obtenidos se duplican
- Ovni enemigo: cada 12-20 s cruza la pantalla un ovni rojo que dispara proyectiles a la nave; destruirlo otorga 200 puntos
- Escudo: `Shift` activa 3 s de escudo que bloquea proyectiles enemigos y colisiones con asteroides u ovni, con 10 s de recarga (se muestra en el HUD)

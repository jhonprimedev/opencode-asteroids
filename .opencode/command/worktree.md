---
description: Crea un git worktree en .worktrees/ a partir del nombre dado como argumento.
---

Crea un git worktree con estas reglas:

1. Toma el nombre del worktree de: $ARGUMENTS
2. Normaliza el nombre:
   - Todo en minúsculas
   - Espacios y guiones bajos se convierten en guiones (-)
   - Sin acentos ni caracteres especiales (solo letras, números y guiones)
   - Si queda largo (>4 palabras o ~30 caracteres), simplifícalo
     eliminando palabras vacías ("de", "del", "la", "el", "con", "para",
     "the", "a") y conservando solo las 3-4 palabras clave
     (ej: "Fix del bug de colisiones del OVNI" -> "bug-colisiones-ovni")
3. Ejecuta: git worktree add .worktrees/<nombre-normalizado>
4. Reporta la ruta del worktree creado y la rama que git le asoció
   (git crea la rama con el mismo nombre del directorio automáticamente).

No hagas commits ni ningún otro cambio en el repositorio.

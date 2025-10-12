# Triggers de Base de Datos en "¿Cuánto Cuesta?"

Este backend utiliza **triggers** en PostgreSQL para mantener actualizado automáticamente el campo `precio_total` de cada receta, según los cambios en ingredientes y materias primas. Los triggers aseguran la coherencia de los datos y evitan errores manuales en el cálculo de precios.

## ¿Qué es un trigger?

Un **trigger** es un mecanismo de la base de datos que ejecuta una función automáticamente cuando ocurre un evento específico (INSERT, UPDATE, DELETE) sobre una tabla.

## Triggers implementados

A continuación se describen los triggers utilizados en este proyecto:

### 1. Actualizar precio al cambiar el precio de una materia prima

- **Archivo:** `001_create_trigger_update_precio.js`
- **Función:** Cuando se modifica el `precio_unitario` de una materia prima, recalcula el `precio_total` de todas las recetas que la utilizan.

### 2. Actualizar precio al modificar un ingrediente

- **Archivo:** `002_trigger_update_precio_ingrediente.js`
- **Función:** Cuando se actualiza un ingrediente (cantidad usada, materia prima asociada o receta), recalcula el `precio_total` de la receta correspondiente.

### 3. Actualizar precio al eliminar un ingrediente

- **Archivo:** `003_trigger_delete_ingrediente.js`
- **Función:** Cuando se elimina un ingrediente de una receta, recalcula el `precio_total` de esa receta. Si la receta queda sin ingredientes, su precio se establece en 0.

### 4. Actualizar precio al agregar un ingrediente

- **Archivo:** `004_trigger_insert_ingrediente.js`
- **Función:** Cuando se agrega un nuevo ingrediente a una receta, recalcula el `precio_total` de esa receta.

### 5. Actualizar precio al eliminar una materia prima

- **Archivo:** `005_trigger_delete_materia_prima.js`
- **Función:** Cuando se elimina una materia prima, recalcula el `precio_total` de todas las recetas que la usaban, luego de que se borren sus ingredientes por ON DELETE CASCADE.

## ¿Por qué usar triggers?

- **Automatización:** Los precios de las recetas se actualizan automáticamente ante cualquier cambio relevante.
- **Consistencia:** Se evita que los datos queden desactualizados o inconsistentes.
- **Mantenimiento sencillo:** La lógica de actualización de precios está centralizada en la base de datos.

---

**Nota:** Los triggers se crean y actualizan automáticamente al iniciar la aplicación, gracias a las funciones definidas en los archivos mencionados.

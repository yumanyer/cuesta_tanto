  import { fetchWithAuth, cargarUsuario, showToast } from "./services/api.js";
  import { IngredienteTemplate } from "./services/template.js";

  // 🎯 CARGA DE USUARIO
  cargarUsuario();

  // 🎯 LOGOUT
const userDropdown = document.getElementById('userDropdown');
const dialog = document.querySelector('dialog');
const logoutForm = document.querySelector('.logout-form');
const audio = document.getElementById("audio");



userDropdown.addEventListener('click', (e) => {
    dialog.showModal();
});

logoutForm.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.value) {
        e.preventDefault();
        
        if (e.target.value === 'yes') {
            
            // Intenta reproducir directamente
            audio.currentTime = 0;
            audio.play()

            // Esperar a que el audio termine
            audio.addEventListener('ended', () => {
                fetchWithAuth('/api/users/logout', {
                    method: 'POST',
                    credentials: 'include'
                })
                .then(() => {
                    window.location.href = '/pages/login.html';
                })
                .catch(error => {
                    window.location.href = '/pages/login.html';
                });
            }, { once: true });
            
        } else if (e.target.value === 'no') {
            showToast("Cancelando sesión...", "info");
            dialog.close();
        }
    }
});

  // 🎯 SIDEBAR COLLAPSE
  const sidebar = document.querySelector(".app-sidebar");
  const toggleBtn = document.getElementById('toggleBtn');
  toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

  // 🎯 INICIALIZAR TEMPLATE DE INGREDIENTES
  const listIndividual = document.getElementById("ingredientsListIndividual");
  const totalCostEl = document.getElementById("totalCostIndividual");
  const emptyStateIndividual = listIndividual.querySelector(".empty-state");

  const ingredienteManager = new IngredienteTemplate(
    listIndividual,
    totalCostEl,
    emptyStateIndividual
  );

  // GET SELECT RECETAS
  const selectReceta = document.getElementById("recipeSelect");

  async function getRecetas() {
    try {
      const res = await fetchWithAuth("/api/recetas/get");
      if (!res.ok) throw new Error("Error al cargar recetas");
      const data = await res.json();
      data.recetas.forEach(r => {
        const option = document.createElement("option");
        option.value = r.id;
        option.textContent = `${r.nombre_receta} - $${Number(r.precio_total).toFixed(2)}`;
        selectReceta.appendChild(option);
      });
    } catch (error) {
      console.error("Error cargando recetas:", error);
    }
  }
  getRecetas();
  // GET MATERIAS PRIMAS
  const selectMateriaPrima = document.getElementById("selectMateriaPrima");
  let materiasCache = [];

  async function getMaterias() {
    try {
  const res = await fetchWithAuth("/api/matterRaw/get?all=true"); 
      if (!res.ok) throw new Error("Error al cargar materias primas");
      const data = await res.json();
      materiasCache = data.producto_encontrado;
      fillSelect(selectMateriaPrima, materiasCache);
    } catch (error) {
      console.error("Error cargando materias primas:", error);
    }
  }

function fillSelect(selectElement, materias) {
  selectElement.innerHTML = "<option value=''>Seleccionar...</option>";
  materias.forEach(m => {
    const option = document.createElement("option");
    option.value = m.id;
    option.textContent = `${m.nombre_producto} (Stock: ${Number(m.stock).toFixed(2)} ${m.unidad}) - $${Number(m.precio_unitario).toFixed(2)}`;
    selectElement.appendChild(option);
  });

  // Configuración  de Select2
  $(selectMateriaPrima).select2({
    placeholder: "Seleccionar...",
    allowClear: true,
    width: '100%', 
    dropdownParent: $('.form-card'), 
    dropdownAutoWidth: false 
  });
}

  getMaterias();

  // 🎯 POST INGREDIENTES
  async function postIngredientes() {
    const ingredientes = ingredienteManager.getAggregatedIngredients(); // <-- usar método del template

    if (ingredientes.length === 0) {
      showToast("No hay ingredientes nuevos para agregar.", "error");
      return;
    }

    const body = {
      receta_id: Number(selectReceta.value),
      ingredientes: ingredientes
    };


    try {
      const res = await fetchWithAuth("/api/ingrediente/bulkCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Error al agregar ingredientes");

      showToast("Ingredientes agregados exitosamente" , "success");
     
    } catch (error) {
      throw error;
    }
  }


  const confirmBtn = document.getElementById("confirmBtn");
  confirmBtn.addEventListener("click", postIngredientes);

  // 🎯 ACTUALIZAR INGREDIENTE
  async function updateIngredient(ingredienteId, updateData) {
    if (!ingredienteId) {
      showToast("Error: ingrediente sin ID válido.", "error");
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/ingrediente/modify/${ingredienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error("Error al actualizar ingrediente");
      const data = await res.json();
            
      const ingredienteItem = document.querySelector(
        `.ingrediente-ingredient-item[data-id='${ingredienteId}']`
      )
    
      // actualizar UI
      if (ingredienteItem) {
        ingredienteItem.querySelector(".ingrediente-nombre").textContent =
          data.nombre_producto || ingredienteItem.dataset.nombre;
        ingredienteItem.querySelector(".ingrediente-cantidad").textContent =
          `${data.cantidad_usada} ${data.unidad}`;
      
        ingredienteItem.dataset.cantidad = data.cantidad_usada;
        ingredienteItem.dataset.unidad = data.unidad;
      
        ingredienteItem.classList.add("actualizado");
        setTimeout(() => ingredienteItem.classList.remove("actualizado"), 800);
      }

    
    } catch (error) {
      showToast("Error actualizando ingrediente", "error");
      console.error(error);
    }
  }

  // 🎯 ELIMINAR INGREDIENTE
  async function deleteIngrediente(ingredienteId) {
    if (!ingredienteId) {
      showToast("Error: ingrediente sin ID válido.", "error");
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/ingrediente/delete/${ingredienteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        const ingredienteItem = listIndividual.querySelector(`.ingrediente-ingredient-item[data-id='${ingredienteId}']`);
        ingredienteItem.remove();
      }
      showToast("Ingrediente eliminado exitosamente", "info");
    } catch (error) {
      throw error;
    }
    
  }

  // 🎯 CARGAR INGREDIENTES DE RECETA
  selectReceta.addEventListener("change", async () => {
    const recetaId = selectReceta.value;
    
    // Limpiar lista
    ingredienteManager.clearList();

    if (!recetaId) return;

    try {
      const res = await fetchWithAuth(`/api/recetas/detail/${recetaId}`);
      if (!res.ok) throw new Error("Error al cargar ingredientes de la receta");
      const data = await res.json();

      if (!data.ingredientes || data.ingredientes.length === 0) return;

      // Agregar ingredientes precargados usando el template
data.ingredientes.forEach(i => {
  const materia = materiasCache.find(m => m.id === i.materia_prima_id);
  const precioUnitario = materia ? parseFloat(materia.precio_unitario) : parseFloat(i.precio);

  ingredienteManager.addIngredient({
    id: i.id || i.ingrediente_id,  
    materiaPrimaId: i.materia_prima_id,  
    nombre: i.nombre_producto,
    cantidad: parseFloat(i.cantidad_usada),
    unidad: i.unidad,
    unidadBase: materia ? materia.unidad : i.unidad,
    precioUnitario: precioUnitario,
    origen: 'precargado'
  });
});

    } catch (error) {
      console.error("Error cargando receta:", error);
    }
  });

  // 🎯 AGREGAR INGREDIENTE MANUALMENTE
  document.getElementById("individualForm").addEventListener("submit", (e) => {
    e.preventDefault();

    if (!selectReceta.value) {
      showToast("Debes seleccionar una receta antes de agregar ingredientes.", "info");
      return;
    }

    const materiaId = selectMateriaPrima.value;
    const cantidad = parseFloat(document.getElementById("cantidadIndividual").value);
    const unidad = document.getElementById("unidadIndividual").value;

    if (!materiaId || !cantidad || cantidad <= 0) {
      showToast("Completa todos los campos correctamente", "error");
      return;
    }

    const materia = materiasCache.find(m => m.id == materiaId);
    if (!materia) return;

      //  VALIDACIÓN DE UNIDAD 
  if (unidad !== materia.unidad) {
    showToast(
      `No se puede agregar en ${unidad}. Esta materia prima está registrada en ${materia.unidad}.`,
      "error"
    );
    return;
  }

    // Validar stock
    if (!ingredienteManager.validateStock(materia, cantidad, unidad)) return;

    // Buscar si ya existe
    let itemExistente = ingredienteManager.findIngredient(materia.id, 'agregado');

    if (itemExistente) {
      // Actualizar cantidad existente
      const cantidadActualBase = ingredienteManager.convertirACantidadBase(
        parseFloat(itemExistente.dataset.cantidad),
        itemExistente.dataset.unidad,
        itemExistente.dataset.unidadBase
      );
      
      const nuevaCantidadBase = ingredienteManager.convertirACantidadBase(
        cantidad,
        unidad,
        itemExistente.dataset.unidadBase
      );

      const totalCantidadBase = cantidadActualBase + nuevaCantidadBase;
      const totalCantidadUsuario = totalCantidadBase / ingredienteManager.convertirACantidadBase(
        1,
        itemExistente.dataset.unidad,
        itemExistente.dataset.unidadBase
      );

      ingredienteManager.updateIngredient(
        itemExistente,
        totalCantidadUsuario,
        itemExistente.dataset.unidad
      );
    } else {
      // Agregar nuevo ingrediente
      ingredienteManager.addIngredient({
        id: materia.id,
        nombre: materia.nombre_producto,
        cantidad: cantidad,
        unidad: unidad,
        unidadBase: materia.unidad,
        precioUnitario: parseFloat(materia.precio_unitario),
        origen: 'agregado'
      });
    }

    // Reset form
    e.target.reset();
  });

  //MODALES
  function renderIngrediente(ingrediente) {
    const tpl = document.getElementById("tpl-ingrediente");
    const clone = tpl.content.cloneNode(true);
    const item = clone.querySelector(".ingrediente-ingredient-item");

    // datasets
    item.dataset.id = ingrediente.id;
    item.dataset.recetaId = ingrediente.recetaId || ingrediente.receta_id;
    item.dataset.materiaPrimaId = ingrediente.materiaPrimaId ?? ingrediente.materia_prima_id;
    item.dataset.cantidad = ingrediente.cantidad;
    item.dataset.unidad = ingrediente.unidad;
    item.dataset.nombre = ingrediente.nombre;

    // visual: dos spans separados
    const nombreSpan = item.querySelector(".ingrediente-nombre");
    const cantidadSpan = item.querySelector(".ingrediente-cantidad");

    if (nombreSpan) nombreSpan.textContent = ingrediente.nombre;
    if (cantidadSpan) cantidadSpan.textContent = `${ingrediente.cantidad} ${ingrediente.unidad}`;

    // Label de origen (opcional)
    const label = item.querySelector(".ingrediente-label");
    if (label) label.textContent = ingrediente.origen === "precargado" ? "(Precargado)" : "(Agregado)";

    return item;
  }
  // Abre modal con datos
  function openEditModal(ingredienteItem) {
    const tpl = document.getElementById("editModalTemplate");
    const clone = tpl.content.cloneNode(true);
    const overlay = clone.querySelector(".modal-overlay");
    document.body.appendChild(overlay);

    const nombreInput = overlay.querySelector(".input-nombre");
    const cantidadInput = overlay.querySelector(".input-cantidad");
    const unidadSelect = overlay.querySelector(".input-unidad");
    const saveBtn = overlay.querySelector(".modal-save");

    nombreInput.value = ingredienteItem.dataset.nombre || ingredienteItem.querySelector(".ingrediente-label").textContent;
    cantidadInput.value = ingredienteItem.dataset.cantidad || "";
    unidadSelect.value = ingredienteItem.dataset.unidad || "Gramos";


    function closeModal() { overlay.remove(); }

    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    overlay.querySelector(".modal-cancel").addEventListener("click", closeModal);

saveBtn.addEventListener("click", () => {
  const ingrediente = {
    receta_id: Number(selectReceta.value),
    materia_prima_id: Number(ingredienteItem.dataset.materiaPrimaId),
    cantidad_usada: Number(cantidadInput.value),
    unidad: unidadSelect.value
  };
  updateIngredient(ingredienteItem.dataset.id, ingrediente);
  closeModal();
}, { once: true });


  }


  function openDeleteModal(ingredienteItem) {
    const tpl = document.getElementById("deleteModalTemplate");
    const clone = tpl.content.cloneNode(true);
    document.body.appendChild(clone);

    const overlay = document.querySelector(".modal-overlay");
    const nombre = ingredienteItem.querySelector(".ingrediente-nombre").textContent;

      overlay.querySelector(".ing-name").textContent = nombre;
    
      function closeModal() {
      overlay.remove();
    }
    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    overlay.querySelector(".modal-cancel").addEventListener("click", closeModal);
    overlay.querySelector(".modal-confirm").addEventListener("click", closeModal);

    overlay.querySelector(".modal-confirm").addEventListener("click",()=>deleteIngrediente(ingredienteItem.dataset.id));


  }
  // evento click en editar
document.addEventListener("click", (e) => {
  if (e.target.matches("button[data-action='edit']")) {
    const ingredienteItem = e.target.closest(".ingrediente-ingredient-item");
    openEditModal(ingredienteItem);
  }
  if (e.target.matches("button[data-action='delete']")) {
    const ingredienteItem = e.target.closest(".ingrediente-ingredient-item");
    openDeleteModal(ingredienteItem);
  }
});
// 🎯 CONFIRMAR INGREDIENTES
confirmBtn.addEventListener("click", () => {
  const ingredientes = document.querySelectorAll(".ingrediente-ingredient-item");

  ingredientes.forEach(item => {

    // Solo actuar sobre los que eran agregados
    if (item.dataset.origen === "agregado") {
      item.dataset.origen = "precargado"; 

      item.classList.remove("agregado");
      item.classList.add("precargado");

      // Cambiar texto del label
      const label = item.querySelector(".ingrediente-label");
      if (label) {
        label.textContent = "(Precargado)";
        label.classList.remove("delete");
        label.classList.add("edit");
      }

      // Cambiar visibilidad de botones
      const editBtn = item.querySelector("[data-action='edit']");
      const deleteBtn = item.querySelector("[data-action='delete']");
      const clearBtn = item.querySelector("[data-action='clear']");

      if (editBtn) editBtn.style.display = "inline-block";
      if (deleteBtn) deleteBtn.style.display = "inline-block";
      if (clearBtn) clearBtn.style.display = "none";
    }
  });
});

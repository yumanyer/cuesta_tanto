//  IMPORTS
import { cargarUsuario, fetchWithAuth, showToast } from "./services/api.js";

//  INICIALIZACIÓN DE USUARIO
cargarUsuario();

//  SIDEBAR
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");

    function autoCollapseSidebar() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.add("collapsed");
        }else{
            sidebar.classList.remove("collapsed");
        }

    }
    window.addEventListener("resize", autoCollapseSidebar);

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


// 📋 CONTENEDORES Y TEMPLATES
const recetaTemplate = document.getElementById("recipeCardTemplate");
const recetasContainer = document.getElementById("recetasContainer");
const templateDeleteModal = document.getElementById("deleteModalTemplate");
const templateCreateModal = document.getElementById("createModalTemplate");
const btnAddRecipe = document.getElementById("btnAddRecipe");


//  FUNCIONES API
async function getRecetas() {
  try {
    const res = await fetchWithAuth("/api/recetas/get");
    if (!res.ok) throw new Error("Error al cargar recetas");

    const data = await res.json();
    recetasContainer.innerHTML = "";

    if (data.recetas?.length > 0) {
      data.recetas.forEach(renderRecetaCard);
    } else {
      recetasContainer.innerHTML = `<h1 class="no-recipes">No hay recetas disponibles.</h1>`;
    }
  } catch (error) {
    console.error(error);
    showToast("No se pudieron cargar las recetas", "error");
  }
}

async function postReceta(params) {
  try {
    const res = await fetchWithAuth("/api/recetas/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Error al crear receta");
    const nuevaReceta = await res.json();
    showToast("Receta creada correctamente", "success");

    renderRecetaCard(nuevaReceta);
  } catch (error) {
    console.error(error);
    showToast("Error al crear la receta", "error");
  }
}

async function updateReceta(idReceta, params) {
  try {
    const res = await fetchWithAuth(`/api/recetas/update/${idReceta}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Error al actualizar la receta");
    const updated = await res.json();
    showToast("Receta actualizada correctamente", "success");

    const card = document.querySelector(`.recipe-card[data-id="${idReceta}"]`);
    if (card) {
      card.querySelector(".card-title").textContent = updated.nombre_receta;
      card.querySelector(".card-description").textContent = updated.descripcion;
      const porciones = updated.porciones || 1;
      card.querySelector(".portions-value").textContent = porciones;
      const costoPorcion = (updated.precio_total / porciones).toFixed(2);
      card.querySelector(".unit-cost").textContent = `$${costoPorcion}`;
      card.querySelector(".total-cost").textContent = `$${Number(updated.precio_total).toFixed(2)}`;
    }
  } catch (error) {
    console.error(error);
    showToast("Error al actualizar la receta", "error");
  }
}

async function eliminarReceta(idReceta) {
  try {
    const res = await fetchWithAuth(`/api/recetas/delete/${idReceta}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar receta");

    const card = document.querySelector(`.recipe-card[data-id="${idReceta}"]`);
    card?.remove();

    showToast("Receta eliminada correctamente", "success");
  } catch (error) {
    console.error(error);
    showToast("Error al eliminar la receta", "error");
  }
}

async function verRecetaIngredientes(idReceta) {
  try {
    const res = await fetchWithAuth(`/api/recetas/detail/${idReceta}`);
    if (!res.ok) throw new Error("Error al obtener receta");

    const receta = await res.json();

    const template = document.getElementById("viewIngredientsModalTemplate");
    if (!template) {
      console.error("Template no encontrado");
      showToast("Error: Template no encontrado", "error");
      return;
    }

    const modal = template.content.cloneNode(true).querySelector(".modal-overlay");

    // Datos generales
    modal.querySelector(".view-nombre").textContent = receta.nombre_receta || "Sin nombre";
    modal.querySelector(".view-descripcion").textContent = receta.descripcion || "Sin descripción";
    modal.querySelector(".view-porciones").textContent = receta.porciones || 1;

    // Ingredientes
    const ul = modal.querySelector(".ingredients-items");
    ul.innerHTML = "";
    
    const ingredientes = receta.ingredientes || [];
    
    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No hay ingredientes asociados a esta receta";
      li.style.fontStyle = "italic";
      li.style.color = "#999";
      ul.appendChild(li);
    } else {
      ingredientes.forEach(ing => {
        const li = document.createElement("li");
        const nombre = ing.nombre_producto || "Sin nombre";
        const cantidad = parseFloat(ing.cantidad_usada) || 0;
        const unidad = ing.unidad || "";
        const precio = parseFloat(ing.precio) || 0;
        
        li.textContent = `${nombre} - ${cantidad} ${unidad} ($${precio.toFixed(2)})`;
        ul.appendChild(li);
      });
    }

    // Cerrar modal
    const closeBtns = modal.querySelectorAll(".modal-close, .modal-close-btn");
    closeBtns.forEach(btn => btn.addEventListener("click", () => closeModal(modal)));

    modal.addEventListener("click", e => { 
      if (e.target === modal) closeModal(modal);
    });

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

  } catch (error) {
    console.error("Error al mostrar receta:", error);
    showToast("No se pudo cargar la receta", "error");
  }
}

// RENDERIZAR TARJETA
function renderRecetaCard(receta) {
  const clone = recetaTemplate.content.cloneNode(true);
  const card = clone.querySelector(".recipe-card");
  const idReceta = receta.id;

  card.dataset.id = idReceta;
  clone.querySelector(".card-title").textContent = receta.nombre_receta || "Sin nombre";
  clone.querySelector(".card-description").textContent = receta.descripcion || "Sin descripción";

  const totalCost = Number(receta.precio_total || 0).toFixed(2);
  const porciones = receta.porciones || 1;
  const costoPorcion = (receta.precio_total / porciones).toFixed(2);

  card.querySelector(".total-cost").textContent = `$${totalCost}`;
  card.querySelector(".portions-value").textContent = porciones;
  card.querySelector(".unit-cost").textContent = `$${costoPorcion}`;

  const [btnVer, btnEditar, btnEliminar] = card.querySelectorAll(".card-btn");
  btnVer.addEventListener("click", () => verRecetaIngredientes(idReceta));
  btnEditar.addEventListener("click", () => openCreateOrEditModal(receta));
  btnEliminar.addEventListener("click", () => openDeleteModal(idReceta));

  recetasContainer.appendChild(clone);
}

//  MODALES CREAR/EDITAR
function openCreateOrEditModal(receta = null) {
  const modal = templateCreateModal.content.cloneNode(true).querySelector(".modal-overlay");
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  const nombreInput = modal.querySelector('input[name="nombre_receta"]');
  const descripcionInput = modal.querySelector('input[name="descripcion"]');
  const porcionesInput = modal.querySelector('input[name="porciones"]');

  if (receta) {
    nombreInput.value = receta.nombre_receta;
    descripcionInput.value = receta.descripcion;
    porcionesInput.value = receta.porciones;
    modal.querySelector(".modal-title-receta").textContent = "Editar Receta";
  } else {
    modal.querySelector(".modal-title-receta").textContent = "Crear Receta";
  }

  modal.querySelector(".modal-close").addEventListener("click", () => closeModal(modal));
  modal.querySelector(".modal-cancel").addEventListener("click", () => closeModal(modal));
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });

  const saveBtn = modal.querySelector(".modal-save");
  saveBtn.addEventListener("click", async () => {
    if (!nombreInput.value.trim() || !descripcionInput.value.trim() || porcionesInput.value < 1) {
      showToast("Por favor completa todos los campos correctamente", "error");
      return;
    }

    const params = {
      nombre_receta: nombreInput.value.trim(),
      descripcion: descripcionInput.value.trim(),
      porciones: Number(porcionesInput.value),
    };

    if (receta) await updateReceta(receta.id, params);
    else await postReceta(params);

    closeModal(modal);
  });
}


//  MODAL ELIMINAR
function openDeleteModal(idReceta) {
  const modal = templateDeleteModal.content.cloneNode(true).querySelector(".modal-overlay");
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";

  const recetaCard = document.querySelector(`.recipe-card[data-id="${idReceta}"]`);
  modal.querySelector(".material-name").textContent = recetaCard?.querySelector(".card-title")?.textContent || "Receta";

  modal.querySelector(".modal-close").addEventListener("click", () => closeModal(modal));
  modal.querySelector(".modal-cancel").addEventListener("click", () => closeModal(modal));
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });

  modal.querySelector(".modal-confirm").addEventListener("click", async () => {
    await eliminarReceta(idReceta);
    closeModal(modal);
  });
}

//  CERRAR MODALES
function closeModal(modal) {
  modal.remove();
  document.body.style.overflow = "auto";
}

//  BOTÓN CREAR NUEVA RECETA
btnAddRecipe?.addEventListener("click", () => openCreateOrEditModal());
toggleBtn.addEventListener("click", ()=>sidebar.classList.toggle("collapsed"));

//  INICIO
getRecetas();
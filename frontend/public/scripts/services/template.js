// 🎯 TEMPLATE OPTIMIZADO PARA INGREDIENTES
class IngredienteTemplate {
  constructor(listContainer, totalCostElement, emptyStateElement) {
    this.list = listContainer;
    this.totalCostEl = totalCostElement;
    this.emptyState = emptyStateElement;
    this.createTemplate();
  }

  createTemplate() {
    this.template = document.getElementById("tpl-ingrediente");
  }

  // Crear ingrediente desde datos
  createIngredientElement(data) {
    const { id, materiaPrimaId, nombre, cantidad, unidad, unidadBase, precioUnitario, origen = "agregado" } = data;
    const clone = this.template.content.cloneNode(true);
    const item = clone.querySelector(".ingrediente-ingredient-item");

    if (!item) {
      console.warn("El template no tiene .ingrediente-ingredient-item");
      return document.createDocumentFragment();
    }

    // datasets - USAR CAMELCASE
    Object.assign(item.dataset, {
      id,
      materiaPrimaId: materiaPrimaId || id,
      cantidad,
      unidad,
      unidadBase,
      precio_unitario: precioUnitario,
      origen,
      nombre
    });

    // Botones
    const editBtn = item.querySelector('[data-action="edit"]');
    const deleteBtn = item.querySelector('[data-action="delete"]');
    const clearBtn = item.querySelector('[data-action="clear"]');

    if (editBtn) editBtn.style.display = "inline-block";
    if (deleteBtn) deleteBtn.style.display = origen === "precargado" ? "inline-block" : "none";
    if (clearBtn) clearBtn.style.display = origen === "agregado" ? "inline-block" : "none";

    // Costo
    const cantidadBase = this.convertirACantidadBase(cantidad, unidad, unidadBase);
    const costo = (cantidadBase * precioUnitario).toFixed(2);

    // Actualizar los spans separados
    const nombreSpan = item.querySelector(".ingrediente-nombre");
    const cantidadSpan = item.querySelector(".ingrediente-cantidad");

    if (nombreSpan) nombreSpan.textContent = nombre;
    if (cantidadSpan) cantidadSpan.textContent = `${cantidad} ${unidad}`;

    // Label de origen
    const label = item.querySelector(".ingrediente-label");
    if (label) {
      label.textContent = origen === "precargado" ? "(Precargado)" : "(Agregado)";
      label.classList.add(origen === "agregado" ? "delete" : "edit");
    }

    // Costo
    const costEl = item.querySelector(".ingrediente-ingredient-cost");
    if (costEl) costEl.textContent = `$${costo}`;

    return clone;
  }

  // Agregar ingrediente
  addIngredient(data) {
    this.emptyState.style.display = "none";
    const element = this.createIngredientElement(data);
    this.list.appendChild(element);
    this.updateTotalCost();
  }

  // Eliminar uno
  removeIngredient(item) {
    item.remove();
    this.updateTotalCost();
    if (!this.list.querySelector(".ingrediente-ingredient-item")) {
      this.emptyState.style.display = "block";
    }
  }

  // Limpiar lista entera
  clearList() {
    this.list.innerHTML = "";
    this.emptyState.style.display = "block";
    this.totalCostEl.textContent = "$0.00";
  }

  // Buscar ingrediente
  findIngredient(id, origen) {
    return Array.from(this.list.children).find(
      (i) => i.dataset.id == id && i.dataset.origen === origen
    );
  }

  // Obtener ingredientes agregados
  getAggregatedIngredients() {
    return Array.from(this.list.querySelectorAll(".ingrediente-ingredient-item"))
      .filter((i) => i.dataset.origen === "agregado")
      .map((i) => ({
        materia_prima_id: Number(i.dataset.materiaPrimaId),
        cantidad_usada: Number(i.dataset.cantidad),
        unidad: i.dataset.unidad,
      }));
  }

  // Actualizar total
  updateTotalCost() {
    let total = 0;
    this.list.querySelectorAll(".ingrediente-ingredient-item").forEach((item) => {
      const cantidad = parseFloat(item.dataset.cantidad);
      const unidad = item.dataset.unidad;
      const unidadBase = item.dataset.unidadBase;
      const precioUnitario = parseFloat(item.dataset.precio_unitario);

      const cantidadBase = this.convertirACantidadBase(cantidad, unidad, unidadBase);
      total += cantidadBase * precioUnitario;
    });

    this.totalCostEl.textContent = `$${total.toFixed(2)}`;
  }

  // Actualizar un ingrediente puntual
  updateIngredient(item, nuevaCantidad, unidad) {
    item.dataset.cantidad = nuevaCantidad;
    item.dataset.unidad = unidad;

    const cantidadBase = this.convertirACantidadBase(
      nuevaCantidad,
      unidad,
      item.dataset.unidadBase
    );
    const costo = (cantidadBase * parseFloat(item.dataset.precio_unitario)).toFixed(2);

    item.querySelector(".ingrediente-ingredient-info").textContent =
      `${item.querySelector(".ingrediente-ingredient-info").textContent.split(" - ")[0]} - ${nuevaCantidad} ${unidad}`;
    item.querySelector(".ingrediente-ingredient-cost").textContent = `$${costo}`;

    this.updateTotalCost();
  }

  // Conversión
  convertirACantidadBase(cantidad, unidadSeleccionada, unidadBase) {
    const equivalencias = {
      Gramos: { Gramos: 1, Kilo: 1000 },
      Mililitro: { Mililitro: 1, Litro: 1000 },
      Individual: { Individual: 1 },
    };

    if (!equivalencias[unidadBase] || !equivalencias[unidadBase][unidadSeleccionada]) {
      throw new Error(`Unidad incompatible: ${unidadSeleccionada} vs ${unidadBase}`);
    }

    return cantidad * equivalencias[unidadBase][unidadSeleccionada];
  }

  // Validar stock
  validateStock(materia, cantidad, unidad) {
    const stock = parseFloat(materia.stock);
    const unidadBase = materia.unidad;
    const cantidadNormalizada = this.convertirACantidadBase(cantidad, unidad, unidadBase);

    let totalAgregado = 0;
    this.list.querySelectorAll(".ingrediente-ingredient-item").forEach((i) => {
      if (parseInt(i.dataset.id) === materia.id && i.dataset.origen === "agregado") {
        totalAgregado += this.convertirACantidadBase(
          parseFloat(i.dataset.cantidad),
          i.dataset.unidad,
          i.dataset.unidadBase
        );
      }
    });

    if (cantidadNormalizada + totalAgregado > stock) {
      alert(
        `Stock insuficiente de ${materia.nombre_producto}. Disponible: ${stock} ${unidadBase}`
      );
      return false;
    }

    return true;
  }

  // Modal
  openFromTemplate(templateId) {
    const tpl = document.getElementById(templateId);
    const clone = tpl.content.cloneNode(true);
    const modal = clone.querySelector(".ing-modal");

    modal.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => modal.remove());
    });

    document.body.appendChild(modal);
    return modal;
  }
}

export { IngredienteTemplate };
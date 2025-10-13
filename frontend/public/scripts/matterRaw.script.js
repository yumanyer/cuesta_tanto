import { fetchWithAuth,cargarUsuario,showToast} from "./services/api.js";
import {playAudio} from "./services/shared.js";


cargarUsuario();
// --- DOM SELECTORS ---
const productos_encontrados = document.querySelector('#productosTable tbody');
const Agotado = document.getElementById("emptyMaterials");
const toggleBtn = document.getElementById('toggleBtn');
const sidebar = document.getElementById("sidebar");
const form = document.getElementById("addMaterialForm");
const paginationContainer = document.getElementById("pagination");

const templateRow = document.getElementById("productRowTemplate");
const templateEditModal = document.getElementById("editModalTemplate");
const templateDeleteModal = document.getElementById("deleteModalTemplate");


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



// --- VARIABLES ---
let productosData = [];      
let currentPage = 1;
const rowsPerPage = 5;


// --- CREAR FILA ---
function createProductNode(producto){
    const row = templateRow.content.cloneNode(true).querySelector("tr");
    row.dataset.id = producto.id;
    row.querySelector(".td-nombre").textContent = producto.nombre_producto;
    row.querySelector(".td-cantidad").textContent =`${parseFloat(producto.stock).toFixed(2)}`;
    row.querySelector(".td-unidad").textContent =  producto.unidad;
    row.querySelector(".td-precio").textContent = `$ ${parseFloat(producto.precio).toFixed(2)}`;
    row.querySelector(".td-precio_unitario").textContent = `$ ${parseFloat(producto.precio_unitario).toFixed(2)} `+ producto.unidad;
    return row;
}

// --- RENDER TABLA ---
function renderTable(){
    productos_encontrados.innerHTML = "";
    const fragment = document.createDocumentFragment();
    productosData.forEach(p => fragment.appendChild(createProductNode(p)));
    productos_encontrados.appendChild(fragment);
    actualizarAgotado();
    renderPagination();
}

// --- RENDER PAGINACIÓN ---
function renderPagination(){
    paginationContainer.innerHTML = "";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "‹";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", ()=> loadProducts(currentPage - 1));
    paginationContainer.appendChild(prevBtn);

    const pageIndicator = document.createElement("span");
    pageIndicator.textContent = ` Página ${currentPage} `;
    paginationContainer.appendChild(pageIndicator);

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "›";
    nextBtn.disabled = productosData.length < rowsPerPage;
    nextBtn.addEventListener("click", ()=> loadProducts(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
}

// --- EMPTY STATE ---
function actualizarAgotado(){
    Agotado.style.display = productosData.length === 0 ? "block" : "none";
}

// --- MODALES ---
function closeModal(modal){
    if(modal){ 
        modal.remove(); 
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscapeKey); 
    }
}
function handleEscapeKey(e){
    if(e.key==="Escape"){
        const modal = document.querySelector(".modal-overlay");
        closeModal(modal);
    }
}

// --- FETCH PRODUCTOS ---
async function loadProducts(page = 1) {
    const url = new URL("/api/matterRaw/get", window.location.origin);
    url.searchParams.append("limit", rowsPerPage);
    url.searchParams.append("page", page);

    try {
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error("Error al cargar productos");

        const data = await res.json();
        productosData = data.producto_encontrado;
        currentPage = data.currentPage;
        renderTable();
    } catch(err) {
        showToast("No se pudieron cargar los productos", "error");
    }
}

// --- CREATE PRODUCT ---
async function createProduct(producto){
    try{
        const res = await fetchWithAuth("/api/matterRaw/create", {
            method:"POST", 
            headers:{"Content-Type":"application/json"}, 
            body:JSON.stringify(producto)
        });
        if(!res.ok){ 
            const e = await res.json(); 
            throw new Error(e.details || "Error"); 
        }
        loadProducts(1);
    }catch(err){ showToast("Error al crear el producto", "error"); }
}

// --- UPDATE PRODUCT ---
async function updateProduct(productoId, updatedProduct){
    try{
        const res = await fetchWithAuth(`/api/matterRaw/modify/${productoId}`, {
            method:"PUT", 
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(updatedProduct)
        });
        if(!res.ok){ 
            const e = await res.json(); 
            showToast("Error al actualizar el producto", "error");
            return; 
        }
        loadProducts(currentPage);
        const modal = document.getElementById("editModal");
        closeModal(modal);
    }catch(err){ showToast("Error de conexión", "error");}
}

// --- DELETE PRODUCT ---
async function deleteProduct(productoId){
    try{
        const res = await fetchWithAuth(`/api/matterRaw/delete/${productoId}`, {
            method:"DELETE", 
            headers:{"Content-Type":"application/json"}
        });
        if(!res.ok){ 
            const e = await res.json(); 
            showToast("Error al eliminar el producto", "error");
            return; 
        }
        loadProducts(currentPage);
        const modal = document.getElementById("deleteModal");
    showToast("Ingrediente eliminado", "success");

        closeModal(modal);
    }catch(err){showToast("Error de conexión", "error") }
}

// --- MODALES EDIT / DELETE ---
function openEditModal(producto){
    if(document.getElementById("editModal")) return;
    const modal = templateEditModal.content.cloneNode(true).querySelector(".modal-overlay");
    modal.id = "editModal";
    const inputs = modal.querySelectorAll(".form-input");
    inputs[0].value = producto.nombre_producto;
    inputs[1].value = producto.stock;
    inputs[2].value = producto.precio;
    modal.querySelector(".form-select").value = producto.unidad_original || producto.unidad;

    document.body.appendChild(modal);
    document.body.style.overflow="hidden";

    modal.querySelector(".modal-close").addEventListener("click",()=>closeModal(modal));
    modal.querySelector(".modal-cancel").addEventListener("click",()=>closeModal(modal));
    modal.addEventListener("click",(e)=>{if(e.target===modal) closeModal(modal);});
    document.addEventListener("keydown", handleEscapeKey);

    modal.querySelector(".modal-save").addEventListener("click",()=> {
        const updatedProduct = {
            nombre_producto: inputs[0].value.trim(),
            stock: Number(inputs[1].value),
            precio: Number(inputs[2].value),
            unidad: modal.querySelector(".form-select").value,
            unidad_original: modal.querySelector(".form-select").value
        };
        if(!updatedProduct.nombre_producto||updatedProduct.stock<=0||updatedProduct.precio<=0){
           showToast("Revisa los campos", "info"); 
            return;
        }
        showToast("Ingrediente actualizado", "success");
        updateProduct(producto.id, updatedProduct);
    });
}

function openDeleteModal(producto){
    if(document.getElementById("deleteModal")) return;
    const modal = templateDeleteModal.content.cloneNode(true).querySelector(".modal-overlay");
    modal.id = "deleteModal";
    modal.querySelector(".material-name").textContent = producto.nombre_producto;

    document.body.appendChild(modal);
    document.body.style.overflow="hidden";

    modal.querySelector(".modal-close").addEventListener("click",()=>closeModal(modal));
    modal.querySelector(".modal-cancel").addEventListener("click",()=>closeModal(modal));
    modal.addEventListener("click",(e)=>{if(e.target===modal) closeModal(modal);});
    document.addEventListener("keydown", handleEscapeKey);
    modal.querySelector(".modal-confirm").addEventListener("click",()=>deleteProduct(producto.id),);
}

// --- EVENTOS DOM ---
document.addEventListener("DOMContentLoaded", ()=>{
    toggleBtn.addEventListener("click", ()=>sidebar.classList.toggle("collapsed"));

    loadProducts(); // Carga inicial página 1

    form.addEventListener("submit",(e)=>{
        e.preventDefault();
        const producto={
            nombre_producto: document.getElementById("materialName").value.trim(),
            stock: Number(document.getElementById("materialQuantity").value),
            precio: Number(document.getElementById("materialPrice").value),
            unidad: document.getElementById("materialUnit").value,
            unidad_original: document.getElementById("materialUnit").value
        };
        if(!producto.nombre_producto||producto.stock<=0||producto.precio<=0){ 
           showToast("Revisa los campos", "info"); 
            return; 
        }
        createProduct(producto);
        form.reset();
    });

    productos_encontrados.addEventListener("click",(event)=>{
        const row = event.target.closest("tr");
        if(!row) return;
        const producto = {
            id: row.dataset.id,
            nombre_producto: row.querySelector(".td-nombre").textContent,
            stock: Number(row.querySelector(".td-cantidad").textContent),
            unidad: row.querySelector(".td-unidad").textContent,
            precio: Number(row.querySelector(".td-precio").textContent.replace("$","").trim())
        };
        if(event.target.classList.contains("edit")) openEditModal(producto);
        if(event.target.classList.contains("delete")) openDeleteModal(producto);
    });
});

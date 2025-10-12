export async function fetchWithAuth(url, options = {}) {
    options.credentials = "include"; // enviar cookies

    let res = await fetch(url, options);

    if (res.status === 401) {
        console.warn("⚠️ authToken expirado. Intentando refresh...");
        const refreshRes = await fetch("/api/users/refreshToken", {
            method: "POST",
            credentials: "include"
        });

        if (!refreshRes.ok) {
            console.error("❌ Refresh token inválido o expirado.");
            throw new Error("Sesión expirada. Por favor logueate nuevamente.");
        }

        console.log("✅ Refresh exitoso. Reintentando la petición original...");
        res = await fetch(url, options);
    }

    return res;
}

export async function cargarUsuario() {
  try {
    const resUser = await fetch("/api/users/me", {
      method: "GET",
      credentials: "include" 
    });

    if (!resUser.ok) throw new Error("Error al cargar usuario");

    const dataUser = await resUser.json();

    document.querySelector(".user-name").textContent = dataUser.nombre;
    document.querySelector(".user-email").textContent = dataUser.email;

  } catch (err) {
    console.error("⚠️ No se pudo cargar usuario:", err);
  }
}


export function showToast(message, type = "success", duration = 3000) {
  const template = document.getElementById("toastTemplate");
  const clone = template.content.cloneNode(true);
  const toast = clone.querySelector(".toast");

  toast.querySelector(".toast__message").textContent = message;
  toast.classList.add(type);

  if (type === "error") {
    duration = 5000; // mostrar errores por más tiempo
    toast.classList.add("error");
  }
  if (type === "info") {
    toast.classList.add("info");
  }

  // botón cerrar
  const closeBtn = toast.querySelector(".toast__close");
  closeBtn.addEventListener("click", () => toast.remove());

  // agregar al body
  document.body.appendChild(toast);

  // mostrar animación
  requestAnimationFrame(() => toast.classList.add("show"));

  // auto-remover después del tiempo
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300); // tiempo de transición
  }, duration);
}

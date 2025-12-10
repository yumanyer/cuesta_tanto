// frontend/public/scripts/login.script.js
import { isValidEmail, animateFieldComplete, openDoors, playAudio, showLoader } from "./services/shared.js";
import { fetchWithAuth } from "./services/api.js";
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('errorMessage');
  const contentBehind = document.getElementById('contentBehind');
  const loader = document.getElementById('loader');
  const welcomeMessage = document.createElement('div');
  contentBehind.appendChild(welcomeMessage);

  const audio = document.getElementById("audio");
  const container = document.querySelector('.container');
  const leftDoor = document.querySelector('.door-left');
  const rightDoor = document.querySelector('.door-right');

    
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (isValidEmail(email)) {
      animateFieldComplete(emailInput.parentElement);
      errorMessage.textContent = '';
    } else if (email) {
      errorMessage.textContent = 'Por favor, ingresa un email válido';
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const Email = emailInput.value.trim().toLowerCase();
    const Password = passwordInput.value.trim();

    // Limpiar mensajes anteriores
    errorMessage.textContent = '';
    emailInput.style.borderColor = '';
    passwordInput.style.borderColor = '';

    if (!Email || !Password) {
      errorMessage.textContent = 'Por favor, completa ambos campos.';
      if (!Email) emailInput.style.borderColor = '#dc3545';
      if (!Password) passwordInput.style.borderColor = '#dc3545';
      return;
    }

    try {
      const res = await fetchWithAuth("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email, Password })
      });
      const result = await res.json();

      if (res.ok) {
        loginForm.classList.add('slide-out-top');

        setTimeout(() => openDoors(container, leftDoor, rightDoor), 400);
        setTimeout(() => playAudio(audio), 400);
        setTimeout(() => showLoader(loader, welcomeMessage, contentBehind, Email), 1200);

        setTimeout(() => {
          loader.style.display = 'none';
          window.location.href = '/matterRaw';
        }, 3200);

      } else {
        errorMessage.textContent = 'Credenciales inválidas. Intenta nuevamente.';
        errorMessage.style.color = 'red';
        emailInput.style.borderColor = "#dc3545";
        passwordInput.style.borderColor = "#dc3545";
        loginForm.classList.remove("slide-out-top");
        loader.style.display = "none";
      }
    } catch (error) {
      errorMessage.textContent= "Hubo un error al intentar inciar sesion . Por favor intenta nuevamente o contacta con nosotros";
      errorMessage.style.color = 'red';
      loader.style.display = "none";
    }
  });
window.mostrarContraseña = function(event) {
    // Buscar el input dentro del mismo contenedor .field
    const fieldContainer = event.currentTarget.closest('.field');
    const passwordInput = fieldContainer.querySelector('.input-field.eye');
    const eyePath = event.currentTarget.querySelector('path');
    
    if (!passwordInput) {
        console.error('No se encontró el input de contraseña');
        return;
    }
    
    if (passwordInput.type === 'password') {
        // Mostrar contraseña
        passwordInput.type = 'text';
        eyePath.setAttribute('d', 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z');
    } else {
        // Ocultar contraseña
        passwordInput.type = 'password';
        eyePath.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
    }
};
  document.querySelector('.button3').addEventListener('click', () => {
    alert('Funcionalidad de recuperación de contraseña no implementada.');
  });
});

//==========================================
// 🔵 INICIALIZAR SDK DE FARCASTER
// ==========================================
const initFarcasterSDK = async () => {
  try {
    const { sdk } = await import("https://esm.sh/@farcaster/miniapp-sdk");
    
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          sdk.actions.ready();
          console.log('✅ sdk.actions.ready() llamado desde login');
        }, 100);
      });
    } else {
      setTimeout(() => {
        sdk.actions.ready();
        console.log('✅ sdk.actions.ready() llamado desde login');
      }, 100);
    }
  } catch (error) {
    console.log('ℹ️ SDK de Farcaster no disponible (probablemente en navegador normal)');
  }
};

initFarcasterSDK();
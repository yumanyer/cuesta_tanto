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

  document.querySelector('.button3').addEventListener('click', () => {
    alert('Funcionalidad de recuperación de contraseña no implementada.');
  });
});

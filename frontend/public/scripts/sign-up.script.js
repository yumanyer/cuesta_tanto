import { fetchWithAuth } from "./services/api.js";

// frontend/public/scripts/sign-up.script.js
import {
  isValidEmail,
  animateFieldComplete,
  openDoors,
  playAudio,
  showLoader,
  evaluatePasswordStrength,
  updatePasswordStrengthUI,
  validatePasswordMatch
} from "./services/shared.js";

document.addEventListener('DOMContentLoaded', () => {
  const signUpForm = document.getElementById('signUpForm');
  const fullNameInput = document.getElementById('fullName');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsCheckbox = document.getElementById('termsCheckbox');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');
  const contentBehind = document.getElementById('contentBehind');
  const loader = document.getElementById('loader');
  const welcomeMessage = document.createElement('div');
  contentBehind.appendChild(welcomeMessage);

  const audio = document.getElementById("audio");
  const container = document.querySelector('.container');
  const leftDoor = document.querySelector('.door-left');
  const rightDoor = document.querySelector('.door-right');

  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');
  const passwordStrength = document.getElementById('passwordStrength'); 
  
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




  // Eventos inputs
  usernameInput.addEventListener('input', () => {
    if (usernameInput.value.trim().length >= 3) animateFieldComplete(usernameInput.parentElement);
  });

  emailInput.addEventListener('blur', () => {
    if (isValidEmail(emailInput.value.trim())) {
      animateFieldComplete(emailInput.parentElement);
      errorMessage.textContent = '';
    } else if (emailInput.value) errorMessage.textContent = 'Por favor, ingresa un email válido';
  });

  passwordInput.addEventListener('input', () => {
    updatePasswordStrengthUI(passwordInput.value, strengthFill, strengthText, passwordStrength);
    if (passwordInput.value.length >= 8) animateFieldComplete(passwordInput.parentElement);
    if (confirmPasswordInput.value) validatePasswords();
  });

  confirmPasswordInput.addEventListener('input', validatePasswords);

  function validatePasswords() {
    if (validatePasswordMatch(passwordInput.value, confirmPasswordInput.value)) {
      animateFieldComplete(confirmPasswordInput.parentElement);
      errorMessage.textContent = '';
      return true;
    } else if (confirmPasswordInput.value.length > 0) {
      errorMessage.textContent = 'Las contraseñas no coinciden';
      return false;
    }
    return false;
  }

  // Submit
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    successMessage.textContent = '';

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const termsAccepted = termsCheckbox.checked;

    const errors = [];
    
    if (!username || username.length < 3) errors.push('El nombre de usuario debe tener al menos 3 caracteres');
    if (!email || !isValidEmail(email)) errors.push('Ingresa un email válido');
    if (evaluatePasswordStrength(password).score < 3) errors.push('La contraseña debe ser más segura');
    if (!validatePasswordMatch(password, confirmPassword)) errors.push('Las contraseñas no coinciden');
    if (!termsAccepted) errors.push('Debes aceptar los términos y condiciones');

    //impide que se ejecute la lógica de envío si hay algún error.
    if (errors.length > 0) {
      errorMessage.textContent = errors[0];
      return;
    }
    playAudio(audio);
    // Enviar datos al backend
    const dataRegister = { Name: username, Email:email, Password: password };
    try {
      const res = await fetchWithAuth("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataRegister)


      });
      const result = await res.json();

      if (res.ok) {
        successMessage.textContent = '¡Validación exitosa! Creando tu cuenta...';
        signUpForm.classList.add('slide-out-top');

        // ANIMA LAS PUERTAS Y EJECUTA EL AUDIO
        setTimeout(() => {openDoors(container, leftDoor, rightDoor);}, 900);
        // EJECTUA EL LOADER
        setTimeout(() => showLoader(loader, welcomeMessage, contentBehind, username), 1000);
        // MENSAJE EN EL LOADER Y REDIRECCIÓN
        setTimeout(() => {
          loader.style.display = 'none';
          welcomeMessage.innerHTML = `
            <div style="color: white; text-align: center;">
              <h2 style="color: #28a745; margin-bottom: 1rem;">¡Cuenta creada exitosamente! ✅</h2>
              <p style="font-size: 1rem; opacity: 0.8;">Redirigiendo al panel principal...</p>
            </div>`;
          setTimeout(() => window.location.href = '/matterRaw', 2000);
        }, 7700);

      } else {
        errorMessage.textContent = result.details || 'Error en el registro';
        errorMessage.style.color = 'red';
        emailInput.style.borderColor = "#dc3545";
        passwordInput.style.borderColor = "#dc3545";
        signUpForm.classList.remove("slide-out-top");
        loader.style.display = "none";
      }
    } catch (error) {
      errorMessage.textContent= "Hubo un error al intentar inciar sesion . Por favor intenta nuevamente o contacta con nosotros";
      errorMessage.style.color = 'red';
      loader.style.display = "none";    }
  });

  // Botón "Ya tengo cuenta"
  document.querySelector('.button2').addEventListener('click', () => window.location.href = 'login.html');
});

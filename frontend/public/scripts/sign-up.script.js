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

// frontend/public/scripts/shared.js
import {sdk} from "https://esm.sh/@farcaster/miniapp-sdk";


// Función para validar email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para animar campo completado
export function animateFieldComplete(field) {
  field.classList.add('field-complete');
  setTimeout(() => {
    field.classList.remove('field-complete');
  }, 300);
}

// Función para abrir puertas
export function openDoors(container, leftDoor, rightDoor) {
  container.classList.add('doors-opening');
  leftDoor.classList.add('door-open-left');
  rightDoor.classList.add('door-open-right');
}

// Función para reproducir audio
export function playAudio(audioElement) {
  if (!audioElement.paused) return; // ya está sonando, no lo reiniciamos
  audioElement.currentTime = 0;
  audioElement.play();
}


// Función para mostrar loader y mensaje de bienvenida
export function showLoader(loader, welcomeMessage, contentBehind, email) {
  loader.style.display = 'block';
  welcomeMessage.innerHTML = `<h2 style="color: white; font-size: smaller; margin-bottom: 15rem;">
    Estamos validando sus credenciales, ${email}...
  </h2>`;
  contentBehind.classList.add('visible');
}



// Función para evaluar fortaleza de contraseña
export function evaluatePasswordStrength(password) {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score += 1; else feedback.push('al menos 8 caracteres');
  if (/[a-z]/.test(password)) score += 1; else feedback.push('letras minúsculas');
  if (/[A-Z]/.test(password)) score += 1; else feedback.push('letras mayúsculas');
  if (/[0-9]/.test(password)) score += 1; else feedback.push('números');
  if (/[^A-Za-z0-9]/.test(password)) score += 1; else feedback.push('símbolos especiales');

  return { score, feedback };
}

// Función para actualizar el indicador visual de fortaleza de contraseña
export function updatePasswordStrengthUI(password, strengthFill, strengthText, passwordStrength) {
  if (!password) {
    passwordStrength.className = 'password-strength';
    strengthText.textContent = 'Ingresa una contraseña';
    return;
  }

  const { score, feedback } = evaluatePasswordStrength(password);
  passwordStrength.className = 'password-strength';

  if (score <= 2) {
    passwordStrength.classList.add('strength-weak');
    strengthText.textContent = `Débil - Necesita: ${feedback.slice(0, 2).join(', ')}`;
  } else if (score === 3) {
    passwordStrength.classList.add('strength-fair');
    strengthText.textContent = `Regular - Necesita: ${feedback.join(', ')}`;
  } else if (score === 4) {
    passwordStrength.classList.add('strength-good');
    strengthText.textContent = 'Buena - Casi perfecta';
  } else {
    passwordStrength.classList.add('strength-strong');
    strengthText.textContent = 'Excelente - Muy segura';
  }
}

// Función para validar que dos contraseñas coincidan
export function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0;
}


export const handleFarcasterAuth = async ({
  errorMessage,
  successMessage,
  signUpForm,
  container,
  leftDoor,
  rightDoor,
  audio,
  loader,
  welcomeMessage,
  contentBehind,
  isSignUp = false // true para sign-up, false para login
}) => {
  try {
    errorMessage.textContent = '';
    if (successMessage) successMessage.textContent = 'Autenticando con Farcaster...';
    
    // Hacer request autenticado con Farcaster
    const response = await sdk.quickAuth.fetch('https://cuesta-tanto.onrender.com/auth/farcaster', {
      method: 'POST'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Autenticación con Farcaster exitosa:', data);
      
      if (successMessage) {
        successMessage.textContent = isSignUp 
          ? '¡Cuenta creada con Farcaster!' 
          : '¡Inicio de sesión exitoso!';
      }
      
      // Animaciones
      signUpForm.classList.add('slide-out-top');
      
      const doorDelay = isSignUp ? 900 : 400;
      const loaderDelay = isSignUp ? 1000 : 1200;
      const finalDelay = isSignUp ? 7700 : 3200;
      
      setTimeout(() => {
        openDoors(container, leftDoor, rightDoor);
        playAudio(audio);
      }, doorDelay);
      
      setTimeout(() => {
        showLoader(loader, welcomeMessage, contentBehind, data.user.nombre);
      }, loaderDelay);
      
      setTimeout(() => {
        loader.style.display = 'none';
        
        if (isSignUp) {
          welcomeMessage.innerHTML = `
            <div style="color: white; text-align: center;">
              <h2 style="color: #28a745; margin-bottom: 1rem;">¡Bienvenido ${data.user.nombre}! ✅</h2>
              <p style="font-size: 1rem; opacity: 0.8;">Redirigiendo al panel principal...</p>
            </div>`;
          setTimeout(() => window.location.href = '/matterRaw', 2000);
        } else {
          window.location.href = '/matterRaw';
        }
      }, finalDelay);
      
    } else {
      const error = await response.json();
      errorMessage.textContent = error.message || 'Error al autenticar con Farcaster';
      errorMessage.style.color = 'red';
      signUpForm.classList.remove('slide-out-top');
    }
    
  } catch (error) {
    console.error('❌ Error de Farcaster:', error);
    errorMessage.textContent = 'Error de conexión. Asegúrate de usar la app desde Farcaster Mini App.';
    errorMessage.style.color = 'red';
    signUpForm.classList.remove('slide-out-top');
  }
};
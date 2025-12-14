import { api, User } from "../api";

export class LoginView {
  private container: HTMLElement;
  private onLoginSuccess: (user: User) => void;

  constructor(container: HTMLElement, onLoginSuccess: (user: User) => void) {
    this.container = container;
    this.onLoginSuccess = onLoginSuccess;
  }

  render() {
    this.container.innerHTML = `
      <div class="container" style="max-width: 500px; margin: 100px auto;">
        <h1 style="text-align: center;">🪨📄✂️</h1>
        <h2 style="text-align: center;">Piedra, Papel, Tijera</h2>
        
        <div id="error-message"></div>
        
        <div id="login-form">
          <h3>Iniciar Sesión</h3>
          <div class="form-group">
            <label>Usuario</label>
            <input type="text" id="login-username" placeholder="Nombre de usuario" />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="login-password" placeholder="Contraseña" />
          </div>
          <button id="login-btn">Iniciar Sesión</button>
          <button id="show-register-btn" class="secondary">Registrarse</button>
        </div>

        <div id="register-form" style="display: none;">
          <h3>Registro</h3>
          <div class="form-group">
            <label>Usuario</label>
            <input type="text" id="register-username" placeholder="Nombre de usuario (mín. 3 caracteres)" />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="register-password" placeholder="Contraseña (mín. 6 caracteres)" />
          </div>
          <button id="register-btn">Registrarse</button>
          <button id="show-login-btn" class="secondary">Volver a Iniciar Sesión</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const showRegisterBtn = document.getElementById("show-register-btn");
    const showLoginBtn = document.getElementById("show-login-btn");

    loginBtn?.addEventListener("click", () => this.handleLogin());
    registerBtn?.addEventListener("click", () => this.handleRegister());
    showRegisterBtn?.addEventListener("click", () => this.toggleForms());
    showLoginBtn?.addEventListener("click", () => this.toggleForms());

    // Enter key handlers
    document
      .getElementById("login-password")
      ?.addEventListener("keypress", (e) => {
        if ((e as KeyboardEvent).key === "Enter") this.handleLogin();
      });
    document
      .getElementById("register-password")
      ?.addEventListener("keypress", (e) => {
        if ((e as KeyboardEvent).key === "Enter") this.handleRegister();
      });
  }

  private toggleForms() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm && registerForm) {
      if (loginForm.style.display === "none") {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
      } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
      }
    }

    this.clearError();
  }

  private async handleLogin() {
    const username = (
      document.getElementById("login-username") as HTMLInputElement
    ).value;
    const password = (
      document.getElementById("login-password") as HTMLInputElement
    ).value;

    if (!username || !password) {
      this.showError("Por favor completa todos los campos");
      return;
    }

    try {
      const response = await api.login(username, password);
      this.onLoginSuccess(response.user);
    } catch (error) {
      this.showError((error as Error).message);
    }
  }

  private async handleRegister() {
    const username = (
      document.getElementById("register-username") as HTMLInputElement
    ).value;
    const password = (
      document.getElementById("register-password") as HTMLInputElement
    ).value;

    if (!username || !password) {
      this.showError("Por favor completa todos los campos");
      return;
    }

    try {
      const response = await api.register(username, password);
      this.onLoginSuccess(response.user);
    } catch (error) {
      this.showError((error as Error).message);
    }
  }

  private showError(message: string) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.innerHTML = `<div class="error">${message}</div>`;
    }
  }

  private clearError() {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.innerHTML = "";
    }
  }
}

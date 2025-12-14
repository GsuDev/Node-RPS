import { api, User } from "./api";
import { socketManager } from "./socket";
import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { GameView } from "./views/GameView";

class App {
  private container: HTMLElement;
  private currentView: any = null;
  private currentUser: User | null = null;

  constructor() {
    this.container = document.getElementById("app")!;
    this.init();
  }

  private async init() {
    // Verificar si hay un token guardado
    const token = api.getToken();

    if (token) {
      try {
        // Intentar obtener la información del usuario
        const { game } = await api.getMyGame();

        // Si tiene una partida activa, ir directamente al juego
        if (game && (game.status === "waiting" || game.status === "playing")) {
          // Necesitamos obtener la info del usuario de alguna manera
          // Por ahora, conectamos socket y mostramos dashboard
          socketManager.connect(token);
          this.showDashboard();
        } else {
          socketManager.connect(token);
          this.showDashboard();
        }
      } catch (error) {
        // Token inválido, mostrar login
        api.clearToken();
        this.showLogin();
      }
    } else {
      this.showLogin();
    }
  }

  private showLogin() {
    if (this.currentView?.destroy) {
      this.currentView.destroy();
    }

    const loginView = new LoginView(this.container, (user: User) =>
      this.handleLoginSuccess(user),
    );

    loginView.render();
    this.currentView = loginView;
  }

  private async handleLoginSuccess(user: User) {
    this.currentUser = user;
    const token = api.getToken();

    if (token) {
      socketManager.connect(token);
    }

    // Verificar si tiene una partida activa
    try {
      const { game } = await api.getMyGame();

      if (game && (game.status === "waiting" || game.status === "playing")) {
        this.showGame(game.id);
      } else {
        this.showDashboard();
      }
    } catch (error) {
      this.showDashboard();
    }
  }

  private showDashboard() {
    if (this.currentView?.destroy) {
      this.currentView.destroy();
    }

    // Si no tenemos el usuario actual, intentar obtenerlo
    if (!this.currentUser) {
      this.showLogin();
      return;
    }

    const dashboardView = new DashboardView(
      this.container,
      this.currentUser,
      (gameId: number) => this.showGame(gameId),
      () => this.handleLogout(),
    );

    dashboardView.render();
    this.currentView = dashboardView;

    // Exponer la función joinGame globalmente para los botones
    (window as any).joinGame = (gameId: number) => {
      dashboardView.joinGame(gameId);
    };
  }

  private showGame(gameId: number) {
    if (this.currentView?.destroy) {
      this.currentView.destroy();
    }

    if (!this.currentUser) {
      this.showLogin();
      return;
    }

    const gameView = new GameView(
      this.container,
      gameId,
      this.currentUser,
      () => this.handleGameEnd(),
    );

    gameView.render();
    this.currentView = gameView;
  }

  private handleGameEnd() {
    // Recargar los datos del usuario
    this.showDashboard();
  }

  private handleLogout() {
    this.currentUser = null;
    api.clearToken();
    socketManager.disconnect();
    this.showLogin();
  }
}

// Iniciar la aplicación
new App();

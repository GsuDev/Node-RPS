import { api, User } from "../api";
import { socketManager } from "../socket";

export class DashboardView {
  private container: HTMLElement;
  private user: User;
  private onStartGame: (gameId: number) => void;
  private onLogout: () => void;
  private availableGames: any[] = [];
  private ranking: any[] = [];

  constructor(
    container: HTMLElement,
    user: User,
    onStartGame: (gameId: number) => void,
    onLogout: () => void,
  ) {
    this.container = container;
    this.user = user;
    this.onStartGame = onStartGame;
    this.onLogout = onLogout;
  }

  async render() {
    this.container.innerHTML = `
      <div class="container">
        <div class="header">
          <div>
            <h1>🪨📄✂️ Piedra, Papel, Tijera</h1>
          </div>
          <div class="user-info">
            <div>
              <strong>${this.user.username}</strong>
              <div class="stats">
                Partidas: ${this.user.gamesPlayed} | 
                Victorias: ${this.user.wins} | 
                Derrotas: ${this.user.losses}
              </div>
            </div>
            <button id="logout-btn" class="danger">Salir</button>
          </div>
        </div>

        <div id="error-message"></div>
        <div id="success-message"></div>

        <div class="grid">
          <div class="card">
            <h3>Nueva Partida</h3>
            <button id="create-vs-human-btn">Crear Partida vs Humano</button>
            <button id="create-vs-machine-btn" class="secondary">Jugar vs Máquina</button>
          </div>

          <div class="card">
            <h3>Partidas Disponibles</h3>
            <div id="available-games" class="game-list">
              <div class="loading">Cargando partidas...</div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: 20px;">
          <h3>🏆 Ranking de Jugadores</h3>
          <div id="ranking" class="ranking-list">
            <div class="loading">Cargando ranking...</div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.setupSocketListeners();
    await this.loadData();
  }

  private attachEventListeners() {
    document
      .getElementById("logout-btn")
      ?.addEventListener("click", () => this.handleLogout());
    document
      .getElementById("create-vs-human-btn")
      ?.addEventListener("click", () => this.createGame(false));
    document
      .getElementById("create-vs-machine-btn")
      ?.addEventListener("click", () => this.createGame(true));
  }

  private setupSocketListeners() {
    socketManager.on("available_games", (data: any) => {
      this.availableGames = data.games;
      this.renderAvailableGames();
    });

    socketManager.on("ranking_update", (data: any) => {
      this.ranking = data.ranking;
      this.renderRanking();
    });
  }

  private async loadData() {
    try {
      const [gamesData, rankingData] = await Promise.all([
        api.getAvailableGames(),
        api.getRanking(),
      ]);

      this.availableGames = gamesData.games;
      this.ranking = rankingData.ranking;

      this.renderAvailableGames();
      this.renderRanking();
    } catch (error) {
      this.showError((error as Error).message);
    }
  }

  private renderAvailableGames() {
    const container = document.getElementById("available-games");
    if (!container) return;

    if (this.availableGames.length === 0) {
      container.innerHTML =
        '<p style="color: #666; padding: 20px; text-align: center;">No hay partidas disponibles</p>';
      return;
    }

    container.innerHTML = this.availableGames
      .map(
        (game) => `
      <div class="game-item">
        <div>
          <strong>${game.player1.username}</strong> está esperando...
        </div>
        <button onclick="window.joinGame(${game.id})" class="secondary">Unirse</button>
      </div>
    `,
      )
      .join("");
  }

  private renderRanking() {
    const container = document.getElementById("ranking");
    if (!container) return;

    if (this.ranking.length === 0) {
      container.innerHTML =
        '<p style="color: #666; padding: 20px; text-align: center;">No hay jugadores en el ranking</p>';
      return;
    }

    container.innerHTML = this.ranking
      .map(
        (player, index) => `
      <div class="ranking-item">
        <div class="ranking-position">#${index + 1}</div>
        <div class="ranking-info">
          <strong>${player.username}</strong>
          <div class="ranking-stats">
            ${player.gamesPlayed} partidas | 
            ${player.wins} victorias | 
            ${player.winRate}% win rate
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  }

  private async createGame(isMachineGame: boolean) {
    try {
      const { game } = await api.createGame(isMachineGame);
      this.showSuccess(
        isMachineGame
          ? "Partida vs Máquina creada"
          : "Partida creada, esperando oponente...",
      );

      // Verificar si hay una partida en curso
      setTimeout(async () => {
        const { game: myGame } = await api.getMyGame();
        if (myGame) {
          this.onStartGame(myGame.id);
        }
      }, 500);
    } catch (error) {
      this.showError((error as Error).message);
    }
  }

  public async joinGame(gameId: number) {
    try {
      await api.joinGame(gameId);
      this.showSuccess("Te has unido a la partida");
      setTimeout(() => {
        this.onStartGame(gameId);
      }, 500);
    } catch (error) {
      this.showError((error as Error).message);
    }
  }

  private handleLogout() {
    api.clearToken();
    socketManager.disconnect();
    this.onLogout();
  }

  private showError(message: string) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.innerHTML = `<div class="error">${message}</div>`;
      setTimeout(() => {
        errorDiv.innerHTML = "";
      }, 5000);
    }
  }

  private showSuccess(message: string) {
    const successDiv = document.getElementById("success-message");
    if (successDiv) {
      successDiv.innerHTML = `<div class="success">${message}</div>`;
      setTimeout(() => {
        successDiv.innerHTML = "";
      }, 3000);
    }
  }

  destroy() {
    socketManager.off("available_games");
    socketManager.off("ranking_update");
  }
}

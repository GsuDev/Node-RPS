import { socketManager } from "../socket";
import { User } from "../api";

const CHOICE_EMOJIS: { [key: string]: string } = {
  rock: "🪨",
  paper: "📄",
  scissors: "✂️",
};

const CHOICE_NAMES: { [key: string]: string } = {
  rock: "Piedra",
  paper: "Papel",
  scissors: "Tijera",
};

const MACHINE_ID = -1; // ID fijo para la máquina

export class GameView {
  private container: HTMLElement;
  private gameId: number;
  private user: User;
  private onGameEnd: () => void;
  private game: any = null;
  private currentRound: any = null;
  private hasPlayedThisRound = false;
  private showingRoundResult = false;

  constructor(
    container: HTMLElement,
    gameId: number,
    user: User,
    onGameEnd: () => void,
  ) {
    this.container = container;
    this.gameId = gameId;
    this.user = user;
    this.onGameEnd = onGameEnd;
  }

  async render() {
    this.container.innerHTML = `
      <div class="container">
        <div class="game-board">
          <h1>🪨📄✂️ Partida en Curso</h1>
          <div id="game-status"></div>
          <div id="game-content"></div>
        </div>
      </div>
    `;

    this.setupSocketListeners();
    socketManager.emit("join_game", this.gameId);
  }

  private setupSocketListeners() {
    socketManager.on("game_update", (data: any) => {
      console.log("📩 Recibido game_update:", data);
      this.game = data;

      // Resetear el flag si la ronda actual está completa
      if (this.game.rounds && this.game.rounds.length > 0) {
        const lastRound = this.game.rounds[this.game.rounds.length - 1];
        // Si la última ronda está completa, podemos jugar la siguiente
        if (lastRound.player1Choice && lastRound.player2Choice) {
          console.log("Ronda completa detectada, reseteando flag");
          this.hasPlayedThisRound = false;
        }
      }

      this.updateGameContent();
    });

    socketManager.on("opponent_played", (data: any) => {
      console.log("📩 Recibido opponent_played:", data);
      this.showNotification("⏳ Tu oponente ha jugado, es tu turno!");
    });

    socketManager.on("round_result", (data: any) => {
      console.log("📩 Recibido round_result:", data);
      this.showRoundResultModal(data);
      // Después de mostrar el resultado, resetear el flag
      setTimeout(() => {
        this.hasPlayedThisRound = false;
        console.log("Flag reseteado después de modal");
      }, 4100); // Justo después de que se cierre el modal
    });

    socketManager.on("game_abandoned", (data: any) => {
      console.log("📩 Recibido game_abandoned:", data);
      this.game = data;
      this.updateGameContent();
    });

    socketManager.on("game_error", (data: any) => {
      console.log("❌ Recibido game_error:", data);
      alert(data.error);
    });
  }

  private showNotification(message: string) {
    const notification = document.createElement("div");
    notification.className = "success";
    notification.textContent = message;
    notification.style.cssText =
      "position: fixed; top: 20px; right: 20px; z-index: 1000; animation: slideIn 0.3s;";

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  private showRoundResultModal(roundData: any) {
    this.showingRoundResult = true;

    const isPlayer1 = this.game.player1.id === this.user.id;
    const myChoice = isPlayer1
      ? roundData.player1Choice
      : roundData.player2Choice;
    const opponentChoice = isPlayer1
      ? roundData.player2Choice
      : roundData.player1Choice;

    // winnerId === null -> empate
    // winnerId === user.id -> gané yo
    // winnerId === -1 -> ganó la máquina
    // winnerId === otro_id -> ganó el oponente humano
    const isTie = roundData.winnerId === null;
    const iWon = roundData.winnerId === this.user.id;

    let resultText = "";
    let resultClass = "";

    if (isTie) {
      resultText = "🤝 ¡EMPATE!";
      resultClass = "tie";
    } else if (iWon) {
      resultText = `✅ ¡GANASTE! ${CHOICE_NAMES[myChoice]} gana a ${CHOICE_NAMES[opponentChoice]}`;
      resultClass = "win";
    } else {
      resultText = `❌ PERDISTE. ${CHOICE_NAMES[opponentChoice]} gana a ${CHOICE_NAMES[myChoice]}`;
      resultClass = "loss";
    }

    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; max-width: 500px; animation: scaleIn 0.3s;">
        <h2 style="margin-bottom: 30px; font-size: 32px;">Ronda ${roundData.roundNumber}</h2>
        
        <div style="display: flex; justify-content: space-around; align-items: center; margin: 30px 0;">
          <div>
            <div style="font-size: 80px;">${CHOICE_EMOJIS[myChoice]}</div>
            <div style="font-size: 18px; font-weight: bold;">Tú</div>
            <div>${CHOICE_NAMES[myChoice]}</div>
          </div>
          
          <div style="font-size: 36px; font-weight: bold;">VS</div>
          
          <div>
            <div style="font-size: 80px;">${CHOICE_EMOJIS[opponentChoice]}</div>
            <div style="font-size: 18px; font-weight: bold;">Oponente</div>
            <div>${CHOICE_NAMES[opponentChoice]}</div>
          </div>
        </div>

        <div class="round-result ${resultClass}" style="font-size: 24px; font-weight: bold; padding: 20px; border-radius: 10px; margin: 20px 0;">
          ${resultText}
        </div>

        <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 15px 40px; font-size: 18px;">
          Continuar
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Añadir estilos de animación si no existen
    if (!document.getElementById("modal-animations")) {
      const style = document.createElement("style");
      style.id = "modal-animations";
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Auto cerrar después de 4 segundos
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
      this.showingRoundResult = false;
    }, 4000);
  }

  private updateGameContent() {
    if (!this.game) return;

    const isPlayer1 = this.game.player1.id === this.user.id;
    const opponent = isPlayer1 ? this.game.player2 : this.game.player1;
    const myScore = isPlayer1 ? this.game.player1Score : this.game.player2Score;
    const opponentScore = isPlayer1
      ? this.game.player2Score
      : this.game.player1Score;

    // Buscar la ronda actual (la que no está completa o la siguiente)
    let incompleteRound = null;
    if (this.game.rounds) {
      incompleteRound = this.game.rounds.find(
        (r: any) => !r.player1Choice || !r.player2Choice,
      );
    }

    this.currentRound = incompleteRound;

    // Verificar si el jugador ya jugó esta ronda
    if (this.currentRound) {
      const myChoice = isPlayer1
        ? this.currentRound.player1Choice
        : this.currentRound.player2Choice;
      this.hasPlayedThisRound = myChoice !== null && myChoice !== undefined;
      console.log("Estado de juego:", {
        roundNumber: this.currentRound.roundNumber,
        myChoice,
        hasPlayedThisRound: this.hasPlayedThisRound,
      });
    } else {
      this.hasPlayedThisRound = false;
      console.log("No hay ronda incompleta, listo para jugar");
    }

    const statusDiv = document.getElementById("game-status");
    const contentDiv = document.getElementById("game-content");

    if (!statusDiv || !contentDiv) return;

    // Estado de espera
    if (this.game.status === "waiting") {
      statusDiv.innerHTML = `
        <div class="waiting-message">
          <h2>Esperando oponente...</h2>
          <p>Comparte el ID de la partida: <strong>${this.game.id}</strong></p>
          <button id="cancel-game-btn" class="danger">Cancelar Partida</button>
        </div>
      `;

      document
        .getElementById("cancel-game-btn")
        ?.addEventListener("click", () => {
          socketManager.emit("abandon_game", this.gameId);
        });

      contentDiv.innerHTML = "";
      return;
    }

    // Partida finalizada
    if (this.game.status === "finished" || this.game.status === "abandoned") {
      const iWon = this.game.winnerId === this.user.id;
      const wasAbandoned = this.game.status === "abandoned";

      statusDiv.innerHTML = `
        <div class="game-over ${iWon ? "winner" : "loser"}">
          <h2>${iWon ? "🎉 ¡Victoria!" : "😢 Derrota"}</h2>
          <p>${wasAbandoned ? "El oponente abandonó la partida" : ""}</p>
          <div class="score-board">
            <div class="player-section">
              <div>${this.user.username}</div>
              <div style="font-size: 36px;">${myScore}</div>
            </div>
            <div style="font-size: 24px; align-self: center;">VS</div>
            <div class="player-section">
              <div>${opponent?.username || "Máquina"}</div>
              <div style="font-size: 36px;">${opponentScore}</div>
            </div>
          </div>
          <button id="back-to-dashboard-btn">Volver al Dashboard</button>
        </div>
      `;

      document
        .getElementById("back-to-dashboard-btn")
        ?.addEventListener("click", () => {
          this.destroy();
          this.onGameEnd();
        });

      contentDiv.innerHTML = this.renderRoundsHistory();
      return;
    }

    // Partida en curso
    statusDiv.innerHTML = `
      <div class="score-board">
        <div class="player-section">
          <div>${this.user.username} (Tú)</div>
          <div style="font-size: 48px; color: #667eea;">${myScore}</div>
        </div>
        <div style="font-size: 24px; align-self: center;">VS</div>
        <div class="player-section">
          <div>${opponent?.username || "Máquina"}</div>
          <div style="font-size: 48px; color: #764ba2;">${opponentScore}</div>
        </div>
      </div>
    `;

    const completedRounds = this.game.rounds.filter(
      (r: any) => r.player1Choice && r.player2Choice,
    ).length;
    const currentRoundNum = completedRounds + 1;

    const waitingForOpponent =
      this.hasPlayedThisRound &&
      this.currentRound &&
      (!this.currentRound.player1Choice || !this.currentRound.player2Choice);

    contentDiv.innerHTML = `
      <div>
        <h3 style="text-align: center;">Ronda ${currentRoundNum} de 5</h3>
        <p style="text-align: center; color: #666; margin-bottom: 20px;">
          ${
            waitingForOpponent
              ? "⏳ Esperando al oponente..."
              : "🎮 Elige tu jugada"
          }
        </p>
        
        <div class="choices">
          <button class="choice-btn" id="rock-btn" ${
            this.hasPlayedThisRound ? "disabled" : ""
          }>
            🪨
          </button>
          <button class="choice-btn" id="paper-btn" ${
            this.hasPlayedThisRound ? "disabled" : ""
          }>
            📄
          </button>
          <button class="choice-btn" id="scissors-btn" ${
            this.hasPlayedThisRound ? "disabled" : ""
          }>
            ✂️
          </button>
        </div>

        ${this.renderRoundsHistory()}
        
        <div style="text-align: center; margin-top: 20px;">
          <button id="abandon-btn" class="danger">Abandonar Partida</button>
        </div>
      </div>
    `;

    this.attachGameEventListeners();
  }

  private renderRoundsHistory(): string {
    if (!this.game.rounds || this.game.rounds.length === 0) {
      return "";
    }

    const isPlayer1 = this.game.player1.id === this.user.id;

    // Filtrar solo las rondas completadas
    const completedRounds = this.game.rounds.filter(
      (r: any) => r.player1Choice && r.player2Choice,
    );

    if (completedRounds.length === 0) {
      return "";
    }

    const roundsHtml = completedRounds
      .map((round: any) => {
        const myChoice = isPlayer1 ? round.player1Choice : round.player2Choice;
        const opponentChoice = isPlayer1
          ? round.player2Choice
          : round.player1Choice;

        // winnerId === null -> empate
        // winnerId === user.id -> gané yo
        // winnerId === -1 o otro_id -> ganó el oponente
        const isTie = round.winnerId === null;
        const iWon = round.winnerId === this.user.id;

        let resultClass = "";
        let resultText = "";

        if (isTie) {
          resultClass = "tie";
          resultText = "Empate";
        } else if (iWon) {
          resultClass = "win";
          resultText = "Ganaste";
        } else {
          resultClass = "loss";
          resultText = "Perdiste";
        }

        return `
        <div class="round-item">
          <div><strong>Ronda ${round.roundNumber}</strong></div>
          <div>
            ${CHOICE_EMOJIS[myChoice]} vs ${CHOICE_EMOJIS[opponentChoice]}
          </div>
          <div class="round-result ${resultClass}">${resultText}</div>
        </div>
      `;
      })
      .join("");

    return `
      <div class="rounds-history">
        <h3>Historial de Rondas</h3>
        ${roundsHtml}
      </div>
    `;
  }

  private attachGameEventListeners() {
    document
      .getElementById("rock-btn")
      ?.addEventListener("click", () => this.playChoice("rock"));
    document
      .getElementById("paper-btn")
      ?.addEventListener("click", () => this.playChoice("paper"));
    document
      .getElementById("scissors-btn")
      ?.addEventListener("click", () => this.playChoice("scissors"));
    document
      .getElementById("abandon-btn")
      ?.addEventListener("click", () => this.abandonGame());
  }

  private playChoice(choice: string) {
    if (this.hasPlayedThisRound) return;

    console.log("🎮 Jugando:", choice, "en partida", this.gameId);

    socketManager.emit("play_round", {
      gameId: this.gameId,
      choice,
    });

    console.log("✅ Evento play_round enviado");

    this.hasPlayedThisRound = true;

    // Actualizar UI inmediatamente para deshabilitar botones
    const buttons = document.querySelectorAll(".choice-btn");
    buttons.forEach((btn) => {
      (btn as HTMLButtonElement).disabled = true;
    });

    const statusText = document.querySelector("#game-content p");
    if (statusText) {
      statusText.textContent = "⏳ Esperando al oponente...";
    }
  }

  private abandonGame() {
    if (
      confirm(
        "¿Estás seguro de que quieres abandonar? Se contará como derrota.",
      )
    ) {
      socketManager.emit("abandon_game", this.gameId);
    }
  }

  destroy() {
    socketManager.off("game_update");
    socketManager.off("opponent_played");
    socketManager.off("round_result");
    socketManager.off("game_abandoned");
    socketManager.off("game_error");
  }
}

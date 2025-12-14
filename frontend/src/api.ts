const API_URL = (import.meta.env.VITE_API_URL + '/api');

export interface User {
  id: number;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface Game {
  id: number;
  player1Id: number;
  player2Id: number | null;
  status: string;
  winnerId: number | null;
  isMachineGame: boolean;
  player1Score: number;
  player2Score: number;
}

class API {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  getToken(): string | null {
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error en la petición");
    }

    return data;
  }

  async register(username: string, password: string): Promise<AuthResponse> {
    const data = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async createGame(isMachineGame: boolean): Promise<{ game: Game }> {
    return this.request("/games", {
      method: "POST",
      body: JSON.stringify({ isMachineGame }),
    });
  }

  async getAvailableGames(): Promise<{ games: any[] }> {
    return this.request("/games/available");
  }

  async joinGame(gameId: number): Promise<{ game: Game }> {
    return this.request(`/games/${gameId}/join`, {
      method: "POST",
    });
  }

  async getMyGame(): Promise<{ game: any | null }> {
    return this.request("/games/my-game");
  }

  async getRanking(): Promise<{ ranking: any[] }> {
    return this.request("/ranking");
  }
}

export const api = new API();

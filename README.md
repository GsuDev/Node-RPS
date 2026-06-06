# Node RPS - Rock Paper Scissors API

API REST para un juego multijugador de Piedra, Papel o Tijera con autenticación de usuarios y registro de partidas en base de datos.

## Características

- Autenticación con **JWT** (registro y login)
- Creación y gestión de **partidas**
- Registro de **rondas** y resultados por jugador
- Conexión a base de datos relacional con Sequelize

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Sequelize
- **Base de datos**: MySQL/PostgreSQL
- **Auth**: JWT

## Instalación

```bash
npm install
cp .env.example .env   # Configurar credenciales de BD
node app/app.js
```

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login (devuelve JWT) |
| POST | `/game` | Crear partida |
| POST | `/game/:id/round` | Jugar una ronda |
| GET  | `/user` | Info del usuario |

## Variables de entorno

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rps
DB_USER=root
DB_PASSWORD=secret
JWT_SECRET=your_secret
```

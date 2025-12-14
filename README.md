# 📘 Guía de Desarrollo - Piedra, Papel, Tijera

## 🔧 Comandos Útiles

### Instalación Inicial

```bash
git clone https://github.com/GsuDev/Node-RPS.git
# Desde la raíz del proyecto
npm install                    # Instalar concurrently
npm run install:all           # Instalar backend y frontend

# O manualmente
cd backend && npm install
cd ../frontend && npm install
```

### Desarrollo

```bash
# Opción 1: Ejecutar todo junto (recomendado)
npm run dev

# Opción 2: Ejecutar por separado
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## 🗄️ Gestión de Base de Datos

### Crear Base de Datos

Yo creo un server de mysql con `dbngin` y ejecuto los comandos sql con `DBeaver`

```sql
# Creación con soporte de caracteres especiales
CREATE DATABASE rps_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Resetear Base de Datos

```sql
-- CUIDADO: Esto borrará TODOS los datos
DROP DATABASE rps_game;
CREATE DATABASE rps_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Ver Tablas y Datos

```sql
USE rps_game;
SHOW TABLES;
SELECT * FROM Users;
SELECT * FROM Games;
SELECT * FROM Rounds;
```

## 🧪 Testing Manual

### 1. Probar Registro y Login

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"jugador1","password":"123456"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jugador1","password":"123456"}'
```

### 2. Probar Endpoints con Token

```bash
# Guardar el token en una variable
TOKEN="tu_token_jwt_aqui"

# Crear partida vs máquina
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"isMachineGame":true}'

# Ver mi partida activa
curl http://localhost:3000/api/games/my-game \
  -H "Authorization: Bearer $TOKEN"

# Ver ranking
curl http://localhost:3000/api/ranking \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Debug y Logs

### Backend

El backend usa `console.log` para debugging. Ver logs en la terminal donde corre el servidor.

```javascript
// Añadir logs temporales en el código
console.log('DEBUG:', variable);
console.error('ERROR:', error);
```

### Frontend

Abrir Developer Tools del navegador:
- **Console**: Ver logs y errores
- **Network**: Ver peticiones HTTP
- **Application → Local Storage**: Ver token guardado

### Socket.IO Debug

- **Console**: Ver logs y errores

## 📝 Flujo de una Partida

### Partida vs Humano

1. Usuario A crea partida: `POST /api/games` con `isMachineGame: false`
2. Backend crea Game con `status: 'waiting'`
3. Socket.IO emite `available_games` a todos
4. Usuario B ve la partida y hace click en "Unirse"
5. Frontend llama `POST /api/games/:id/join`
6. Backend actualiza Game: `player2Id = userB.id`, `status = 'playing'`
7. Socket.IO emite `game_update` a ambos jugadores
8. Ambos usuarios emiten `join_game` con el gameId
9. Juegan 5 rondas (o hasta que alguien gane 3)
10. Backend finaliza partida: `status = 'finished'`, actualiza estadísticas
11. Socket.IO emite `game_update` con estado final

### Partida vs Máquina

1. Usuario crea partida: `POST /api/games` con `isMachineGame: true`
2. Backend crea Game con `player2Id: -1`, `status: 'playing'`
3. Usuario emite `join_game`
4. Usuario juega: emite `play_round` con su elección
5. Backend genera jugada de la máquina aleatoriamente
6. Backend determina ganador y actualiza
7. Se repite hasta finalizar

### URLs de Prueba

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/holaholitafernando
- Backend Socket: ws://localhost:3000

## 💡 Apuntes

### 1. Auto-reload del Backend

El backend usa `--watch` de Node 18+ en lugar de `nodemon` porque odio `nodemon` (lociento fernando). Los cambios en archivos `.js` recargan automáticamente el servidor.

### 2. Hot Module Replacement (HMR) del Frontend

Vite recarga automáticamente al cambiar archivos `.ts` o `.css`.

### 3. Ver Queries SQL

(Como ya va bien lo dejo en false)

Cambiar en `backend/src/config/database.js` :

```javascript
const sequelize = new Sequelize(/*...*/, {
  logging: console.log  // Cambiar de false a console.log
});
```

### 4. Formatear Código

```bash
# Backend
cd backend
npx prettier --write "src/**/*.js"

# Frontend
cd frontend
npx prettier --write "src/**/*.ts"
```

## 📚 Recursos Adicionales

- [Express Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🎓 Conceptos Clave Aprendidos

- **REST API**: Arquitectura de servicios web
- **WebSockets**: Comunicación bidireccional en tiempo real
- **JWT**: Autenticación stateless
- **ORM**: Mapeo objeto-relacional con Sequelize
- **SPA**: Single Page Application
- **Monorepo**: Gestión de múltiples proyectos
- **TypeScript**: Tipado estático en JavaScript

## 📞 Soporte

Si tienes problemas:

1. Revisa esta guía
2. Consulta los logs del backend y frontend
3. Verifica la configuración de `.env`
4. Comprueba que MySQL esté corriendo
5. Lee la documentación oficial de las tecnologías usadas

---

**¡Buena suerte con el proyecto! 🚀**
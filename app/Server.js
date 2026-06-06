import express from 'express';
import cors from 'cors';
import { router as userRoutes } from '../routes/user.js';
import { router as rolRoutes } from '../routes/rolesRoutes.js';
import { router as rolesAsignadosRoutes } from '../routes/rolesAsignadosRoutes.js';
import "../models/associations.js";
import kleur from 'kleur';

class Server {

  constructor() {
    this.app = express();
    this.usuariosPath = '/api/usuarios';
    this.rolesPath = '/api/roles';
    this.rolesAsignados = '/api/rolesasignados';

    //Middlewares
    this.middlewares();

    this.routes();

  }

  middlewares() {
    //En esta sección cargamos una serie de herramientas necesarias para todas las rutas.
    //Para los middlewares como estamos acostumbrados a usarlos en Laravel ver userRoutes y userMiddlewares.
    //Para cors
    this.app.use(cors());
    //Para poder recibir la información que venga del body y parsearla de JSON, necesitamos importar lo siguiente.
    this.app.use(express.json());
    //this.app.use(body_parser.json());
    //this.app.use(body_parser.urlencoded({ extended: false }));
  }

  routes() {
    this.app.use(this.usuariosPath, userRoutes);
    this.app.use(this.rolesPath, rolRoutes);
    this.app.use(this.rolesAsignados, rolesAsignadosRoutes);
  }

  listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(kleur.green().bold(`🟢 Servidor escuchando en: ${process.env.PORT}`));
    })
  }
}

export { Server };
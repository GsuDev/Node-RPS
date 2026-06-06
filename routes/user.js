import { Router } from 'express';
import controlador from '../controllers/userController.js';
export const router = Router();
import { esMayor, otroMiddleware } from '../middlewares/userMiddlewares.js'

//El segundo parámetro (optativo) son los middlewares.
router.get('/', controlador.usuariosGet);
router.get('/:dni', controlador.usuarioGet);
router.post('/', controlador.usuariosPost);
router.put('/:dni', controlador.usuariosPut);
router.delete('/:dni', controlador.usuariosDelete);
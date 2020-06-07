import express from 'express';
import { celebrate, Joi } from 'celebrate'

import PointsController from './controllers/points_controller';
import ItemsController from './controllers/items_controller';

import multer from 'multer';
import multerconfig from './config/multer'

const routes = express.Router();
const upload = multer(multerconfig);

const points_controller = new PointsController();
const items_controller = new ItemsController();

routes.get('/items', items_controller.index);

routes.get('/points', points_controller.index)
routes.post(
  '/points',
  upload.single('image'),
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      whatsapp: Joi.string().required(),
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      city: Joi.string().required(),
      uf: Joi.string().required().max(2),
      items: Joi.string().required().regex(/^\d(,\d)*$/)
    })
  }, {
    abortEarly: false
  }),
  points_controller.create)
routes.get('/points/:id', points_controller.show)

export default routes;
import knex from '../database/connection';
import { Request, Response, json } from 'express';

export default class PointsController {

  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()))

    const points = await knex('points')
      .join('point_items', 'point_id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*')

    const serializedPoints = points.map((point) => {
      return {
        ...point,
        image_url: `http://192.168.42.177:3333/uploads/${point.image}`
      }
    })
    return response.json(serializedPoints)
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex('points').where('id', id).first();

    if (!point) {
      return response.status(400).json({ message: 'Point not found' })
    } else {

      const items = await knex('items')
        .join('point_items', 'items.id', '=', 'point_items.item_id')
        .where('point_items.point_id', id)
        .select('items.title')

      const serializedPoint = {
        ...point,
        image_url: `http://192.168.42.177:3333/uploads/${point.image}`

      }

      return response.json({ point: serializedPoint, items });
    }
  }

  async create(request: Request, response: Response) {

    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items
    } = request.body;

    const point = {
      name,
      image: request.file.filename,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    }
    const trx = await knex.transaction();
    const insertedIds = await trx('points').insert(point)
    console.log('id points: ', insertedIds[0])

    // Já que o comando insert retorna uma array, mesmo que seja um item só,
    // então temos que pegar o primeiro item da array que ele retorna
    const point_id = insertedIds[0]

    const point_items = items
      .split(',')
      .map((item: string) => Number(item.trim()))
      .map((item_id: number) => {
        return {
          item_id,
          point_id
        }
      })
    const pointItems = await trx('point_items').insert(point_items)
    console.log('pointItems: ', pointItems[0])
    await trx.commit();

    return response.json({ id: point_id, ...point });
  }
}

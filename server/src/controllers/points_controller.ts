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

    return response.json(points)
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

      return response.json({ point, items });
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
      image: 'https://images.unsplash.com/photo-1498579397066-22750a3cb424?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
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
    // Já que o comando insert retorna uma array, mesmo que seja um item só
    // então temos que pegar o primeiro item da array que ele retorna
    const point_id = insertedIds[0]

    const point_items = items.map((item_id: number) => {
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

import { Request, Response } from 'express';
import knex from '../database/connection';


export default class ItemController {
  async index(_: Request, response: Response) {
    const items = await knex('items').select();
    const serializedItems = items.map((item) => {
      return {
        id: item.id,
        title: item.title,
        image_url: `http://192.168.42.177:3333/uploads/${item.image}`
      }
    })
    return response.json(serializedItems);
  }
}
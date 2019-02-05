import * as router from 'koa-router'
import * as Koa from 'koa'
import DB from '../../db'
import * as _ from 'lodash'
import { ObjectId } from 'bson'

export async function addClient(
  ctx: Koa.ParameterizedContext<{}, router.IRouterContext> | any,
  next: () => Promise<any>
) {
  const body = _.get(ctx.request, 'body')
  const db: DB = _.get(ctx, 'db')
  const result = await db.getDb().collection('clients')
    .insertOne(body)
  if (!result.insertedCount) {
    ctx.throw(400, "Has error om add clients")

  } else {
    ctx.body = {
      error: false,
      message: 'Clients has add',
      data: result.insertedId
    }
  }
}

export async function getClient(
  ctx: Koa.ParameterizedContext<{}, router.IRouterContext> | any,
  next: () => Promise<any>
) {
  const id = _.get(ctx.params, 'id')
  const db: DB = _.get(ctx, 'db')
  const client = await db.getDb().collection('clietns')
    .findOne({ _id: DB.toObjectId(id) })
  ctx.body = {
    error: false,
    data: client
  }
}


export async function updateClient(
  ctx: Koa.ParameterizedContext<{}, router.IRouterContext> | any,
  next: () => Promise<any>
) {
  const id = _.get(ctx.params, 'id')
  const body = _.get(ctx.request, 'body')
  const db: DB = _.get(ctx, 'db')
  const client = await db.getDb().collection('clietns')
    .findOne({ _id: DB.toObjectId(id) })
  const object = Object.assign(client, body)
  await db.getDb().collection('clients')
    .updateOne({ _id: DB.toObjectId(id) }, object)
  ctx.body = {
    error: false,
    message: "Client update client"
  }
}

export async function deleteClient(
  ctx: Koa.ParameterizedContext<{}, router.IRouterContext> | any,
  next: () => Promise<any>
) {
  const id = _.get(ctx.params, 'id')
  const db: DB = _.get(ctx, 'db')
  await db.getDb().collection('clients')
    .findOneAndDelete({ _id: DB.toObjectId(id) })
  ctx.body = {
    error: false,
    result: 'Client removed'
  }
}

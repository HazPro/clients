import * as Router from 'koa-router'
import * as Koa from 'koa'
import * as winston from 'winston'
import * as bodyparser from 'koa-bodyparser'
import * as _ from 'lodash'
import { Auth } from '@hazpro/auth'
import { Queue, IMessage } from '@hazpro/queue'
import { addClient, getClient, updateClient, deleteClient } from './middleware/clients'
import * as DB from './../db'


import { IConfig } from '../config'


export default class HttpServer {
  httpHandler: Koa
  router: Router
  db: DB.default
  logger: winston.Logger
  config: IConfig
  ca: Auth
  queue: Queue
  /** */
  constructor(
    logger: winston.Logger = null,
    db: DB.default,
    config: IConfig
  ) {
    this.config = config
    this.ca = new Auth(this.config.ca)
    this.db = db
    this.httpHandler = new Koa()
    this.router = new Router()
    this.queue = new Queue(this.config.queue)
    if (!logger) {
      // Create minimal logger fro http
      this.logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [
          new winston.transports.Console({ format: winston.format.simple() })
        ]

      })
    } else {
      this.logger = logger
    }
  }
  async setExtensions(ctx: Koa.Context, next: Function) {
    _.set(ctx, 'config', this.config)
    _.set(ctx, 'ca', this.ca.getCerificate())
    _.set(ctx, 'db', this.db)
    // Templates endpoints
    this.router.post('Add client', '/api/client', this.ca.auth, addClient)
    this.router.get('Read client', '/api/client/:id', this.ca.auth, getClient)
    this.router.put('Update client', '/api/client/:id', this.ca.auth, updateClient)
    this.router.delete('Delete client', '/api/client/:id', this.ca.auth, deleteClient)
    await next()
  }
  async httpLogger(ctx: Koa.Context, next: Function) {
    const start = new Date()
    ctx.logger = this.logger
    await next()
    const ms = new Date().getTime() - start.getTime()
    let logLevel = 'info'
    if (ctx.status >= 500) {
      logLevel = 'error'
    }
    if (ctx.status >= 400) {
      logLevel = 'warn'
    }
    this.logger.log({
      level: logLevel,
      message: ctx.status.toString(),
      meta: {
        method: ctx.method,
        url: ctx.originalUrl,
        ms
      }
    })
  }
  async incomingTask(msg: IMessage) {
    
  }
  async subscribeToTask() {
    await this.queue.open()
    this.queue.consumeQueue('sms', this.incomingTask.bind(this))
  }

  start() {
    this.httpHandler.use(this.setExtensions)
    this.httpHandler.use(this.httpLogger)
    this.httpHandler.use(bodyparser())
    this.httpHandler.use(this.router.routes())
    this.httpHandler.use(this.router.allowedMethods())
    this.httpHandler.listen(this.config.http.port, async () => {
      await this.subscribeToTask()
    })
  }
}
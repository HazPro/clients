import * as db from 'mongodb'

export default class DB {
    private client: db.MongoClient
    private mongoClient: db.MongoClient
    private db: db.Db
    private config: any
    private logger: any
    private url: any
    private connected: Boolean = false
    private tryReconnect: number = 0
    constructor(config: any, logger?: any, mongoClinet?: typeof db.MongoClient) {
        this.config = config
        this.logger = logger
        if (!mongoClinet) {
            this.mongoClient = new db.MongoClient(this.config.db.url, this.config.db.opt || {})
        } else {
            this.url = this.config.db.url
            this.mongoClient = new mongoClinet(this.config.db.url, this.config.db.opt || {})
        }
    }

    async connect(repeats: number = 3) {
        try {
            this.client = (await this.mongoClient.connect(this.url)) as any
            this.db = this.client.db(this.config.db.name)
            this.tryReconnect = 0
            this.connected = true
        } catch (e) {
            if (this.tryReconnect < repeats) {
                this.tryReconnect++
                this.logger.log('warn', `Try reconnect to db server, wait 30 second ${e}`)
                setTimeout(this.connect.bind(this), 100, repeats)
            } else
                this.logger.log('error', 'Cannot connect to db server')
        }
    }
    static toObjectId(value: any): db.ObjectId {
        return new db.ObjectId(value)
    }
    getDb() : db.Db {
        if (this.connected) {
            return this.db
        } else {
            throw new Error('Db not connected')
        }
    }
    isConnected() {
        return this.connected
    }

}
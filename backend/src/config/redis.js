const redis = require('redis');
const { EventEmitter } = require('events');

// Global event bus to emulate Redis Pub/Sub in memory when Redis is offline
const memoryPubSub = new EventEmitter();
const memoryCache = new Map();

// Mock Redis Client for seamless local development without a Redis server
class MockRedisClient {
  constructor(role = 'main') {
    this.role = role;
    this.isOpen = false;
    this.callbacks = new Map();
  }

  async connect() {
    this.isOpen = true;
    console.log(`[Redis Mock (${this.role})] Connected to in-memory fallback pub/sub and cache.`);
    return this;
  }

  async disconnect() {
    this.isOpen = false;
  }

  duplicate() {
    return new MockRedisClient(this.role === 'main' ? 'duplicate' : this.role);
  }

  async set(key, value, options) {
    memoryCache.set(key, String(value));
    return 'OK';
  }

  async get(key) {
    return memoryCache.get(key) || null;
  }

  async del(key) {
    return memoryCache.delete(key);
  }

  async publish(channel, message) {
    memoryPubSub.emit(channel, message);
    return 1;
  }

  async subscribe(channel, callback) {
    const wrapper = (message) => {
      callback(message);
    };
    this.callbacks.set(channel, wrapper);
    memoryPubSub.on(channel, wrapper);
    return;
  }

  async unsubscribe(channel) {
    const callback = this.callbacks.get(channel);
    if (callback) {
      memoryPubSub.off(channel, callback);
      this.callbacks.delete(channel);
    }
  }

  on(event, handler) {
    // Basic event listener stub for Mock Redis
    if (event === 'error') {
      // Don't trigger error events in mock mode
    }
    return this;
  }
}

let redisClient;
let pubClient;
let subClient;

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`Attempting to connect to Redis at ${redisUrl}...`);

  try {
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: false,
        connectTimeout: 1000
      }
    });
    
    // Silence unhandled errors, allowing us to catch them during connect()
    redisClient.on('error', (err) => {
      // console.log('Redis client error stub');
    });

    await redisClient.connect();
    
    // Duplicate clients for pub/sub as required by redis v4+
    pubClient = redisClient;
    subClient = redisClient.duplicate();
    await subClient.connect();

    console.log('Redis connected successfully and duplicated for Pub/Sub!');
  } catch (error) {
    console.warn(`[Redis Connection Warning] Could not connect to real Redis: ${error.message}`);
    console.warn('Falling back to a fully compatible in-memory Redis client mock.');
    
    redisClient = new MockRedisClient('main');
    await redisClient.connect();
    
    pubClient = redisClient;
    subClient = redisClient.duplicate();
    await subClient.connect();
  }

  return { redisClient, pubClient, subClient };
};

const getRedisClient = () => redisClient;
const getPubClient = () => pubClient;
const getSubClient = () => subClient;

module.exports = {
  initRedis,
  getRedisClient,
  getPubClient,
  getSubClient
};

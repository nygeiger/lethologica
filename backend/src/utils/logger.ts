import pino from 'pino'
import  env  from '../config/env.js'

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
   ...(env.NODE_ENV !== 'production' && { target: 'pino-pretty' } )
})

export default logger;
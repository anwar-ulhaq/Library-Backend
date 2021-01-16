import dotenv from 'dotenv'
import fs from 'fs'

import logger from './logger'

if (fs.existsSync('.env')) {
  logger.debug('Using .env file to supply config environment variables')
  dotenv.config({ path: '.env' })
} else {
  logger.debug('Using .env.example file to supply config environment variables')
  dotenv.config({ path: '.env.example' }) // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV
const prod = ENVIRONMENT === 'production' // Anything else is treated as 'dev'

export const SESSION_SECRET = process.env['SESSION_SECRET'] as string
export const JWT_SECRET = process.env['SESSION_SECRET'] as string
export const JWT_PAYLOAD ={
  issuer: '',
  audience: ''
  //algorithms: ['RS256']
}
export const JWT_OPTIONS ={
  issuer: '',
  audience: '',
  complete: true
  //algorithms: ['RS256']
}

//Google
export const GOOGLE_CLIENT_ID = process.env['GOOGLE_CLIENT_ID'] as string
export const GOOGLE_CLIENT_SECRET = process.env['GOOGLE_CLIENT_SECRET'] as string
export const GOOGLE_CALL_BACK_URL_PATH = process.env['GOOGLE_CALL_BACK_URL_PATH'] as string
export const GOOGLE_AUTH_URI = process.env['GOOGLE_AUTH_URI'] as string
export const GOOGLE_TOKEN_URI = process.env['GOOGLE_TOKEN_URI'] as string
//export const GOOGLE_SCOPE = process.env['GOOGLE_SCOPE'] as unknown as [string]
// 1st scope return access_token, refresh_token
// 2nd scope return access_token, id_token
// 3rd scope return access_token, id_token
export const GOOGLE_SCOPE = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/plus.me',
]
export const API_VERSION = process.env['API_VERSION'] as string
export const URL_BASE_PATH =  '/api/' + API_VERSION
export const SALT_WORK_FACTOR = 10

export const MONGODB_URI = (prod
  ? process.env['MONGODB_URI']
  : process.env['MONGODB_URI_LOCAL']) as string

if (!SESSION_SECRET || !JWT_SECRET) {
  logger.error(
    'No client secret. Set SESSION_SECRET or JWT_SECRET environment variable.'
  )
  process.exit(1)
}

if (!MONGODB_URI) {
  if (prod) {
    logger.error(
      'No mongo connection string. Set MONGODB_URI environment variable.'
    )
  } else {
    logger.error(
      'No mongo connection string. Set MONGODB_URI_LOCAL environment variable.'
    )
  }
  process.exit(1)
}
import { Request, Response, NextFunction} from 'express'

import User from '../models/User'
import UserService from '../services/user'
import Roles from '../models/roles'

import {
  NotFoundError,
  BadRequestError,
  InternalServerError, ForbiddenError, UnauthorizedError,
} from '../helpers/apiError'
import {OAuth2Client} from 'google-auth-library'
import {GOOGLE_CALL_BACK_URL_PATH, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_SCOPE} from '../util/secrets'

const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALL_BACK_URL_PATH,
)

/*export const findAllUsers = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    response.json( await UserService.findAll() )
  }
  catch ( error ) {
    next( new NotFoundError('No User found'))
  }
}*/

export const createUser = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, username, email, password } = request.body
    if (
      ! firstName ||
      ! lastName ||
      ! username ||
      ! email ||
      ! password
    ){
      next( new BadRequestError('Some details missing'))
    } else {
      if ( ! await UserService.findByUsername(username) && ! await UserService.findByEmail(email)){
        const role = Roles.USER
        const newUser = new User({
          firstName, lastName, username, email, password, role,
        })
        await  UserService.create(newUser)
          .then( user => {
            /* istanbul ignore else */
            if ( user ) {
              response.json(user)
            }
          })
      } else {
        // TODO Create ConflictError in apiError
        response.statusMessage = 'Conflict'
        response.statusCode = 409
        response.end()
      }

    }

  } catch ( error ) {
    // TODO Proper error handling
    /* istanbul ignore next */
    next( error )
  }
}


export const login = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const credentialsObject = JSON.parse(Buffer.from(request.headers['credentials'] as string, 'base64').toString('utf8'))
    const {username, password} = credentialsObject
    if (!username || !password) {
      next(new BadRequestError('Invalid username or password'))
    } else {
      await UserService.authenticate(username, password)
        .then(user => {
          /* istanbul ignore else */
          if ( user )  response.json(user)
        })
    }
  } catch (error) {
    next(new ForbiddenError('Wrong credentials'))
  }
}

export const googleAuth = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    //TODO move it to env and secret
    access_type: 'offline',
    scope: GOOGLE_SCOPE
  })
  response.redirect(authorizeUrl)
}


export const googleAuthCallBack = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const code: string = request.query.code
  //TODO Move all following functionality to ??
  if ( !code ){
    next( new BadRequestError('code missing'))
  } else {
    await oAuth2Client.getToken(code)
      .then(async tokenObject => {
        oAuth2Client.setCredentials(tokenObject.tokens)
        await oAuth2Client.verifyIdToken({
          audience: GOOGLE_CLIENT_ID,
          idToken: tokenObject.tokens.id_token as string
        })
          .then(loginTicket => {
            const userDetails = loginTicket.getPayload()
            if (userDetails) {
              if (!userDetails.given_name
                || !userDetails.family_name
                || !userDetails.sub
                || !userDetails.email
                || !userDetails.hd
              ) {
                next(new BadRequestError('First Name, Last Name, Username, email or domain is missing.'))
              } else {
                UserService.generateToken(
                  userDetails.given_name,
                  userDetails.family_name,
                  userDetails.sub,
                  userDetails.email,
                  userDetails.hd)
                  .then(jwtToken => {
                    response.json({'token': jwtToken})
                  })
              }
            } else {
              next(new BadRequestError('User details are missing from ticket'))
            }
          })
          //.catch(error => next(error))
      })
      .catch(error => {
        next(new UnauthorizedError())
      })
  }
}
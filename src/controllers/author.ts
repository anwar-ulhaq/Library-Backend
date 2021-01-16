import { Request, Response, NextFunction } from 'express'

import Author from '../models/Author'
import AuthorService from '../services/author'

import {
  BadRequestError,
} from '../helpers/apiError'

export const createAuthor = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName } = request.body
    if (!firstName || !lastName ) {
      next(new BadRequestError('Invalid firstName or lastName'))
    }else {
      if ( !await AuthorService.isAuthorExist(firstName, lastName) ) {
        await AuthorService.create(new Author({firstName, lastName}))
          .then(author => {
            /* istanbul ignore else */
            if (author) {
              response.json(author)
            }})
      } else {
        // TODO Create ConflictError in apiError
        response.statusMessage = 'Conflict'
        response.statusCode = 409
        response.end()
      }

    }
  } catch (error) {
    /* istanbul ignore next */
    next( error )
  }
}

export const updateAuthor = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    //TODO check author by id if it exists
    await AuthorService.update(request.body)
      .then(author => {
        /* istanbul ignore else */
        if (author) {
          response.statusCode = 201
          response.json(author)
        }
      })
  } catch ( error ) {
    // TODO Proper error handling
    next( error )
  }
}

export const deleteAuthor = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    if (request.body.id) {
      await AuthorService.deleteAuthor(request.body.id)
        .then( () => {
          response.statusMessage = 'Deleted successfully'
          response.statusCode = 204
          response.end()
        })
    } else {
      next(new BadRequestError('Author id is missing'))
    }
  } catch ( error ) {
    // TODO Proper error handling
    /* istanbul ignore next */
    next( error )
  }
}

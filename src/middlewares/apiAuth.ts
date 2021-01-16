import jwt from 'jsonwebtoken'
import {NextFunction, Request, Response} from 'express'
import {JWT_SECRET} from '../util/secrets'
import {ForbiddenError, InternalServerError} from '../helpers/apiError'
import Roles from '../models/roles'


export const verifyToken = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const token: string  = request.headers['x-access-token'] as string
  if (!token){
    return response.status(403).send({
      message: 'Token not provided.'
    })
  }
  jwt.verify(token, JWT_SECRET,{complete: true}, (error, decoded)=>{
    if (error){
      return response.status(500).send({message: 'Internal Server Error ' + error})
    }
    next()
  })
}


export const accessByAdminOnly = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const token: string  = request.headers['x-access-token'] as string
  if (!token){
    // TODO use apiError
    return response
      .status(403)
      .send({message: 'Token not provided.'})
  }
  jwt.verify(token, JWT_SECRET, {complete:true}, (error, decoded: any)=>{
    if (error){
      return response
        .status(400)
        .send({message: error})
    }
    if ( decoded.payload.role === Roles.ADMIN){
      request.body.userId = decoded.payload.id
      request.body.userRole = decoded.payload.role
      next()
    } else {
      next(new ForbiddenError('Only Admins can access.') )
    }


  })
}

export const accessByUserAndAdmin = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const token: string  = request.headers['x-access-token'] as string
  if (!token){
    response.json(new ForbiddenError('Token missing'))
  } else {
    jwt.verify(token, JWT_SECRET, {complete:true}, (error, decoded: any)=>{
      if (error){
        response.json(new InternalServerError(` ${error}`))
      } else {
        if (decoded.payload.role === Roles.ADMIN || decoded.payload.role === Roles.USER) {
          request.body.userId = decoded.payload.id
          request.body.userRole = decoded.payload.role
          next()
        } else {
          response.json(new ForbiddenError('Forbidden. Login in first.'))
        }
      }
    })
  }
}

export const accessByDeveloper = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const token: string  = request.headers['x-access-token'] as string
  if (!token){
    response.json(new ForbiddenError('Token missing'))
  } else {
    jwt.verify(token, JWT_SECRET, {complete:true}, (error, decoded: any)=>{
      if (error){
        response.json(new InternalServerError(` ${error}`))
      } else {
        if (decoded.payload.role === Roles.DEVELOPER) {
          request.body.userId = decoded.payload.id
          request.body.userRole = decoded.payload.role
          next()
        } else {
          response.json(new ForbiddenError('Forbidden. Login in first.'))
        }
      }
    })
  }
}
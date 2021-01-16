import * as dbHelper from '../db-helper'
import User from '../../src/models/User'
import UserService from '../../src/services/user'

import {Schema} from 'mongoose'
import Roles from '../../src/models/Roles'
import jwt from 'jsonwebtoken'
import {JWT_SECRET} from '../../src/util/secrets'

let testCount = 1
const userTest = 'User service test No. '

const nonExistingId = '5e57b77b5744fa0b461c7906'
const userId = '5e57b77b5744fa0b461c7907' as unknown as Schema.Types.ObjectId
const fakeUserId = '5e57b77b5744fa0b461c7908' as unknown as Schema.Types.ObjectId

async function createUser() {
  const newUser = new User({
    firstName: 'user firstName',
    lastName: 'user lastName',
    username: '123-username',
    email: 'admin@abc.com',
    password: 't0pS33c8#t',
    role: 1
  })

  return await UserService.create(newUser)
}

describe( 'User service', () => {
  beforeEach(async () => {
    await dbHelper.connect()
  })

  afterEach(async () => {
    await dbHelper.clearDatabase()
  })

  afterAll(async () => {
    await dbHelper.closeDatabase()
  })

  // Test # 52
 it('should create a user', async () => {
   console.log(userTest + testCount)
   testCount++
   return await createUser()
     .then( newUser => {
       expect(newUser).toHaveProperty('id')
       expect(newUser.id).toHaveLength(24)
       expect(newUser).toHaveProperty('firstName', 'user firstName')
       expect(newUser).toHaveProperty('lastName', 'user lastName')
       expect(newUser).toHaveProperty('username', '123-username')
       expect(newUser).toHaveProperty('email', 'admin@abc.com')
       expect(newUser).toHaveProperty('role', 1)
     })

 })

  it ('should create a token from id  and role', async () => {
    console.log(userTest + testCount)
    testCount++
    const token: string = UserService.createToken(String(userId), Roles.USER)
    jwt.verify(token, JWT_SECRET, {complete:true}, (error, decoded: any)=>{
      expect(decoded.payload.role).toBe(Roles.USER)
      expect(decoded.payload.id).toBe(String(userId))
    })
  })

  it('should generate token from details provided by google', async () => {
    console.log(userTest + testCount)
    testCount++
    const user = await createUser()
    const domainName = 'integrify.io'   //It will decide user role

    return await UserService.generateToken(
      user.firstName, 
      user.lastName, 
      user.username, 
      user.email, 
      domainName
    ).then( token => {
      jwt.verify(token, JWT_SECRET, {complete:true}, (error, decoded: any)=>{
        expect(decoded.payload.role).toBe(Roles.ADMIN)
        expect(decoded.payload.id).toBe(user.username)
      })
    })
  })

  it ('should get a error if username is not be found from google details', async () => {
    console.log(userTest + testCount)
    testCount++
    const nonExistingUser = new User({
      firstName: 'user firstName',
      lastName: 'user lastName',
      username: '123-username',
      email: 'admin@abc.com',
      password: 't0pS33c8#t',
      role: 1
    })

    return await UserService.generateToken(
      nonExistingUser.firstName,
      nonExistingUser.lastName,
      nonExistingUser.username,
      nonExistingUser.email,
      'integrify.io'
    ).catch( error => {
      expect(error.message).toBe('user not found')
    })

  })

  it ('should find a user by username', async () => {
    console.log(userTest + testCount)
    testCount++
    const newUser = await createUser()
    return await UserService.findByUsername(newUser.username).then( user => {
        if (user) {
          expect(user.username).toBe(newUser.username)
        }
      })
  })

  it ('should find a user by email', async () => {
    console.log(userTest + testCount)
    testCount++
    const newUser = await createUser()
    return await UserService.findByEmail(newUser.email).then( user => {
      if (user) {
        expect(user.email).toBe(newUser.email)
      }
    })
  })
  
 it('should return token with correct username and password', async () => {
   const newUser = await createUser()
   return await UserService.authenticate(newUser.username, 't0pS33c8#t')
     .then( user => {
       expect(user).toHaveProperty('token')
       expect(user.token).toBeDefined()
       jwt.verify(user.token, JWT_SECRET, {complete:true}, (error, decoded: any)=>{
         expect(decoded.payload.role).toBe(Roles.USER)
         expect(decoded.payload.id).toBe(String(user.id))
       })
     })
 })

  it('should get a error with incorrect username and password', async () => {
    const newUser = await createUser()
    return await UserService.authenticate(newUser.username, 'wrongPassword')
      .catch( error => {
        expect(error.message).toBe('User verification failed')
      })
  })
})
import request from 'supertest'

import app from '../../src/app'
import * as dbHelper from '../db-helper'
import {AuthorDocument} from '../../src/models/Author'
import User from '../../src/models/User'
import UserService from '../../src/services/user'

const getAdminToken = async (): Promise<string> => {
  const newUser = new User({
    firstName: 'admin firstName',
    lastName: 'admin lastName',
    username: '123-username',
    email: 'admin@abc.com',
    password: 't0pS33c8#t',
    role: 0
  })
  const createdUser = await UserService.create(newUser)
  return UserService.createToken(String(createdUser.id), createdUser.role)
}

const adminToken = getAdminToken()

const getUserToken = async (): Promise<string> => {
  const newUser = new User({
    firstName: 'user firstName',
    lastName: 'user lastName',
    username: '456-username',
    email: 'user@abc.com',
    password: 't0pS33c8#t',
    role: 1
  })
  const createdUser = await UserService.create(newUser)
  return UserService.createToken(String(createdUser.id), createdUser.role)
}

const userToken = getUserToken()

const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ8.eyJpZCI6IjVlZmE4YzNmNjM1OTQ0MDcyZTBjNDliNSIsInJvbGUiOjEsImlhdCI6MTU5MzQ3ODIwOCwiZXhwIjoxNTkzNTY0NjA4fQ.4A6KjQjCtxu24xfevgnIXzlzOnAraNrEd2p4nZG3zhE'

async function createAuthor( override?: Partial<AuthorDocument>) {
  let author = {
    firstName: 'test-author-firstName',
    lastName: 'test-author-lastName'
  }
  if (override) {
    author = { ...author, ...override }
  }

  return await request(app)
    .post('/api/v1/author')
    .set('x-access-token', await adminToken )
    .send(author)
}


describe('author controller', () => {

  beforeEach(async () => {
    await dbHelper.connect()
  })

  afterEach(async () => {
    await dbHelper.clearDatabase()
  })

  afterAll(async () => {
    await dbHelper.closeDatabase()
  })

  it('should create a author', async () => {
    const responseOfCreateAuthor = await createAuthor()
    expect(responseOfCreateAuthor.status).toBe(200)
    expect(responseOfCreateAuthor.body).toHaveProperty('id')
    expect(responseOfCreateAuthor.body).toHaveProperty('firstName', 'test-author-firstName')
    expect(responseOfCreateAuthor.body).toHaveProperty('lastName', 'test-author-lastName')
  })

  it('should get a error if author already exists', async () => {
    await createAuthor()

    const response = await createAuthor()
    expect(response.status).toBe(409)

  })

  it('should get a error if author firstName or lastName is missing while creating author', async () => {
    const incompleteAuthor = {
      firstName: undefined,
      lastName: 'test-author-lastName'
    }
    const response = await createAuthor(incompleteAuthor)
    expect(response.status).toBe(400)
  })

  it('should not create a author if request is made by user (non Admin) and get a error' , async () => {
    const poorAuthor = {
      firstName: 'test-author-firstName',
      lastName: 'test-author-lastName'
    }
     const responseOfCreateAuthor = await request(app)
       .post('/api/v1/author')
       .set('x-access-token', await userToken )
       .send(poorAuthor)
    expect(responseOfCreateAuthor.body.statusCode).toEqual(403)
    expect(responseOfCreateAuthor.body.message).toMatch('Only Admins can access.')
  })

  it('should not create a author if token is fake' , async () => {
    const poorAuthor = {
      firstName: 'test-author-firstName',
      lastName: 'test-author-lastName'
    }
    const responseOfCreateAuthor = await request(app)
      .post('/api/v1/author')
      .set('x-access-token', fakeToken )
      .send(poorAuthor)

    expect(responseOfCreateAuthor.status).toBe(400)
    expect(responseOfCreateAuthor.body.message.message).toMatch('invalid token')
  })

  it('should not create a author token is missing' , async () => {
    const poorAuthor = {
      firstName: 'test-author-firstName',
      lastName: 'test-author-lastName'
    }
    const responseOfCreateAuthor = await request(app)
      .post('/api/v1/author')
      .send(poorAuthor)
    expect(responseOfCreateAuthor.status).toBe(403)
    expect(responseOfCreateAuthor.body.message).toMatch('Token not provided.')

  })

  it ('should update a author', async () => {
    const responseOfCreateAuthor = await createAuthor()
    const updateAuthor = {
      id: responseOfCreateAuthor.body.id,
      firstName: 'update-author-firstName',
      lastName: 'update-author-lastName'
    }

    const responseOfUpdateAuthor = await request(app)
      .put('/api/v1/author')
      .set('x-access-token', await adminToken )
      .send(updateAuthor)

    expect(responseOfUpdateAuthor.status).toEqual(201)
    expect(responseOfUpdateAuthor.body).toHaveProperty('firstName', updateAuthor.firstName)
    expect(responseOfUpdateAuthor.body).toHaveProperty('lastName', updateAuthor.lastName)
  })

  it('should not update a author if request is made by user and get a error' , async () => {
    const responseOfCreateAuthor = await createAuthor()
    const updateAuthor = {
      id: responseOfCreateAuthor.body.id,
      firstName: 'update-author-firstName',
      lastName: 'update-author-lastName'
    }

    const responseOfUpdateAuthor = await request(app)
      .put('/api/v1/author')
      .set('x-access-token', await userToken )
      .send(updateAuthor)
    expect(responseOfUpdateAuthor.body.statusCode).toEqual(403)
    expect(responseOfUpdateAuthor.body.message).toMatch('Only Admins can access.')
  })

  it('should not update a author if token is fake' , async () => {
    const responseOfCreateAuthor = await createAuthor()
    const updateAuthor = {
      id: responseOfCreateAuthor.body.id,
      firstName: 'update-author-firstName',
      lastName: 'update-author-lastName'
    }

    const responseOfUpdateAuthor = await request(app)
      .put('/api/v1/author')
      .set('x-access-token', fakeToken )
      .send(updateAuthor)
    expect(responseOfUpdateAuthor.status).toBe(400)
    expect(responseOfUpdateAuthor.body.message.message).toMatch('invalid token')
  })

  it('should not update a author token is missing' , async () => {
    const responseOfCreateAuthor = await createAuthor()
    const updateAuthor = {
      id: responseOfCreateAuthor.body.id,
      firstName: 'update-author-firstName',
      lastName: 'update-author-lastName'
    }

    const responseOfUpdateAuthor = await request(app)
      .put('/api/v1/author')
      .send(updateAuthor)
    expect(responseOfUpdateAuthor.status).toBe(403)
    expect(responseOfUpdateAuthor.body.message).toMatch('Token not provided.')

  })

  it('should get error id author id is missing in update', async () => {
    await createAuthor()
    const updateAuthor = {
      firstName: 'update-author-firstName',
      lastName: 'update-author-lastName'
    }

    const responseOfUpdateAuthor = await request(app)
      .put('/api/v1/author')
      .set('x-access-token', await adminToken )
      .send(updateAuthor)

    expect(responseOfUpdateAuthor.body.statusCode).toEqual(400)
    expect(responseOfUpdateAuthor.body.message).toMatch('Author id is missing')
  })

  it('should delete a author', async () => {
    const responseOfCreateAuthor = await createAuthor()
    const responseOfDeleteAuthor = await request(app)
      .delete('/api/v1/author')
      .set('x-access-token', await adminToken )
      .send({id: responseOfCreateAuthor.body.id })

    expect(responseOfDeleteAuthor.status).toEqual(204)
  })

  it('should get error if author id is missing when deleting author', async () => {
    await createAuthor()

    const responseOfDeleteAuthor = await request(app)
      .delete('/api/v1/author')
      .set('x-access-token', await adminToken )
      .send({id: undefined })

    expect(responseOfDeleteAuthor.body.statusCode).toEqual(400)
    expect(responseOfDeleteAuthor.body.message).toMatch('Author id is missing')
  })

  it('should not delete a author if request is made by user and get a error' , async () => {
    const responseOfCreateAuthor = await createAuthor()

    const responseOfDeleteAuthor = await request(app)
      .delete('/api/v1/author')
      .set('x-access-token', await userToken )
      .send({id: responseOfCreateAuthor.body.id })

    expect(responseOfDeleteAuthor.body.statusCode).toEqual(403)
    expect(responseOfDeleteAuthor.body.message).toMatch('Only Admins can access.')
  })

  it('should not delete a author if token is fake' , async () => {
    const responseOfCreateAuthor = await createAuthor()

    const responseOfDeleteAuthor = await request(app)
      .delete('/api/v1/author')
      .set('x-access-token', fakeToken)
      .send({id: responseOfCreateAuthor.body.id })

    expect(responseOfDeleteAuthor.status).toBe(400)
    expect(responseOfDeleteAuthor.body.message.message).toMatch('invalid token')
  })

  it('should not delete a author if token is missing' , async () => {
    const responseOfCreateAuthor = await createAuthor()

    const responseOfDeleteAuthor = await request(app)
      .delete('/api/v1/author')
      .send({id: responseOfCreateAuthor.body.id })
    expect(responseOfDeleteAuthor.status).toBe(403)
    expect(responseOfDeleteAuthor.body.message).toMatch('Token not provided.')
  })
})
import request from 'supertest'

import app from '../../src/app'
import * as dbHelper from '../db-helper'
import {BookDocument} from '../../src/models/Book'
import User from '../../src/models/User'
import UserService from '../../src/services/user'
import BookCategory from '../../src/models/BookCategory'
import BookStatus from '../../src/models/BookStatus'
import {AuthorDocument} from '../../src/models/Author'

const nonExistingId = '5e57b77b5744fa0b461c7906'

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

const createUser = async () => {
  const newUser = new User({
    firstName: 'user firstName',
    lastName: 'user lastName',
    username: '456-username',
    email: 'user@abc.com',
    password: 't0pS33c8#t',
    role: 1
  })
  return await UserService.create(newUser)
}

const getUserToken = async (): Promise<string> => {
  const createdUser = await createUser()
  return UserService.createToken(String(createdUser.id), createdUser.role)
}

const userToken = getUserToken()

const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ8.eyJpZCI6IjVlZmE4YzNmNjM1OTQ0MDcyZTBjNDliNSIsInJvbGUiOjEsImlhdCI6MTU5MzQ3ODIwOCwiZXhwIjoxNTkzNTY0NjA4fQ.4A6KjQjCtxu24xfevgnIXzlzOnAraNrEd2p4nZG3zhE'

async function createBook(override?: Partial<BookDocument>) {

  let newBook = {
    title: 'title',
    description: 'description',
    publisher: 'publisher',
    ISBN: 'ISBN',
    publishedDate: new Date('2020-08-15T01:51:27.673Z'),
    authors: [{
      firstName: 'test-author-firstName',
      lastName: 'test-author-lastName'
    }],
    category: 'ART',
    status: 'AVAILABLE',
  }

  if (override) {
    newBook = { ...newBook, ...override }
  }

  return await  request(app)
    .post('/api/v1/book')
    .set('x-access-token', await adminToken )
    .send(newBook)
}



describe ('book controller', () => {
  beforeEach(async () => {
    await dbHelper.connect()
  })

  afterEach(async () => {
    await dbHelper.clearDatabase()
  })

  afterAll(async () => {
    await dbHelper.closeDatabase()
  })

  it ('should create a book', async () => {
    const responseOfCreateBook = await createBook()

    expect(responseOfCreateBook.status).toBe(200)
    expect(responseOfCreateBook.body).toHaveProperty('id')
    expect(responseOfCreateBook.body).toHaveProperty('title', 'title')
    expect(responseOfCreateBook.body).toHaveProperty('description', 'description')
    expect(responseOfCreateBook.body).toHaveProperty('publisher', 'publisher')
    expect(responseOfCreateBook.body).toHaveProperty('ISBN', 'ISBN')
    expect(responseOfCreateBook.body).toHaveProperty('publishedDate', '2020-08-15T01:51:27.673Z')
    expect(responseOfCreateBook.body).toHaveProperty('category', BookCategory.ART)
    expect(responseOfCreateBook.body).toHaveProperty('status', BookStatus.AVAILABLE)
    expect(responseOfCreateBook.body).toHaveProperty('authors')
    expect(typeof responseOfCreateBook.body.authors).toBe('object')
    expect.arrayContaining(responseOfCreateBook.body.authors)
    expect(responseOfCreateBook.body.authors).toHaveLength(1)
    expect(responseOfCreateBook.body.authors[0]).toHaveProperty('id', )
    expect(responseOfCreateBook.body.authors[0]).toHaveProperty('firstName', 'test-author-firstName')
    expect(responseOfCreateBook.body.authors[0]).toHaveProperty('lastName', 'test-author-lastName')
  })

  it('should get a error if details are missing while creating a book', async () => {
    const incompleteBook = {
      ISBN: ''
    }

    const responseOfIncompleteBook = await createBook(incompleteBook)
    expect(responseOfIncompleteBook.body.statusCode).toEqual(400)
    expect(responseOfIncompleteBook.body.message).toMatch('Title, Description, Publisher, Author, ISBN or Published date missing.')

  })

  it ('should get an error if book is already exists', async () =>{
    await createBook()

    const responseOfCreateBook = await createBook()
    expect(responseOfCreateBook.status).toEqual(409)

  })

  it('should get a error if book author is missing', async () => {
    const bookWrittenByGhost = {
      title: 'The Ghost Life',
      description: 'An autobiography of Ghost.',
      publisher: 'Rent a Ghost',
      ISBN: 'X<>X><X><X><X<>X',
      publishedDate: new Date('2020-08-15T01:51:27.673Z'),
      authors: [] as unknown  as [AuthorDocument],
      category: 'AUTOBIOGRAPHY',
      status: 'AVAILABLE',
    }

    const responseOfIncompleteBook = await createBook(bookWrittenByGhost)
    expect(responseOfIncompleteBook.body.statusCode).toEqual(400)
    expect(responseOfIncompleteBook.body.message).toMatch('Author details are required')

  })

  it('should get a error if book author first name or last name is missing', async () => {
    const incompleteBook = {
      authors: [{
        firstName: undefined,
        lastName: 'test-author-lastName'
      }] as unknown as [AuthorDocument]
    }

    const responseOfIncompleteBook = await createBook(incompleteBook)
    expect(responseOfIncompleteBook.body.statusCode).toEqual(400)
    expect(responseOfIncompleteBook.body.message).toMatch('author first or last name missing')

  })

  it('should get a error if service failed to create a book', async () => {
    const bookWithUnknownCategory = {
      category: 'BLAABLAA'
    }

    const responseOfCreateBook = await createBook(bookWithUnknownCategory)
    expect(responseOfCreateBook.status).toBe(500)

  })

  it ('should get error if user is not admin ', async () => {
    const newBook = {
      title: 'title',
      description: 'description',
      publisher: 'publisher',
      ISBN: 'ISBN',
      publishedDate: new Date('2020-08-15T01:51:27.673Z'),
      authors: [{
        firstName: 'test-author-firstName',
        lastName: 'test-author-lastName'
      }],
      category: 'ART',
      status: 'AVAILABLE',
    }

    const responseOfCreateBook = await request(app)
      .post('/api/v1/book')
      .set('x-access-token', await userToken)
      .send(newBook)

    //console.log('responseOfCreateBook: ' + responseOfCreateBook)
    expect(responseOfCreateBook.body.statusCode).toEqual(403)
    expect(responseOfCreateBook.body.message).toMatch('Only Admins can access.')
  })

  it('should not create a book if token is fake' , async () => {
    const newBook = {
      title: 'title',
      description: 'description',
      publisher: 'publisher',
      ISBN: 'ISBN',
      publishedDate: new Date('2020-08-15T01:51:27.673Z'),
      authors: [{
        firstName: 'test-author-firstName',
        lastName: 'test-author-lastName'
      }],
      category: 'ART',
      status: 'AVAILABLE',
    }

    const responseOfCreateBook = await request(app)
      .post('/api/v1/book')
      .set('x-access-token', fakeToken)
      .send(newBook)

    expect(responseOfCreateBook.status).toBe(400)
    expect(responseOfCreateBook.body.message.message).toMatch('invalid token')
  })

  // TODO Mock .push function

  // TODO Mock BookService and throw a error

  // Find All
  it('should get an array of books', async () =>{
    await createBook()

    const anotherBook = {
      ISBN: '1123adfsagsd'
    }
    await createBook(anotherBook)

    const findAllResponse = await request(app)
      .get('/api/v1/books')
      .send()

    expect(typeof findAllResponse.body).toBe('object')
    expect.arrayContaining(findAllResponse.body)
    expect(findAllResponse.body).toHaveLength(2)
    expect(findAllResponse.body[0]).toHaveProperty('id', )
    expect(findAllResponse.body[1]).toHaveProperty('id', )

  })

  it('should get a error if no book is present in DB', async () => {
    const findAllResponse = await request(app)
      .get('/api/v1/books')
      .send()

    //console.log('findAllResponse: ' + JSON.stringify(findAllResponse))
    expect(findAllResponse.body.statusCode).toBe(404)
    expect(findAllResponse.body.message).toMatch('No Book found')

  })

  // Find by ISBN
  it('should get a book by ISBN', async () =>{
    await createBook()

    const findByISBNResponse  = await request(app)
      .get('/api/v1/book')
      .query( { ISBN: 'ISBN'})
      .send()

    expect(findByISBNResponse.body).toHaveProperty('ISBN', 'ISBN' )

  })

  it('should get a error if ISBN is missing', async () => {
    await createBook()

    const findByISBNResponse = await request(app)
      .get('/api/v1/book')
      .send()

    expect(findByISBNResponse.body.statusCode).toBe(400)
    expect(findByISBNResponse.body.message).toMatch('ISBN missing')

  })

  it('should get a error if ISBN is not in DB', async () => {
    await createBook()

    const findByISBNResponse = await request(app)
      .get('/api/v1/book')
      .query({ISBN: 'nonExistingISBN'})
      .send()

    expect(findByISBNResponse.body.statusCode).toBe(404)
    expect(findByISBNResponse.body.message).toMatch('Could not find book with given ISBN number')

  })

  // Update Book
  it('should update a book', async () => {
    const responseOfCreateBook = await createBook()

    const updateBook = {
      id: responseOfCreateBook.body.id,
      title: 'update-title',
      authors: [{
        id: responseOfCreateBook.body.authors[0].id,
        firstName: 'update-author-firstName',
        lastName: 'test-author-lastName'
      }],
    }

    const responseOfUpdateBook = await request(app)
      .put('/api/v1/book')
      .set('x-access-token', await adminToken )
      .send(updateBook)
    expect(responseOfUpdateBook.status).toEqual(201)
    expect(responseOfUpdateBook.body)
      .toHaveProperty('title', updateBook.title)
    expect(responseOfUpdateBook.body.authors[0])
      .toHaveProperty('firstName', updateBook.authors[0].firstName)

  })

  it('should get an error if update book fails', async () => {
    const responseOfCreateBook = await createBook()

    const updateBook = {
      id: responseOfCreateBook.body.id,
      title: 'update-title',
      authors: [{
        id: responseOfCreateBook.body.authors[0].id,
        firstName: 'update-author-firstName',
      }],
    }

    const responseOfUpdateBook = await request(app)
      .put('/api/v1/book')
      .set('x-access-token', await adminToken )
      .send(updateBook)

    expect(responseOfUpdateBook.status).toEqual(500)

  })

  // TODO should not update a book with user token
  // TODO should not update a book with fake token

  // Delete Book
  it('should delete a book', async () => {
    const responseOfCreateBook = await createBook()

    const requestBody = {
      id: responseOfCreateBook.body.id,
    }

    const responseOfDeleteBook = await request(app)
      .delete('/api/v1/book')
      .set('x-access-token', await adminToken )
      .send(requestBody)
    //console.log('responseOfDeleteBook: ' + JSON.stringify(responseOfDeleteBook))
    expect(responseOfDeleteBook.status).toEqual(204)

  })

  it('should get a error with wrong or non-existing book', async () => {

    const requestBody = {
      id: nonExistingId,
    }

    const responseOfDeleteBook = await request(app)
      .delete('/api/v1/book')
      .set('x-access-token', await adminToken )
      .send(requestBody)

    expect(responseOfDeleteBook.status).toEqual(404)

  })

  it('should get a error if book id is missing from request', async () => {

    const requestBody = {
      id: undefined,
    }

    const responseOfDeleteBook = await request(app)
      .delete('/api/v1/book')
      .set('x-access-token', await adminToken )
      .send(requestBody)

    expect(responseOfDeleteBook.body.statusCode).toEqual(400)
    expect(responseOfDeleteBook.body.message).toBe('Book id missing')

  })

  // checkoutBook
  // it should assign a book to user
  it('should lend a book to a user', async () => {
    const responseOfCreateBook = await createBook()

    const requestBody = {
      bookId: responseOfCreateBook.body.id
    }

    const responseOfCheckoutBook = await request(app)
      .post('/api/v1/book/checkout')
      .set('x-access-token', await userToken )
      .send(requestBody)

    // TODO option B, get userId from token and check against borrowerId
    expect(responseOfCheckoutBook.body.borrowerId).toBeDefined()
    expect(responseOfCheckoutBook.body.borrowerId).not.toBe('000000000000000000000000')
    expect(responseOfCheckoutBook.body.status).toBe(BookStatus.BORROWED)
    expect(responseOfCheckoutBook.body.borrowedDate).toBeDefined()
  })

  //it should not lend a book if book is already borrowed
  it('should not lend a book if book is already borrowed', async () => {
    const responseOfCreateBook = await createBook()

    const requestBody = {
      bookId: responseOfCreateBook.body.id
    }

    await request(app)
      .post('/api/v1/book/checkout')
      .set('x-access-token', await userToken )
      .send(requestBody)

    const responseOfCheckoutBook = await request(app)
      .post('/api/v1/book/checkout')
      .set('x-access-token', await userToken )
      .send(requestBody)

    //console.log('responseOfCheckoutBook: '+ JSON.stringify(responseOfCheckoutBook))
    expect(responseOfCheckoutBook.body.statusCode).toBe(500)
    expect(responseOfCheckoutBook.body.message).toMatch('Error: Book already borrowed')

  })

  //it should get a error if BookId is missing
  it('should get a error if bookId is missing', async () => {

    const requestBody = {
      bookId: undefined
    }

    const responseOfCheckoutBook = await request(app)
      .post('/api/v1/book/checkout')
      .set('x-access-token', await userToken )
      .send(requestBody)

    expect(responseOfCheckoutBook.body.statusCode).toBe(400)
    expect(responseOfCheckoutBook.body.message).toMatch('Book id missing')

  })
  //it should get a error if token is missing
  //it should get a error if token is fake


  // Return book
  // it should return a borrowed book
  it('should return a borrow book', async () => {
    const responseOfCreateBook = await createBook()
    const token = await userToken
    const requestBody = {
      bookId: responseOfCreateBook.body.id
    }

    await request(app)
      .post('/api/v1/book/checkout')
      .set('x-access-token', token )
      .send(requestBody)

    const responseOfReturnBook = await request(app)
      .post('/api/v1/book/return')
      .set('x-access-token', token )
      .send(requestBody)

    expect(responseOfReturnBook.body.borrowerId).toBe('000000000000000000000000')
    expect(responseOfReturnBook.body.status).toBe(BookStatus.AVAILABLE)
    expect(responseOfReturnBook.body.borrowedDate).toBeNull()

  })

  // it should get a error if userId is other then borrowerId and role is user
  it('should get a error if userId is other then borrowerId and role is user', async () => {
    const responseOfCreateBook = await createBook()

    const requestBody = {
      bookId: responseOfCreateBook.body.id
    }

    await request(app)
      .post('/api/v1/book/checkout')
      .set('x-access-token', await userToken )
      .send(requestBody)

    const newUser = await createUser()
    const newUserToken = await UserService.createToken(String(newUser.id), newUser.role)

    const responseOfReturnBook = await request(app)
      .post('/api/v1/book/return')
      .set('x-access-token', newUserToken )
      .send(requestBody)

    //expect(responseOfReturnBook.body.statusCode).toBe(403)
    expect(responseOfReturnBook.body.message).toMatch('Error: No rights to return this book')

  })

  // it should get a error if book id is missing
  it('should get a error if book id is missing', async () => {

    const requestBody = {
      bookId: undefined
    }

    await request(app)
      .post('/api/v1/book/checkout')
      .set('x-access-token', await userToken )
      .send(requestBody)

    const responseOfReturnBook = await request(app)
      .post('/api/v1/book/return')
      .set('x-access-token', await userToken )
      .send(requestBody)

    expect(responseOfReturnBook.body.statusCode).toBe(400)
    expect(responseOfReturnBook.body.message).toMatch('Book id missing')

  })
})
import * as dbHelper from '../db-helper'
import Author from '../../src/models/Author'
import AuthorService from '../../src/services/author'

const nonExistingId = '5e57b77b5744fa0b461c7906'

async function createAuthor() {
  const author = new Author({
    firstName: 'test-author-firstName',
    lastName: 'test-author-lastName'
  })
  return await AuthorService.create(author)
}

describe( 'Author service', () =>{
  beforeEach( async () =>{
    await dbHelper.connect()
  })

  afterEach( async () =>{
    await dbHelper.clearDatabase()
  })

  afterAll( async ()=>{
    await dbHelper.closeDatabase()
  })

  it ('Should create an Author', async ()=>{
    return await createAuthor()
      .then( author =>{
        expect(author).toHaveProperty('id')
        expect(author).toHaveProperty('firstName')
        expect(author).toHaveProperty('lastName')
      })
  })

  it('should return a Promise',  ()=> {
    return createAuthor().then( author => {
      expect(author).toHaveProperty('id')
      expect(author).toHaveProperty('firstName')
      expect(author).toHaveProperty('lastName')
    })
  })

  it('should get a author with id', async () => {
    const author = await createAuthor()
    const found = await AuthorService.findById(author.id as string)

    expect(found.firstName).toEqual(author.firstName)
    expect(found.lastName).toEqual(author.lastName)
    expect(found.id).toEqual(author.id)
  })

  it('should get a error with wrong id', async () => {
    try {
      await AuthorService.findById(nonExistingId)
    } catch (error) {
      expect(error.message).toMatch(`Author ${nonExistingId} not found`)
    }

  })

  it ('should return array of authors', async () => {
    const author = await createAuthor()
    return await AuthorService.findAll()
      .then( authors => {
        expect( authors ).toHaveLength(1)
        expect.arrayContaining(author as any)
      })
  })

  it('should update an existing author', async () => {
    const author = await createAuthor()
    const updateAuthor = {
      id: author.id,
      firstName: 'Updated firstName',
      lastName: 'Updated lastName',
    }
    const updatedAuthor = await AuthorService.update(updateAuthor)
    expect(updatedAuthor).toHaveProperty('id', author.id)
    expect(updatedAuthor).toHaveProperty('firstName', 'Updated firstName')
    expect(updatedAuthor).toHaveProperty('lastName', 'Updated lastName')
  })

  it('should get a error if updating author with wrong id', async () => {
    const author = await createAuthor()
    const updateNonExistingAuthor = {
      id: nonExistingId,
      firstName: 'Wrong firstName',
      lastName: 'Wrong lastName',
    }
    expect.assertions(1)
    return AuthorService.update(updateNonExistingAuthor).catch(error => {
      expect(error.message).toMatch(`Author ${updateNonExistingAuthor.id} not found`)
    })
  })

  it ('should get error if author id is null or undefined while updating' , async () => {
    try {
      await AuthorService.update('')
    } catch ( error ) {
      expect(error.message).toMatch('Author id is missing')
    }
  })

  it('should delete an existing author with correct id', async () => {
    expect.assertions(1)
    const author = await createAuthor()
    await AuthorService.deleteAuthor(author.id)
    return AuthorService.findById(author.id).catch(error => {
      expect(error.message).toBe(`Author ${author.id} not found`)
    })
  })

  it ('should return author if firstName and lastName is given', async () => {
    const author = await createAuthor()
    return await AuthorService.isAuthorExist(author.firstName, author.lastName)
      .then( author => {
        expect(author).toHaveProperty('firstName', 'test-author-firstName')
        expect(author).toHaveProperty('lastName', 'test-author-lastName')
      })
  })

})
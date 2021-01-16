import request from 'supertest'
import { OAuth2Client } from 'google-auth-library'

import app from '../../src/app'
import * as dbHelper from '../db-helper'
import {UserDocument} from '../../src/models/User'

async function createUser( override?: Partial<UserDocument>) {
  let newUser = {
    firstName: 'user firstName',
    lastName: 'user lastName',
    username: '123-username',
    email: 'admin@abc.com',
    password: 't0pS33c8#t',
  }

  if ( override ) {
    newUser = { ...newUser, ...override }
  }

  return await request(app)
    .post('/api/v1/signup')
    .send( newUser )

}

describe ('user controller', () => {
  beforeEach( async () => {
    await dbHelper.connect()
  })

  afterEach( async () => {
    await dbHelper.clearDatabase()
  })

  afterAll( async () => {
    await dbHelper.closeDatabase()
  })

  it('should create a user', async () => {
    const responseOfCreateUser = await createUser()
    expect(responseOfCreateUser.status).toBe(200)
    expect(responseOfCreateUser.body).toHaveProperty('id')
    expect(responseOfCreateUser.body).toHaveProperty('firstName', 'user firstName')
    expect(responseOfCreateUser.body).toHaveProperty('lastName', 'user lastName')
    expect(responseOfCreateUser.body).toHaveProperty('username', '123-username')
    expect(responseOfCreateUser.body).toHaveProperty('email', 'admin@abc.com')
    expect(responseOfCreateUser.body).toHaveProperty('role', 1)
  })

  it('should get error while creating a user with same details', async () => {
    await createUser()

    const responseOfSameCreateUser = await createUser()
    expect(responseOfSameCreateUser.status).toBe(409)
  })

  it('should get a error if any of the details are missing while creating user', async () => {

    const incompleteUser = {
      firstName: 'user firstName',
      lastName: undefined,
      username: '123-username',
      email: 'admin@abc.com',
      password: 't0pS33c8#t',
    }

    const response = await createUser(incompleteUser)

    expect(response.status).toBe(400)

  })

  it('should log user in with username and password', async () => {

    await createUser()

    const userCredentials = {
      username: '123-username',
      password: 't0pS33c8#t'
    }

    const encryptedCredentials = Buffer.from(JSON.stringify(userCredentials)).toString('base64')

    const responseOfLogin = await request(app)
      .post('/api/v1/login')
      .set('credentials', encryptedCredentials)
      .send()

    expect(responseOfLogin.body).toHaveProperty('token')

  })

  it('should get error if username or password is missing', async () => {

    await createUser()

    const userCredentials = {
      username: '123-username',
      password: undefined
    }

    const encryptedCredentials = Buffer.from(JSON.stringify(userCredentials)).toString('base64')

    const responseOfLogin = await request(app)
      .post('/api/v1/login')
      .set('credentials', encryptedCredentials)
      .send()

    expect(responseOfLogin.body.statusCode).toEqual(400)
    expect(responseOfLogin.body.message).toMatch('Invalid username or password')

  })

  it('should get error if username or password is wrong', async () => {

    await createUser()

    const fakeUserCredentials = {
      username: 'fake user',
      password: 'fake password'
    }

    const encodedCredentials = Buffer.from(JSON.stringify(fakeUserCredentials)).toString('base64')

    const responseOfLogin = await request(app)
      .post('/api/v1/login')
      .set('credentials', encodedCredentials)
      .send()

    expect(responseOfLogin.body.statusCode).toEqual(403)
    expect(responseOfLogin.body.message).toMatch('Wrong credentials')

  })

  it('should get a redirect with google auth', async () => {
    const response = await request(app)
      .get('/api/v1/google')
      .send()
    expect(response.status).toEqual(302)
  })

  //Google call back test
  it('should get a error if code is missing', async () => {
    const responseOfGoogleCallBack = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: '' })
      .send()

    expect(responseOfGoogleCallBack.body.statusCode).toEqual(400)
    expect(responseOfGoogleCallBack.body.message).toMatch('code missing')
  })

  it('should get a error if code is wrong', async () => {
    const responseOfGoogleCallBack = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: '45jkjsf345789ashf3894f' })
      .send()

    expect(responseOfGoogleCallBack.status).toBe(401)
    expect(responseOfGoogleCallBack.body.message).toMatch('Unauthorized Request')
  })

  it('should get a token', async () => {

    const getTokenMock = jest.spyOn( OAuth2Client.prototype, 'getToken')
    getTokenMock.mockImplementation(code => {
      return Promise.resolve(
        {
          'tokens': {
            'access_token': 'ya29.a0AfH6SMAOuPnXsVMj1Y7R-3NUfbD3kxKvUKSPdJ67A8VYU47MvJDMpHIlDei04GYMB1IwH9ob21_-pmA95tprI1_rFtr7Wugq0CYMGsAabQTytTG53fgapFf6MI7Q3ZBEq7Tx9YQ76WBoQFA4Jgl3e3wBxeII53-PoUnD',
            'scope': 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform openid',
            'token_type': 'Bearer',
            'id_token': 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImE0MWEzNTcwYjhlM2FlMWI3MmNhYWJjYWE3YjhkMmRiMjA2NWQ3YzEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzNTIzNzc4NDEwOC05cDk3b2Zsamh0dnJwNmwwNGhrODVuYjczdHZzOXF2MC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjM1MjM3Nzg0MTA4LTlwOTdvZmxqaHR2cnA2bDA0aGs4NW5iNzN0dnM5cXYwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTExMTE0NzYwNjk4NjM0MzY3NDAwIiwiaGQiOiJpbnRlZ3JpZnkuaW8iLCJlbWFpbCI6ImFud2FyLnVsaGFxQGludGVncmlmeS5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiQXdTbUIwdi1CWU9STDdMMXVzMmlDQSIsIm5hbWUiOiJBbndhciBVbGhhcSIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLXFVUzRSbXhlQkZZL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y2wweUticWJsV3VQNFZFZm1nQ00tSldlTXB1b0Evczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IkFud2FyIiwiZmFtaWx5X25hbWUiOiJVbGhhcSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNTkzNzg0MjE1LCJleHAiOjE1OTM3ODc4MTV9.IpW-T-XVr6MrsmKCJZysXh_kO8envsXTRtkeLyz4r9IGsmzLQrGKYJLnksnC22YIwTx55PXiTYlCmz2-Quu9XtqoERlCUU5IlDDzhwgFYUdTHYcBmats5VXKXopAQuU6kDGDRN3kh88aNVkJ89bdoe75w1Q5PwmYajcRN-_KbKgJcY9X2BvL4Hde5v9nk0GX4DloJKuCOQ45B7QPVBJXoBv6Tw5ajnKai77K7Is-GIiraBI_PD0eQh32HMsYvLyXc93GdU2v6EeYFONvgvYuzAf_-NTcUadTZW_pYDeAMXozGjen2zkeSluoiHkmRtpbgMO3mRzu3LNepJ4467uoMQ',
            'expiry_date': 1593787937979
          }
        })
      })

    const verifyIdTokenMock = jest.spyOn( OAuth2Client.prototype, 'verifyIdToken')
    verifyIdTokenMock.mockImplementation(() => {
      return Promise.resolve({
        'envelope':
          {
            'alg':'RS256',
            'kid':'a41a3570b8e3ae1b72caabcaa7b8d2db2065d7c1',
            'typ':'JWT'
          },
        'getPayload' : () => {
            return {
              'iss':'https://accounts.google.com',
              'azp':'35237784108-9p97ofljhtvrp6l04hk85nb73tvs9qv0.apps.googleusercontent.com',
              'aud':'35237784108-9p97ofljhtvrp6l04hk85nb73tvs9qv0.apps.googleusercontent.com',
              'sub':'111114760698634367400',
              'hd':'integrify.io',
              'email':'anwar.ulhaq@integrify.io',
              'email_verified':true,
              'at_hash':'2ecO2NgOYYFHV_GOZEqQQA',
              'name':'Anwar Ulhaq',
              'picture':'http s://lh6.googleusercontent.com/-qUS4RmxeBFY/AAAAAAAAAAI/AAAAAAAAAAA/AMZuucl0yKbqblWuP4VEfmgCM-JWeMpuoA/s96-c/photo.jpg',
              'given_name':'Anwar',
              'family_name':'Ulhaq',
              'locale':'en',
              'iat':1593776837,
              'exp':1593780437
            }
          }
        })
    })

    const responseOfGoogleCallBack = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: '45jkjsf345789ashf3894f' })
      .send()

    expect(responseOfGoogleCallBack.status).toBe(200)
    expect(responseOfGoogleCallBack.body).toHaveProperty('token')
  })


  it('should get error fi token payload is empty', async () => {

    const getTokenMock = jest.spyOn( OAuth2Client.prototype, 'getToken')
    getTokenMock.mockImplementation(code => {
      return Promise.resolve(
        {
          'tokens': {
            'access_token': 'ya29.a0AfH6SMAOuPnXsVMj1Y7R-3NUfbD3kxKvUKSPdJ67A8VYU47MvJDMpHIlDei04GYMB1IwH9ob21_-pmA95tprI1_rFtr7Wugq0CYMGsAabQTytTG53fgapFf6MI7Q3ZBEq7Tx9YQ76WBoQFA4Jgl3e3wBxeII53-PoUnD',
            'scope': 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform openid',
            'token_type': 'Bearer',
            'id_token': 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImE0MWEzNTcwYjhlM2FlMWI3MmNhYWJjYWE3YjhkMmRiMjA2NWQ3YzEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzNTIzNzc4NDEwOC05cDk3b2Zsamh0dnJwNmwwNGhrODVuYjczdHZzOXF2MC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjM1MjM3Nzg0MTA4LTlwOTdvZmxqaHR2cnA2bDA0aGs4NW5iNzN0dnM5cXYwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTExMTE0NzYwNjk4NjM0MzY3NDAwIiwiaGQiOiJpbnRlZ3JpZnkuaW8iLCJlbWFpbCI6ImFud2FyLnVsaGFxQGludGVncmlmeS5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiQXdTbUIwdi1CWU9STDdMMXVzMmlDQSIsIm5hbWUiOiJBbndhciBVbGhhcSIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLXFVUzRSbXhlQkZZL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y2wweUticWJsV3VQNFZFZm1nQ00tSldlTXB1b0Evczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IkFud2FyIiwiZmFtaWx5X25hbWUiOiJVbGhhcSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNTkzNzg0MjE1LCJleHAiOjE1OTM3ODc4MTV9.IpW-T-XVr6MrsmKCJZysXh_kO8envsXTRtkeLyz4r9IGsmzLQrGKYJLnksnC22YIwTx55PXiTYlCmz2-Quu9XtqoERlCUU5IlDDzhwgFYUdTHYcBmats5VXKXopAQuU6kDGDRN3kh88aNVkJ89bdoe75w1Q5PwmYajcRN-_KbKgJcY9X2BvL4Hde5v9nk0GX4DloJKuCOQ45B7QPVBJXoBv6Tw5ajnKai77K7Is-GIiraBI_PD0eQh32HMsYvLyXc93GdU2v6EeYFONvgvYuzAf_-NTcUadTZW_pYDeAMXozGjen2zkeSluoiHkmRtpbgMO3mRzu3LNepJ4467uoMQ',
            'expiry_date': 1593787937979
          }
        })
    })

    const verifyIdTokenMock = jest.spyOn( OAuth2Client.prototype, 'verifyIdToken')
    verifyIdTokenMock.mockImplementation(() => {
      return Promise.resolve({
          'envelope':
            {
              'alg':'RS256',
              'kid':'a41a3570b8e3ae1b72caabcaa7b8d2db2065d7c1',
              'typ':'JWT'
            },
          'getPayload' : () => {
            return null
          }
        }
      )
    })

    const responseOfGoogleCallBack = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: '45jkjsf345789ashf3894f' })
      .send()

    expect(responseOfGoogleCallBack.body.statusCode).toBe(400)
    expect(responseOfGoogleCallBack.body.message).toMatch('User details are missing from ticket')

  })


  it('should get error if user details are missing from token', async () => {

    const getTokenMock = jest.spyOn( OAuth2Client.prototype, 'getToken')
    getTokenMock.mockImplementation(code => {
      return Promise.resolve(
        {
          'tokens': {
            'access_token': 'ya29.a0AfH6SMAOuPnXsVMj1Y7R-3NUfbD3kxKvUKSPdJ67A8VYU47MvJDMpHIlDei04GYMB1IwH9ob21_-pmA95tprI1_rFtr7Wugq0CYMGsAabQTytTG53fgapFf6MI7Q3ZBEq7Tx9YQ76WBoQFA4Jgl3e3wBxeII53-PoUnD',
            'scope': 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform openid',
            'token_type': 'Bearer',
            'id_token': 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImE0MWEzNTcwYjhlM2FlMWI3MmNhYWJjYWE3YjhkMmRiMjA2NWQ3YzEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzNTIzNzc4NDEwOC05cDk3b2Zsamh0dnJwNmwwNGhrODVuYjczdHZzOXF2MC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjM1MjM3Nzg0MTA4LTlwOTdvZmxqaHR2cnA2bDA0aGs4NW5iNzN0dnM5cXYwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTExMTE0NzYwNjk4NjM0MzY3NDAwIiwiaGQiOiJpbnRlZ3JpZnkuaW8iLCJlbWFpbCI6ImFud2FyLnVsaGFxQGludGVncmlmeS5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiQXdTbUIwdi1CWU9STDdMMXVzMmlDQSIsIm5hbWUiOiJBbndhciBVbGhhcSIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLXFVUzRSbXhlQkZZL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y2wweUticWJsV3VQNFZFZm1nQ00tSldlTXB1b0Evczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IkFud2FyIiwiZmFtaWx5X25hbWUiOiJVbGhhcSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNTkzNzg0MjE1LCJleHAiOjE1OTM3ODc4MTV9.IpW-T-XVr6MrsmKCJZysXh_kO8envsXTRtkeLyz4r9IGsmzLQrGKYJLnksnC22YIwTx55PXiTYlCmz2-Quu9XtqoERlCUU5IlDDzhwgFYUdTHYcBmats5VXKXopAQuU6kDGDRN3kh88aNVkJ89bdoe75w1Q5PwmYajcRN-_KbKgJcY9X2BvL4Hde5v9nk0GX4DloJKuCOQ45B7QPVBJXoBv6Tw5ajnKai77K7Is-GIiraBI_PD0eQh32HMsYvLyXc93GdU2v6EeYFONvgvYuzAf_-NTcUadTZW_pYDeAMXozGjen2zkeSluoiHkmRtpbgMO3mRzu3LNepJ4467uoMQ',
            'expiry_date': 1593787937979
          }
        })
    })

    const verifyIdTokenMock = jest.spyOn( OAuth2Client.prototype, 'verifyIdToken')
    verifyIdTokenMock.mockImplementation(() => {
      return Promise.resolve({
          'envelope':
            {
              'alg':'RS256',
              'kid':'a41a3570b8e3ae1b72caabcaa7b8d2db2065d7c1',
              'typ':'JWT'
            },
          'getPayload' : () => {
            return {
              'iss':'https://accounts.google.com',
              'azp':'35237784108-9p97ofljhtvrp6l04hk85nb73tvs9qv0.apps.googleusercontent.com',
              'aud':'35237784108-9p97ofljhtvrp6l04hk85nb73tvs9qv0.apps.googleusercontent.com',
              'sub':'',
              'hd':'integrify.io',
              'email':'anwar.ulhaq@integrify.io',
              'email_verified':true,
              'at_hash':'2ecO2NgOYYFHV_GOZEqQQA',
              'name':'Anwar Ulhaq',
              'picture':'http s://lh6.googleusercontent.com/-qUS4RmxeBFY/AAAAAAAAAAI/AAAAAAAAAAA/AMZuucl0yKbqblWuP4VEfmgCM-JWeMpuoA/s96-c/photo.jpg',
              'given_name':'Anwar',
              'family_name':'Ulhaq',
              'locale':'en',
              'iat':1593776837,
              'exp':1593780437
            }
          }
        }
      )
    })

    const responseOfGoogleCallBack = await request(app)
      .get('/api/v1/auth/google/callback')
      .query({ code: '45jkjsf345789ashf3894f' })
      .send()

    expect(responseOfGoogleCallBack.body.statusCode).toBe(400)
    expect(responseOfGoogleCallBack.body.message).toMatch('First Name, Last Name, Username, email or domain is missing.')

  })

})
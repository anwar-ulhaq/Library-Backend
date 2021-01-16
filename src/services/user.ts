import User, {UserDocument} from '../models/User'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {JWT_SECRET} from '../util/secrets'


const createToken = (id: string, role: number): string => {
  return jwt.sign({id: id, role: role,  }, JWT_SECRET, { expiresIn: '24h'})
}

function create(user: UserDocument): Promise<UserDocument> {
  return user.save()
  //TODO use schema post to ensure.
}

function findByUsername(username: string): Promise<UserDocument | null> {
  return User
    .findOne({username})
    .exec()
}

function findByEmail(email: string): Promise<UserDocument | null> {
  return User
    .findOne({email})
    .exec()
}

async function authenticate(username: string, password: string): Promise<any> {
  const user = await User.findOne({username})
  if ( user && await user.verifyPassword(password)) {
    // TODO define more payload and options in Secret.js
    const token = jwt.sign({
      id: user.id,
      role: user.role,
    }, JWT_SECRET, {
      expiresIn: '24h' // expires in 24 hours
    })
    return {
      ...user.toJSON(),
      token
    }
  } else {
    throw new Error('User verification failed')
  }
}

// userID = sub, userEmail = email, verifiedEmail= email_verified
// firstName = given_name, lastName = family_name
// role depends on hd
async function generateToken(
  firstName: string,
  lastName: string,
  username: string,
  email: string,
  domainName: string
): Promise<string> {
  const role = domainName === 'integrify.io' ? 0 : 1
  return createToken(username, role)
}

export default {
  create,
  generateToken,
  findByUsername,
  findByEmail,
  authenticate,
  createToken,
}
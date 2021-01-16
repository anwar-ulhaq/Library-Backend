// TODO or not TODO

/*
// generates token
// verify token
/!*
* JWT has 3 parts separated by periods '.'
* Part 1, describes the token along with the hashing algorithm used
* Part 2, core of the token.
* Part 3, is a signature generated based on the header (part one) and the body (part two).
*
* https://tools.ietf.org/html/draft-ietf-oauth-json-web-token-19
* *!/
//var uuid = require('uuid');
//var nJwt = require('njwt');
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../util/secrets'
const claims = {
  'iss': 'url'      // The URL of your service // issuer //specifies the person or entity making the request. Typically, this would be the user accessing the API.
  'sub': "1234567890",  // The UID of the user in your system
  'name': "John Doe",
  'admin': true,
  'jti': "f5d2282c-0676-4b01-ab2d-c94f93b1906a",
  //'iat': 1591837589,    //the time at which the token was issued
  //'exp': 1591841189,    //expires
  'myNamw': "Hello"
  //nbf is optional     //(Not Before) to indicate the token should not be accepted before a certain time
  //aud (audience) to indicate the recipients the token is intended for.
}

const signingKey = JWT_SECRET

var jwt1 = nJwt.create(claims,"secret","HS256");
var token = jwt.compact();
*/

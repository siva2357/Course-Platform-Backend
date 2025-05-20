const { hash } = require ('bcryptjs')
const { compare } =require('bcryptjs');
const { createHmac} = require ('crypto');

exports.doHash = async (value, saltValue) => {
  return await hash(value, Number(saltValue)); // Ensure salt is a valid number
};

exports.doHashValidation = (value,hashedValue) =>{ const result = compare(value,hashedValue); return result;}

exports.hmacProcess = ( value, key) =>{ const result =createHmac('sha256',key).update(value).digest('hex')
return result
}

import bcrypt from 'bcrypt';

const SALT_ROUND = 10 

// Funcion para crear el hash

export async function createHash(Password){
    try {
    // genero el hash con el numero de saltos
    const hashPassword = await bcrypt.hash(Password,SALT_ROUND) 

    return hashPassword
    } catch (error) {
        return null
    }
}

export async function verifyPassword(Password,hash) {
    try {

    const truePassword = await bcrypt.compare(Password,hash)

    return truePassword
    } catch (error) {
        return false; // throw error para que tome el error
    }
}
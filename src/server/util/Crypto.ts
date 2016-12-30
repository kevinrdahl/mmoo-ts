/// <reference path='../../../declarations/node.d.ts' />

import * as crypto from 'crypto';

/**
 * SHA512 hashes a string. Salt is randomly created if not specified. Resulting string includes the hash and salt separated by '|'
 */
export function hashPassword(pass:string, salt:string=null) {
	if (salt === null) salt = crypto.randomBytes(128/8).toString('base64');

	var hash:crypto.Hash = crypto.createHash('sha512');

	hash.update(pass + salt);

	var hashString:string = hash.digest('base64') + '|' + salt;

	return hashString;
}

/**
 * Hashes pass using the same salt as the hash string provided (assuming the format output by hashPassword) and checks for equality
 */
export function checkPassword(pass:string, hash:string) {
	var split = hash.split('|');
	if (split.length !== 2) return false;

	var salt = split[1];
	return (hashPassword(pass, salt) == hash);
}
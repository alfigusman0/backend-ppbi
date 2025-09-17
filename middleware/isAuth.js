/* config */
const redis = require('../config/redis');
/* Libraries */
const jwt = require('jsonwebtoken');
const md5 = require('md5');
/* Helpers */
const helper = require('../helpers/helper');
const response = require('../helpers/response');
/* Validation */
const isEmpty = require('../validation/is-empty');

const redisPrefix = process.env.REDIS_PREFIX + "session:";

module.exports = async (req, res, next) => {
  let token = req.header('authorization') || req.header('token');
  let json = {};
  let decodedToken;

  /* Check empty token */
  if (isEmpty(token) || typeof token !== 'string') {
    return response.sc401('token cannot be empty.', json, res);
  }

  token = token.split(" ");
  if (token.length < 2 || isEmpty(token[1])) {
    message = 'invalid token format.';
    return response.sc401(message, json, res);
  }

  try {
    /* Check existing data */
    if (process.env.SESSIONS === 'REDIS') {
      const key = redisPrefix + md5(token[1]);
      const redisData = await redis.get(key);
      if (!redisData) {
        return response.sc401('expired tokens.', json, res);
      }
      const data = JSON.parse(redisData);
      if (data.expired === 'YA' || data.keterangan !== 'LOGIN') {
        return response.sc401('expired tokens.', json, res);
      }
    } else if (process.env.SESSIONS === 'DATABASE') {
      let checkData = await helper.runSQL({
        sql: "SELECT token FROM `ci_jwt` WHERE `token` LIKE ? AND `expired` = ? LIMIT 1",
        param: [token[1], 'TIDAK'],
      });
      if (checkData.length == 0) {
        return response.sc401('expired tokens.', json, res);
      }
    }

    /* Verify JWT */
    decodedToken = jwt.verify(token[1], process.env.JWT_SECRET);
  } catch (err) {
    console.error('JWT Error:', err);
    return response.sc401("invalid tokens!", json, res);
  }

  if (!decodedToken) {
    return response.sc401("invalid decode tokens!", json, res);
  }

  req.authToken = token[1];
  req.authUserTime = decodedToken.userTime;
  req.authApp = decodedToken.app;
  req.authIdUser = decodedToken.id_user;
  req.authNama = decodedToken.nama;
  req.authEmail = decodedToken.email;
  req.authUsername = decodedToken.username;
  req.authNmrTlpn = decodedToken.nmr_tlpn;
  req.authMandiri = decodedToken.mandiri;
  req.authIdsLevel = decodedToken.ids_level;
  req.authLevel = decodedToken.level;
  req.authTingkat = decodedToken.tingkat;
  req.authIdsGrup = decodedToken.ids_grup;
  req.authGrup = decodedToken.grup;
  req.authKeterangan = decodedToken.keterangan;
  req.authLoginAs = decodedToken.login_as;
  req.authIdAdmin = decodedToken.id_admin;

  next();
};
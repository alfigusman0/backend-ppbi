const response = {};

// 200 OK - Indicates that the request has succeeded.
response.sc200 = function (message, values, res) {
  let data = {
    code: 200,
    status: "success",
    message: message,
    data: values
  };

  res.json(data);
  res.end();
};

// 201 Created - Indicates that the request has succeeded and a new resource has been created as a result.
response.sc201 = function (message, values, res) {
  let data = {
    code: 201,
    status: "success",
    message: message,
    data: values
  };

  res.json(data);
  res.end();
};

// 202 Accepted - Indicates that the request has been received but not completed yet. It is typically used in log running requests and batch processing.
response.sc202 = function (message, values, res) {
  let data = {
    code: 202,
    status: "success",
    message: message,
    data: values
  };

  res.status(202).json(data);
  res.end();
};

// 204 No Content - The server has fulfilled the request but does not need to return a response body. The server may return the updated meta information.
response.sc204 = function (message, values, res) {
  let data = {
    code: 204,
    status: "success",
    message: message,
    data: values
  };

  res.status(204).json(data);
  res.end();
};

// 301 Moved Permanently - The URL of the requested resource has been changed permanently. The new URL is given by the Location header field in the response. This response is cacheable unless indicated otherwise.
response.sc301 = function (message, values, res) {
  let data = {
    code: 301,
    status: "client error",
    message: message,
    data: values
  };

  res.status(301).json(data);
  res.end();
};

// 302 Found - The URL of the requested resource has been changed temporarily. The new URL is given by the Location field in the response. This response is only cacheable if indicated by a Cache-Control or Expires header field.
response.sc302 = function (message, values, res) {
  let data = {
    code: 302,
    status: "client error",
    message: message,
    data: values
  };

  res.status(302).json(data);
  res.end();
};

// 303 See Other - The response can be found under a different URI and SHOULD be retrieved using a GET method on that resource.
response.sc303 = function (message, values, res) {
  let data = {
    code: 303,
    status: "client error",
    message: message,
    data: values
  };

  res.status(303).json(data);
  res.end();
};

// 304 Not Modified - Indicates the client that the response has not been modified, so the client can continue to use the same cached version of the response.
response.sc304 = function (message, values, res) {
  let data = {
    code: 304,
    status: "client error",
    message: message,
    data: values
  };

  res.status(304).json(data);
  res.end();
};

// 307 Temporary Redirect - Indicates the client to get the requested resource at another URI with same method that was used in the prior request. It is similar to 302 Found with one exception that the same HTTP method will be used that was used in the prior request.
response.sc307 = function (message, values, res) {
  let data = {
    code: 307,
    status: "client error",
    message: message,
    data: values
  };

  res.status(307).json(data);
  res.end();
};

// 400 Bad Request - The request could not be understood by the server due to incorrect syntax. The client SHOULD NOT repeat the request without modifications.
response.sc400 = function (message, values, res) {
  let data = {
    code: 400,
    status: "client error",
    message: message,
    data: values
  };

  res.status(400).json(data);
  res.end();
};

// 401 Unauthorized - Indicates that the request requires user authentication information. The client MAY repeat the request with a suitable Authorization header field
response.sc401 = function (message, values, res) {
  let data = {
    code: 401,
    status: "client error",
    message: message,
    data: values
  };

  res.status(401).json(data);
  res.end();
};

// 402 Payment Required (Experimental) - Reserved for future use. It is aimed for using in the digital payment systems.
response.sc402 = function (message, values, res) {
  let data = {
    code: 402,
    status: "client error",
    message: message,
    data: values
  };

  res.status(402).json(data);
  res.end();
};

// 403 Forbidden - Unauthorized request. The client does not have access rights to the content. Unlike 401, the client’s identity is known to the server.
response.sc403 = function (message, values, res) {
  let data = {
    code: 403,
    status: "client error",
    message: message,
    data: values
  };

  res.status(403).json(data);
  res.end();
};

// 404 Not Found - The server can not find the requested resource.
response.sc404 = function (message, values, res) {
  let data = {
    code: 404,
    status: "client error",
    message: message,
    data: values
  };

  res.status(404).json(data);
  res.end();
};

// 405 Method Not Allowed - The request HTTP method is known by the server but has been disabled and cannot be used for that resource.
response.sc405 = function (message, values, res) {
  let data = {
    code: 405,
    status: "client error",
    message: message,
    data: values
  };

  res.status(405).json(data);
  res.end();
};

// 406 Not Acceptable - The server doesn’t find any content that conforms to the criteria given by the user agent in the Accept header sent in the request.
response.sc406 = function (message, values, res) {
  let data = {
    code: 406,
    status: "client error",
    message: message,
    data: values
  };

  res.status(406).json(data);
  res.end();
};

// 412 Precondition Failed The client has indicated preconditions in its headers which the server does not meet.
response.sc412 = function (message, values, res) {
  let data = {
    code: 412,
    status: "client error",
    message: message,
    data: values
  };

  res.status(412).json(data);
  res.end();
};

// 415 Unsupported Media Type - The media-type in Content-type of the request is not supported by the server. (RFC 2324)
response.sc415 = function (message, values, res) {
  let data = {
    code: 415,
    status: "client error",
    message: message,
    data: values
  };

  res.status(415).json(data);
  res.end();
};

// 500 Internal Server Error - The server encountered an unexpected condition that prevented it from fulfilling the request.
response.sc500 = function (message, values, res) {
  let data = {
    code: 500,
    status: "server error",
    message: message,
    data: values
  };

  res.status(500).json(data);
  res.end();
};

// 501 Not Implemented - The HTTP method is not supported by the server and cannot be handled.
response.sc501 = function (message, values, res) {
  let data = {
    code: 501,
    status: "server error",
    message: message,
    data: values
  };

  res.status(501).json(data);
  res.end();
};

module.exports = response;
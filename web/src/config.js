module.exports = {
    server_host: process.env.REACT_APP_SERVER_HOST || "http://localhost",
    server_port: process.env.REACT_APP_SERVER_PORT || "8000",
    node_env: process.env.REACT_APP_NODE_ENV || "development"
  };
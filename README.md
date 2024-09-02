Server requires Node.JS

The easiest way to run the server is to open it in VS Code then:

1. Run the tsc: build command on tsconfig.json to build the server and client.
2. Run a web server. I like to just use the Live Server extension.
3. Run the server code using Node.JS, which can be done by running it from VS Code.

Now you can connect to your webserver from a browser to start the client.


To connect the client to the game's server:

1. Open the browser's console and type 'connect("ws://127.0.0.1")' to connect to the local host.
2. The client should quickly connect to the server be able to move around.

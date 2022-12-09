const express = require("express");
const { Server: HttpServer } = require("http");
const { Server: IOServer } = require("socket.io");
const { engine } = require("express-handlebars");

// server, socket y api
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const PORT = process.env.PORT || 8080;

const Contenedor = require("./contenedor");
const contenedor = new Contenedor("productos.json");
const chat = new Contenedor("chat.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//views motores de plantilla:
app.set("views", "./src/views");
app.set("view engine", "hbs");

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "index.hbs",
    layoutsDir: __dirname + "/views/layouts",
    partialsDir: __dirname + "/views/partials",
  }),
)

// socket
io.on("connection", async (socket) => {
  console.log(" user conectado");;

  
  const productos = await contenedor.getAll()
  socket.emit("listaInicial", productos);

  const mensajes = await chat.getAll()
  socket.emit("listaMensajes", mensajes);

 
  socket.on("nuevoMensaje", async (data) => {
    await chat.save(data)

    const mensajes = await chat.getAll()
    io.sockets.emit("listaMensajesActualizada", mensajes)
  });

 
  socket.on("productoAgregado", async (data) => {
    console.log("producto agregado");
    await contenedor.save(data);

    const productos = await contenedor.getAll()
    io.sockets.emit("listaActualizada", productos);
  });

  socket.on("disconnect", () => {
    console.log("User desconectado");
  });
});

app.get("/productos", async (req, res) => {
  const productos = await contenedor.getAll()
  res.render("pages/list", { productos });
});

app.post("/productos", async (req, res) => {
  const { body } = req
  await contenedor.save(body)
  res.redirect("/")
});

app.get("/", (req, res) => {
  res.render("pages/form", {})
});


httpServer.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`)
});

httpServer.on("error", (err) => console.log(err));
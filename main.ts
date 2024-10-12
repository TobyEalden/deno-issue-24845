import grpc from "npm:@grpc/grpc-js";
import protoLoader from "npm:@grpc/proto-loader";

const PROTO_PATH = "./route_guide.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const routeProto = grpc.loadPackageDefinition(packageDefinition).routeguide;

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const client = new routeProto.RouteGuide(
    "localhost:50051",
    grpc.credentials.createInsecure()
  );

  const location = { latitude: 419999544, longitude: -740371136 };
  let timer;

  const call = client.RouteChat();

  call.on("data", (msg) => {
    console.log("received message: ", msg);
  });

  call.on("status", (statusObject) => {
    console.log(
      `received call status with code ${grpc.status[statusObject.code]}`
    );
  });

  call.on("error", (error) => {
    console.log(`received error ${error}`);
    clearInterval(timer);
  });

  call.on("end", () => {
    console.log("received end");
    clearInterval(timer);
  });

  timer = setInterval(() => {
    call.write({
      location,
      message: "hello",
    });
  }, 1000);
}

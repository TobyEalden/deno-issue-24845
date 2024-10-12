# Deno gRPC bug reproduction

This repo aims to reproduce the bug described at https://github.com/denoland/deno/issues/24845.

It requires patching the grpc C++ 'route_guide' example so that it ends the bidirectional 'RouteChat' call after sending a few messages.

This causes the deno runtime to crash with the `not a result of an error` message.

## patch the c++ route_guide server example
The crash is caused by the server ending a bidirectional stream.

To reproduce this, we change the implementation of the `RouteChat` method in the C++ server to end the stream after sending 4 messages.

Replace the code at https://github.com/grpc/grpc/blob/master/examples/cpp/route_guide/route_guide_server.cc#L149-L164 with the following:

```c++
Status RouteChat(ServerContext *context,
                  ServerReaderWriter<RouteNote, RouteNote> *stream) override {
    RouteNote note;
    auto count = 0;
    while (stream->Read(&note)) {
        if (++count > 4) {
            // End the stream after 4 notes, finishing with Status::OK.
            break;
        }
        // Echo the note back to the client.
        stream->Write(note);
    }

    return Status::OK;
}
```

## build the patched server

Follow the usual steps for building the 'route_guide' example from the grpc repo.

This assumes you have already cloned and built the grpc repo.

```sh
cd grpc/examples/cpp/route_guide
mkdir -p cmake/build
pushd cmake/build
cmake -DCMAKE_PREFIX_PATH=<path-to-your-grpc-installation> ../..
make
popd
```

## run the patched server

Run the patched server from the source directory so that it can find the `route_guide_db.json` file.

```sh
cmake/build/route_guide_server
```

## run the deno client

Run the deno client from the root of this repo.

```sh
deno run -A main.ts
```

The client will crash with the following message:

```
❯ deno run -A main.ts
received message:  {
  location: { latitude: 419999544, longitude: -740371136 },
  message: "hello"
}
received message:  {
  location: { latitude: 419999544, longitude: -740371136 },
  message: "hello"
}
received message:  {
  location: { latitude: 419999544, longitude: -740371136 },
  message: "hello"
}
received message:  {
  location: { latitude: 419999544, longitude: -740371136 },
  message: "hello"
}
error: Uncaught (in promise) Error: stream error received: not a result of an error
    at async node:http2:824:44

```



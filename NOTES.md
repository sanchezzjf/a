# NOTES

## Modulos

* jest - Biblioteca de testes
* pino
* pino-pretty
* socket.io
* BusBOY

npm install -D 
npm install (sem -D) -- produção

## NodeJS Streams // Pipelines

Think about it like it is a golden nugget, all the processes of melting, filtering and making a golden bar.

* Readable Streams - Like melting, work with the files in chunks, processing some bytes at a time
    * Data Source
* Transform Streams - Get the data and transforming then(like if you want to add something)
    * Data mapping and processing
* Writable Streams - The golden bar, the full file at your dispose
    * Data Destination
import Busboy from 'busboy';
import { pipeline } from 'stream/promises';
import fs from 'fs'
import { logger } from './logger.js'

export default class UploadHandler {
    constructor({io, socketId, downloadsFolder, messageTimeDelay = 200}){
        this.io = io
        this.socketId = socketId
        this.downloadsFolder = downloadsFolder
        this.ON_UPLOAD_EVENT = 'file-upload'
        this.messageTimeDelay = messageTimeDelay
    }
    //to notify the client without break the service
    canExecute(lastExecution){
        return (Date.now() - lastExecution) >= this.messageTimeDelay
    }

    handleFileBytes(filename){
        this.lastMsgSent = Date.now()

        async function* handleData(source){
            let processedAlready = 0

            for await(const chunk of source){
                yield chunk

                processedAlready += chunk.length

                if(!this.canExecute(this.lastMsgSent)){
                    continue
                }

                this.lastMsgSent = Date.now()
                this.io.to(this.socketId).emit(this.ON_UPLOAD_EVENT, { processedAlready, filename })
                logger.info(`File [${filename}] got ${processedAlready} bytes to ${this.socketId}`)
            }
        }
        return handleData.bind(this)
    }

    async onFile(fieldname, file, filename) {
        const saveTo = `${this.downloadsFolder}/${filename}`

        await pipeline(
            // 1 - get readable stream
            file,
            // 2 - filter, convert and transform the data
            this.handleFileBytes.apply(this, [filename]),
            //3 - output of the procces, writable stream
            fs.createWriteStream(saveTo)
        )
        logger.info(`File [${filename}] finished`)
    }
    registerEvents(headers, onFinish){
        const busboy = new Busboy({ headers })
        busboy.on('file', this.onFile.bind(this))
        busboy.on('finish', onFinish)

        return busboy
    }
}